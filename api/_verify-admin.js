/**
 * _verify-admin.js — Middleware para proteger rutas de API que requieren rol admin.
 *
 * El prefijo _ evita que Vercel lo exponga como ruta pública.
 *
 * USO en cualquier endpoint protegido:
 *
 *   import { verifyAdmin } from './_verify-admin.js';
 *
 *   export default async function handler(req, res) {
 *       const decoded = await verifyAdmin(req, res);
 *       if (!decoded) return; // ya respondió con 401 o 403
 *       // lógica protegida…
 *   }
 *
 * El cliente debe enviar el ID token en el header:
 *   Authorization: Bearer <idToken>
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function initAdminAuth() {
    const projectId   = (process.env.FIREBASE_PROJECT_ID   || '').replace(/^"|"$/g, '').trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^"|"$/g, '').trim();
    const privateKey  = (process.env.FIREBASE_PRIVATE_KEY  || '')
        .replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();

    if (!getApps().length) {
        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    }
    return getAuth();
}

/**
 * Verifica que el request contenga un ID token válido con claim admin === true.
 * - Si es válido: devuelve el decoded token.
 * - Si no: escribe la respuesta de error y devuelve null.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {Promise<object|null>}
 */
export async function verifyAdmin(req, res) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
        res.status(401).json({ error: 'Token no proporcionado' });
        return null;
    }

    try {
        const auth = initAdminAuth();
        const decoded = await auth.verifyIdToken(token);

        if (decoded.admin !== true) {
            res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
            return null;
        }

        return decoded;
    } catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado' });
        return null;
    }
}
