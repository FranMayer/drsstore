import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function initAdmin() {
    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
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
            }
        }
    } catch (error) {
        console.error('Webhook error (respondiendo 200):', error.message);
    }

    return res.status(200).json({ received: true });
}
