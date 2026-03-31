import { MercadoPagoConfig, Preference } from 'mercadopago';
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

function generateOrderId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return `VOLT-${token}`;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { items, customer } = req.body || {};
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }
        if (!customer?.name || !customer?.phone || !customer?.email || !customer?.address) {
            return res.status(400).json({ error: 'Faltan datos del cliente para el envío' });
        }

        const normalizedItems = items.map(item => ({
            title: String(item.title || 'Producto'),
            quantity: Math.max(1, Number(item.quantity) || 1),
            price: Math.max(0, Number(item.price) || 0),
            image: item.image || '',
            variantColor: item.variantColor || '',
            variantSize: item.variantSize || ''
        }));
        const total = normalizedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const orderId = generateOrderId();
        const db = initAdmin();
        const orderRef = db.collection('orders').doc(orderId);

        try {
            await orderRef.set({
                orderId,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
                customer: {
                    name: String(customer.name).trim(),
                    phone: String(customer.phone).trim(),
                    email: String(customer.email).trim(),
                    address: String(customer.address).trim()
                },
                items: normalizedItems,
                total,
                paymentId: null,
                paidAt: null,
                updatedAt: FieldValue.serverTimestamp()
            });
        } catch (firestoreError) {
            return res.status(500).json({
                error: 'No se pudo crear la orden en Firestore',
                details: firestoreError.message
            });
        }

        const mpItems = normalizedItems.map(item => ({
            title: item.title,
            quantity: item.quantity,
            currency_id: 'ARS',
            unit_price: item.price
        }));

        const siteUrl = process.env.SITE_URL || 'https://voltculture.com.ar';
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const preference = new Preference(client);

        try {
            const result = await preference.create({
                body: {
                    items: mpItems,
                    statement_descriptor: 'VOLT Store',
                    external_reference: orderId,
                    back_urls: {
                        success: `${siteUrl}/pages/success.html?order=${orderId}`,
                        failure: `${siteUrl}/pages/failure.html?order=${orderId}`,
                        pending: `${siteUrl}/pages/pending.html?order=${orderId}`
                    },
                    auto_return: 'approved',
                    notification_url: `${siteUrl}/api/webhook`,
                    metadata: {
                        order_id: orderId,
                        customer_name: String(customer.name).trim(),
                        customer_phone: String(customer.phone).trim(),
                        customer_email: String(customer.email).trim(),
                        shipping_address: String(customer.address).trim()
                    }
                }
            });

            return res.status(200).json({
                init_point: result.init_point || result.sandbox_init_point,
                orderId
            });
        } catch (mpError) {
            await orderRef.update({
                status: 'mp_error',
                updatedAt: FieldValue.serverTimestamp(),
                mpError: mpError.message
            });
            return res.status(500).json({
                error: 'Error al crear preferencia en Mercado Pago',
                details: mpError.message
            });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error interno', details: error.message });
    }
}
