/**
 * VOLT Store — Pago con Mercado Pago (Preference API)
 *
 * Flujo: el carrito se envía al backend → se crea una preferencia con el Access Token
 * (solo en servidor) → la API devuelve init_point → redirección al checkout de MP.
 *
 * Variables de entorno (Vercel / hosting):
 *   MP_ACCESS_TOKEN — Credenciales de producción (o prueba) desde mercadopago.com.ar
 *   SITE_URL — URL pública del sitio (back_urls y webhook)
 *
 * Desarrollo local: configurá create_preference.php con tu token y levantá PHP en :8080,
 * o usá `vercel dev` para probar /api/create-preference.
 */

document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.getElementById("checkout-btn");

    if (!checkoutBtn) return;

    const isProduction = !window.location.hostname.includes("localhost");

    const API_URL = isProduction
        ? "/api/create-preference"
        : "http://localhost:8080/create_preference.php";

    checkoutBtn.addEventListener("click", async function () {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        if (cart.length === 0) {
            alert("🛒 El carrito está vacío.");
            return;
        }

        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = "⏳ Generando link de pago...";
        checkoutBtn.disabled = true;

        try {
            const items = cart.map((item) => ({
                title: item.title,
                quantity: item.quantity,
                price: item.price,
            }));

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            });

            const data = await response.json();

            if (data.error) {
                console.log("📋 Detalles del error:", JSON.stringify(data, null, 2));
                throw new Error(data.error + (data.details ? " — " + data.details : ""));
            }

            // Producción: init_point. Credenciales de prueba: suele venir sandbox_init_point
            const payUrl = data.init_point || data.sandbox_init_point;

            if (!payUrl) {
                throw new Error(
                    "El servidor no devolvió el link de pago (init_point). Revisá MP_ACCESS_TOKEN y la respuesta de la API."
                );
            }

            window.location.href = payUrl;
        } catch (error) {
            console.error("❌ Error al iniciar el pago:", error);
            alert("Error al generar el pago: " + error.message);
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    });
});
