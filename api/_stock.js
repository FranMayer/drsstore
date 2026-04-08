/**
 * Stock por variante (color + talle) — misma lógica que el catálogo (catalog.js / products-service).
 */

/**
 * Stock disponible para una combinación color/talle.
 * @param {object} product — documento Firestore products/{id}
 * @param {string} variantColor
 * @param {string} variantSize — se normaliza a mayúsculas como en el admin
 */
export function computeAvailableStock(product, variantColor, variantSize) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const productStock = Number(product.stock) || 0;

    const color = String(variantColor || '').trim();
    const size = String(variantSize || '').trim().toUpperCase();

    let colorStock = NaN;
    let sizeStock = NaN;

    if (color) {
        const v = variants.find((x) => String(x.color || '').trim() === color);
        if (v) colorStock = Number(v.stock) || 0;
    }
    if (size) {
        const s = sizes.find((x) => String(x.size || '').trim().toUpperCase() === size);
        if (s) sizeStock = Number(s.stock) || 0;
    }

    if (!Number.isNaN(colorStock) && !Number.isNaN(sizeStock)) {
        return Math.max(0, Math.min(colorStock, sizeStock));
    }
    if (!Number.isNaN(colorStock)) return Math.max(0, colorStock);
    if (!Number.isNaN(sizeStock)) return Math.max(0, sizeStock);
    return Math.max(0, productStock);
}

/**
 * Decrementa stock; nunca baja de 0 en cada campo tocado.
 * Recalcula `stock` agregado como en el panel (suma variants si hay, si no suma sizes).
 *
 * @returns {{ variants: array, sizes: array, stock: number }}
 */
export function applyStockDecrement(product, quantity, variantColor, variantSize) {
    const qty = Math.max(0, Number(quantity) || 0);
    const variants = Array.isArray(product.variants)
        ? product.variants.map((v) => ({
              color: String(v.color || '').trim(),
              hex: String(v.hex || '#0b0b0b').trim() || '#0b0b0b',
              stock: Math.max(0, Number(v.stock) || 0)
          }))
        : [];
    const sizes = Array.isArray(product.sizes)
        ? product.sizes.map((s) => ({
              size: String(s.size || '').trim().toUpperCase(),
              stock: Math.max(0, Number(s.stock) || 0)
          }))
        : [];

    const color = String(variantColor || '').trim();
    const size = String(variantSize || '').trim().toUpperCase();
    const hasVariants = variants.length > 0;
    const hasSizes = sizes.length > 0;

    if (hasVariants && hasSizes && color && size) {
        const vi = variants.findIndex((v) => v.color === color);
        const si = sizes.findIndex((s) => s.size === size);
        if (vi >= 0) variants[vi].stock = Math.max(0, variants[vi].stock - qty);
        if (si >= 0) sizes[si].stock = Math.max(0, sizes[si].stock - qty);
    } else if (hasVariants && color) {
        const vi = variants.findIndex((v) => v.color === color);
        if (vi >= 0) variants[vi].stock = Math.max(0, variants[vi].stock - qty);
    } else if (hasSizes && size) {
        const si = sizes.findIndex((s) => s.size === size);
        if (si >= 0) sizes[si].stock = Math.max(0, sizes[si].stock - qty);
    } else {
        const base = Math.max(0, Number(product.stock) || 0);
        return { variants, sizes, stock: Math.max(0, base - qty) };
    }

    const totalStockByVariants = variants.reduce((sum, v) => sum + v.stock, 0);
    const totalStockBySizes = sizes.reduce((sum, s) => sum + s.stock, 0);
    const computedStock = totalStockByVariants > 0 ? totalStockByVariants : totalStockBySizes;

    return { variants, sizes, stock: computedStock };
}
