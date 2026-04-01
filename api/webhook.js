import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';

function initAdmin() {
    const projectId = (process.env.FIREBASE_PROJECT_ID || '').replace(/^"|"$/g, '').trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^"|"$/g, '').trim();
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
        .replace(/\\n/g, '\n')
        .replace(/^"|"$/g, '')
        .trim();

    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey
            })
        });
    }
    return getFirestore();
}

function mapStatus(mpStatus) {
    if (mpStatus === 'approved') return 'paid';
    if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'failed';
    if (mpStatus === 'in_process' || mpStatus === 'pending') return 'pending_payment';
    return 'pending_payment';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { type, data } = req.body || {};
        if (type === 'payment' && data?.id) {
            const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: data.id });
            const orderId = paymentInfo.external_reference;

            if (orderId) {
                const db = initAdmin();
                const orderRef = db.collection('orders').doc(orderId);
                const nextStatus = mapStatus(paymentInfo.status);
                const payload = {
                    status: nextStatus,
                    paymentId: String(paymentInfo.id),
                    updatedAt: FieldValue.serverTimestamp(),
                    mpStatus: paymentInfo.status
                };
                if (nextStatus === 'paid') {
                    payload.paidAt = FieldValue.serverTimestamp();
                }
                await orderRef.set(payload, { merge: true });

                if (nextStatus === 'paid') {
                    try {
                        if (!process.env.RESEND_API_KEY) {
                            throw new Error('RESEND_API_KEY no configurada');
                        }

                        const orderSnap = await orderRef.get();
                        const orderData = orderSnap.exists ? orderSnap.data() : {};
                        const customer = orderData.customer || {};
                        const items = Array.isArray(orderData.items) ? orderData.items : [];
                        const total = Number(orderData.total || 0);
                        const address = customer.address || 'Sin dirección';
                        const postalCode = customer.postalCode || 'Sin código postal';
                        const customerName = customer.name || 'Cliente VOLT';
                        const customerEmail = customer.email || null;

                        if (!customerEmail) {
                            throw new Error(`No hay email del cliente para orden ${orderId}`);
                        }

                        const itemsHtml = items.length
                            ? items
                                .map((item) => {
                                    const title = item.title || 'Producto';
                                    const quantity = Number(item.quantity || 1);
                                    const price = Number(item.price || 0);
                                    return `<li style="margin:0 0 6px 0;">${title} x${quantity} - $${price.toLocaleString('es-AR')}</li>`;
                                })
                                .join('')
                            : '<li>Sin detalle de productos</li>';

                        const resend = new Resend(process.env.RESEND_API_KEY);
                        await resend.emails.send({
                            from: 'VOLT Store <noreply@voltculture.com.ar>',
                            to: customerEmail,
                            subject: `Tu pedido VOLT #${orderId} fue confirmado ✅`,
                            html: `
                                <div style="background:#0b0b0b;color:#f2f2f2;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
                                    <h1 style="margin:0 0 12px 0;color:#c1121f;font-size:22px;">Pago confirmado</h1>
                                    <p style="margin:0 0 12px 0;">Hola ${customerName}, tu pedido fue confirmado.</p>
                                    <p style="margin:0 0 8px 0;"><strong>Numero de orden:</strong> ${orderId}</p>
                                    <p style="margin:0 0 8px 0;"><strong>Total:</strong> $${total.toLocaleString('es-AR')}</p>
                                    <p style="margin:0 0 8px 0;"><strong>Direccion de envio:</strong> ${address}</p>
                                    <p style="margin:0 0 16px 0;"><strong>Codigo postal:</strong> ${postalCode}</p>
                                    <h2 style="margin:0 0 8px 0;color:#c1121f;font-size:18px;">Productos</h2>
                                    <ul style="margin:0 0 16px 18px;padding:0;">${itemsHtml}</ul>
                                    <p style="margin:0;color:#bdbdbd;font-size:12px;">Gracias por comprar en VOLT Store.</p>
                                </div>
                            `
                        });
                    } catch (mailError) {
                        console.error('Error enviando email de confirmación:', mailError.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Webhook error (respondiendo 200):', error.message);
    }

    return res.status(200).json({ received: true });
}
