#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Migración de products a formato variants/sizes/images.
 *
 * Uso:
 *   node scripts/migrate-products.js --dry-run
 *   node scripts/migrate-products.js --apply
 */

const admin = require('firebase-admin');

const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');
const isDryRun = !shouldApply;

function initFirebaseAdmin() {
  if (admin.apps.length) return;
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}
function normalizeImageUrl(product) {
  return (product.imageUrl || product.image || '').toString().trim();
}

function buildPatch(product) {
  const stock = Math.max(0, Number(product.stock) || 0);
  const imageUrl = normalizeImageUrl(product);
  const patch = {};

  if (!Array.isArray(product.variants) || product.variants.length === 0) {
    patch.variants = [{ color: 'Original', hex: '#0b0b0b', stock }];
  }
  if (!Array.isArray(product.sizes) || product.sizes.length === 0) {
    patch.sizes = [{ size: 'ÚNICO', stock }];
  }
  if (!Array.isArray(product.images) || product.images.length === 0) {
    patch.images = imageUrl ? [imageUrl] : [];
  }
  if (!product.imageUrl && imageUrl) {
    patch.imageUrl = imageUrl;
  }
  if (!product.image && imageUrl) {
    patch.image = imageUrl;
  }

  return patch;
}

async function run() {
  initFirebaseAdmin();
  const db = admin.firestore();
  const snapshot = await db.collection('products').get();

  let migrated = 0;
  let alreadyOk = 0;
  let errors = 0;

  console.log(`Modo: ${isDryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log(`Productos detectados: ${snapshot.size}`);

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const patch = buildPatch(data);
    const hasChanges = Object.keys(patch).length > 0;

    if (!hasChanges) {
      alreadyOk += 1;
      continue;
    }

    migrated += 1;
    console.log(`\n[${doc.id}] cambios propuestos:`);
    console.log(JSON.stringify(patch, null, 2));

    if (!isDryRun) {
      try {
        await doc.ref.update({
          ...patch,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        errors += 1;
        console.error(`❌ Error actualizando ${doc.id}:`, error.message);
      }
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log(`Migrables/migrados: ${migrated}`);
  console.log(`Ya en formato nuevo: ${alreadyOk}`);
  console.log(`Errores: ${errors}`);
  console.log(`Estado final: ${isDryRun ? 'Sin escrituras (dry-run)' : 'Cambios aplicados'}`);
}

run().catch((error) => {
  console.error('Error fatal de migración:', error);
  process.exit(1);
});

