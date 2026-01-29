// VOLT Store - Webhook de Mercado Pago (Vercel Serverless)
import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
    // Solo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
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

            console.log('💳 Pago:', {
                id: paymentInfo.id,
                status: paymentInfo.status,
                amount: paymentInfo.transaction_amount,
                payer: paymentInfo.payer?.email,
                external_reference: paymentInfo.external_reference
            });

            // Aquí podés agregar lógica según el estado del pago:
            switch (paymentInfo.status) {
                case 'approved':
                    // ✅ Pago aprobado
                    console.log('✅ Pago APROBADO:', paymentInfo.id);
                    // TODO: Enviar email de confirmación
                    // TODO: Actualizar stock en Firebase
                    // TODO: Guardar pedido en base de datos
                    break;

                case 'pending':
                    // ⏳ Pago pendiente
                    console.log('⏳ Pago PENDIENTE:', paymentInfo.id);
                    break;

                case 'rejected':
                    // ❌ Pago rechazado
                    console.log('❌ Pago RECHAZADO:', paymentInfo.id);
                    break;

                case 'cancelled':
                    // 🚫 Pago cancelado
                    console.log('🚫 Pago CANCELADO:', paymentInfo.id);
                    break;

                default:
                    console.log('ℹ️ Estado:', paymentInfo.status);
            }
        }

        // Siempre responder 200 para que MP no reintente
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Error en webhook:', error);
        // Aún así responder 200 para evitar reintentos
        return res.status(200).json({ received: true, error: error.message });
    }
}
