// VOLT Store - Crear preferencia de Mercado Pago (Vercel Serverless)
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { items } = req.body;

        // Validar items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // Configurar Mercado Pago con variable de entorno
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });

        const preference = new Preference(client);

        // Preparar items para MP
        const mpItems = items.map(item => ({
            title: item.title,
            quantity: Number(item.quantity),
            currency_id: 'ARS',
            unit_price: Number(item.price)
        }));

        // URL base del sitio
        const siteUrl = process.env.SITE_URL || 'https://voltculture.com.ar';
        
        // Crear preferencia
        const result = await preference.create({
            body: {
                items: mpItems,
                statement_descriptor: 'VOLT Store',
                external_reference: 'VOLT-' + Date.now(),
                back_urls: {
                    success: siteUrl + '/aprove.html',
                    failure: siteUrl + '/err.html',
                    pending: siteUrl + '/pending.html'
                },
                auto_return: 'approved',
                // URL donde MP enviará las notificaciones de pago
                notification_url: siteUrl + '/api/webhook'
            }
        });
        
        console.log('✅ Preferencia creada:', result.id);
        console.log('📬 Notification URL:', siteUrl + '/api/webhook');

        return res.status(200).json({
            preference_id: result.id,
            init_point: result.init_point
        });

    } catch (error) {
        console.error('Error MP:', error);
        return res.status(500).json({ 
            error: 'Error al crear preferencia',
            details: error.message 
        });
    }
}
