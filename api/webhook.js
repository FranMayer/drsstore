// VOLT Store - Webhook de Mercado Pago (Vercel Serverless)
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Resend } from 'resend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Inicializar Firebase Admin (solo una vez)
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

const db = getFirestore();

// Inicializar Resend para emails
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // Solo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
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
        const docRef = await db.collection('orders').add({
            ...order,
            created_at: new Date()
        });
        console.log('💾 Orden guardada en Firebase:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error guardando en Firebase:', error);
    }
}

// Función para enviar email de notificación
async function sendOrderNotification(order) {
    try {
        // Si no hay API key de Resend, saltar
        if (!process.env.RESEND_API_KEY) {
            console.log('⚠️ RESEND_API_KEY no configurada, saltando email');
            return;
        }

        const itemsList = order.items.length > 0 
            ? order.items.map(i => `• ${i.title} x${i.quantity} - $${i.unit_price}`).join('\n')
            : 'Ver detalles en Mercado Pago';

        await resend.emails.send({
            from: 'VOLT Store <onboarding@resend.dev>',
            to: process.env.OWNER_EMAIL,
            subject: `🛒 Nueva venta - $${order.amount} - VOLT Store`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ff3333;">⚡ VOLT Store</h1>
                        <p style="margin: 5px 0 0 0; color: #888;">Nueva orden recibida</p>
                    </div>
                    
                    <div style="padding: 20px; background: #f5f5f5;">
                        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                            <h2 style="color: #1a1a1a; margin-top: 0;">✅ Pago Aprobado</h2>
                            
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>ID de Pago:</strong></td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${order.payment_id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Monto:</strong></td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #22c55e; font-weight: bold;">$${order.amount} ARS</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Cliente:</strong></td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${order.payer_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${order.payer_email}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Referencia:</strong></td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${order.external_reference}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>Fecha:</strong></td>
                                    <td style="padding: 8px 0;">${new Date(order.created_at).toLocaleString('es-AR')}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px;">
                            <h3 style="margin-top: 0; color: #1a1a1a;">📦 Productos</h3>
                            <pre style="background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto;">${itemsList}</pre>
                        </div>
                    </div>
                    
                    <div style="background: #1a1a1a; color: #888; padding: 15px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">Este email fue generado automáticamente por VOLT Store</p>
                    </div>
                </div>
            `
        });

        console.log('📧 Email enviado a:', process.env.OWNER_EMAIL);

    } catch (error) {
        console.error('❌ Error enviando email:', error);
    }
}
