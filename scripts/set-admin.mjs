/**
 * set-admin.mjs — Asigna el custom claim { admin: true } a un usuario de Firebase Auth.
 *
 * USO:
 *   node scripts/set-admin.mjs tu@email.com
 *
 * El script lee las credenciales desde .env.local en la raíz del proyecto.
 * Asegurate de tener FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY definidos.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Cargar variables desde .env.local ──────────────────────────────────────
function loadEnvFile(filepath) {
    try {
        const lines = readFileSync(filepath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            let raw = trimmed.slice(eqIdx + 1).trim();
            let val;
            // Si está entre comillas dobles, usar JSON.parse para interpretar \n, \t, etc.
            if (raw.startsWith('"') && raw.endsWith('"')) {
                try { val = JSON.parse(raw); } catch { val = raw.slice(1, -1).replace(/\\n/g, '\n'); }
            } else if (raw.startsWith("'") && raw.endsWith("'")) {
                val = raw.slice(1, -1);
            } else {
                val = raw;
            }
            if (key && !(key in process.env)) process.env[key] = val;
        }
    } catch {
        // .env.local no existe — se usan las vars de entorno del sistema
    }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));

// ── Validar argumento ──────────────────────────────────────────────────────
const email = process.argv[2];
if (!email || !email.includes('@')) {
    console.error('Uso: node scripts/set-admin.mjs tu@email.com');
    process.exit(1);
}

// ── Inicializar Firebase Admin SDK ─────────────────────────────────────────
const projectId   = (process.env.FIREBASE_PROJECT_ID   || '').trim();
const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
// El parser ya decodificó \n correctamente; si por algún motivo quedan literales, los convertimos igual
const privateKey  = (process.env.FIREBASE_PRIVATE_KEY  || '')
    .replace(/\\n/g, '\n').trim();

if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Faltan variables de entorno: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
}

if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

// ── Asignar claim ──────────────────────────────────────────────────────────
const adminAuth = getAuth();

try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Claim { admin: true } asignado a ${email} (uid: ${user.uid})`);
    console.log('   → El usuario debe cerrar sesión y volver a iniciar para que el claim se aplique.');
} catch (err) {
    if (err.code === 'auth/user-not-found') {
        console.error(`❌ No existe ningún usuario con el email: ${email}`);
        console.error('   Primero creá el usuario en Firebase Auth (consola o a través del panel).');
    } else {
        console.error('❌ Error:', err.message);
    }
    process.exit(1);
}
