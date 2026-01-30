// VOLT Store - Webhook de Mercado Pago (Vercel Serverless)

export default async function handler(req, res) {
    console.log('🚀 Webhook recibido - Método:', req.method);
    
    // Solo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        console.log('📦 Body recibido:', JSON.stringify(req.body));
        
        const { type, data } = req.body || {};
        console.log('📩 Tipo:', type, 'Data:', data);

        // Solo procesar notificaciones de pago
        if (type === 'payment' && data?.id) {
            console.log('💳 Procesando pago ID:', data.id);
            
            // Importar Mercado Pago dinámicamente
            const { MercadoPagoConfig, Payment } = await import('mercadopago');
            
            const client = new MercadoPagoConfig({ 
                accessToken: process.env.MP_ACCESS_TOKEN 
            });

            const payment = new Payment(client);
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

            console.log('💳 Orden:', JSON.stringify(orderData));

            // Guardar en Firebase
            try {
                const { initializeApp, getApps, cert } = await import('firebase-admin/app');
                const { getFirestore } = await import('firebase-admin/firestore');
                
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
                const docRef = await db.collection('orders').add({
                    ...orderData,
                    created_at: new Date()
                });
                console.log('💾 Orden guardada en Firebase:', docRef.id);
                
            } catch (firebaseError) {
                console.error('❌ Error Firebase:', firebaseError.message);
            }

            if (paymentInfo.status === 'approved') {
                console.log('✅ Pago APROBADO:', paymentInfo.id);
            }
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Error en webhook:', error.message);
        return res.status(200).json({ received: true, error: error.message });
    }
}
