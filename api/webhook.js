// VOLT Store - Webhook de Mercado Pago (Vercel Serverless)
import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

// Firebase se inicializa de forma lazy para evitar errores al cargar
let db = null;
let firebaseInitialized = false;
let firebaseError = null;

async function getFirebaseDb() {
    if (firebaseInitialized) {
        return db;
    }
    
    try {
        console.log('🔥 Inicializando Firebase Admin...');
        console.log('📋 Project ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('📋 Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Presente' : '❌ Falta');
        console.log('📋 Private Key:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Presente' : '❌ Falta');
        
        // Importar Firebase Admin dinámicamente
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        
        if (!getApps().length) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                })
            });
        }
        
        db = getFirestore();
        firebaseInitialized = true;
        console.log('✅ Firebase Admin inicializado correctamente');
        return db;
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error.message);
        console.error('❌ Stack:', error.stack);
        firebaseError = error.message;
        return null;
    }
}

// Inicializar Resend para emails
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    console.log('🚀 Webhook recibido - Método:', req.method);
    
    // Solo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        console.log('📦 Body recibido:', JSON.stringify(req.body));
        
        // Verificar firma del webhook (seguridad)
        const signature = req.headers['x-signature'];
        const requestId = req.headers['x-request-id'];
        
        if (signature && process.env.MP_WEBHOOK_SECRET) {
            const [ts, v1] = signature.split(',').map(part => part.split('=')[1]);
            const dataId = req.query['data.id'] || req.body?.data?.id;
            
            // Crear el manifest para verificar
            const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
            const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET);
            hmac.update(manifest);
            const expectedSignature = hmac.digest('hex');
            
            if (expectedSignature !== v1) {
                console.log('⚠️ Firma inválida - posible ataque');
                return res.status(401).json({ error: 'Firma inválida' });
            }
            console.log('✅ Firma verificada correctamente');
        }

        const { type, data } = req.body;

        console.log('📩 Webhook recibido:', type, data);

        // Solo procesar notificaciones de pago
        if (type === 'payment') {
            const client = new MercadoPagoConfig({ 
                accessToken: process.env.MP_ACCESS_TOKEN 
            });

            const payment = new Payment(client);
            
            // Obtener detalles del pago
            const paymentInfo = await payment.get({ id: data.id });

            const orderData = {
                payment_id: paymentInfo.id,
                status: paymentInfo.status,
                amount: paymentInfo.transaction_amount,
                payer_email: paymentInfo.payer?.email || 'No disponible',
                payer_name: paymentInfo.payer?.first_name || 'Cliente',
                external_reference: paymentInfo.external_reference,
                items: paymentInfo.additional_info?.items || [],
                created_at: new Date().toISOString(),
                payment_method: paymentInfo.payment_method_id || 'N/A'
            };

            console.log('💳 Orden:', orderData);

            // Guardar en Firebase (siempre, para tener historial)
            await saveOrderToFirebase(orderData);

            // Si el pago fue APROBADO, enviar email
            if (paymentInfo.status === 'approved') {
                console.log('✅ Pago APROBADO:', paymentInfo.id);
                await sendOrderNotification(orderData);
            }
        }

        // Siempre responder 200 para que MP no reintente
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Error en webhook:', error);
        return res.status(200).json({ received: true, error: error.message });
    }
}

// Guardar orden en Firebase
async function saveOrderToFirebase(order) {
    try {
        const firebaseDb = await getFirebaseDb();
        
        if (!firebaseDb) {
            console.error('❌ No se pudo conectar a Firebase');
            return null;
        }
        
        const docRef = await firebaseDb.collection('orders').add({
            ...order,
            created_at: new Date()
        });
        console.log('💾 Orden guardada en Firebase:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error guardando en Firebase:', error.message);
        return null;
    }
}

// Función para enviar email de notificación (opcional)
async function sendOrderNotification(order) {
    try {
        // Si no hay API key de Resend, saltar
        if (!process.env.RESEND_API_KEY || !process.env.OWNER_EMAIL) {
            console.log('⚠️ Email no configurado, saltando notificación');
            return;
        }

        // Importar Resend dinámicamente
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const itemsList = order.items && order.items.length > 0 
            ? order.items.map(i => `• ${i.title} x${i.quantity} - $${i.unit_price}`).join('\n')
            : 'Ver detalles en Mercado Pago';

        await resend.emails.send({
            from: 'VOLT Store <onboarding@resend.dev>',
            to: process.env.OWNER_EMAIL,
            subject: `🛒 Nueva venta - $${order.amount} - VOLT Store`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #C1121F;">⚡ VOLT Store - Nueva Venta</h1>
                    <p><strong>ID Pago:</strong> ${order.payment_id}</p>
                    <p><strong>Monto:</strong> $${order.amount} ARS</p>
                    <p><strong>Cliente:</strong> ${order.payer_name} (${order.payer_email})</p>
                    <p><strong>Productos:</strong></p>
                    <pre>${itemsList}</pre>
                </div>
            `
        });

        console.log('📧 Email enviado a:', process.env.OWNER_EMAIL);

    } catch (error) {
        console.error('❌ Error enviando email (no crítico):', error.message);
    }
}
