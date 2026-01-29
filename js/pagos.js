/**
 * VOLT Store - Sistema de Pagos con Mercado Pago
 */

document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.getElementById("checkout-btn");

    if (!checkoutBtn) return;

    // Detectar si estamos en producción o desarrollo
    const isProduction = !window.location.hostname.includes('localhost');
    
    // URLs de la API
    const API_URL = isProduction 
        ? '/api/create-preference'  // Vercel serverless
        : 'http://localhost:8080/create_preference.php';  // PHP local

    // Public Key de PRODUCCIÓN
    const MP_PUBLIC_KEY = 'APP_USR-66f346c3-5516-414f-85d6-59182bd5b8c0';

    checkoutBtn.addEventListener("click", async function () {
        // Obtener el carrito desde localStorage
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        
        if (cart.length === 0) {
            alert("🛒 El carrito está vacío.");
            return;
        }

        // Mostrar estado de carga
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = "⏳ Procesando...";
        checkoutBtn.disabled = true;

        try {
            // Preparar los datos de los productos para Mercado Pago
            const items = cart.map(item => ({
                title: item.title,
                quantity: item.quantity,
                price: item.price
            }));

            // Enviar al backend
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: items })
            });

            const data = await response.json();

            // Verificar si hay error
            if (data.error) {
                console.log("📋 Detalles del error:", JSON.stringify(data, null, 2));
                throw new Error(data.error + (data.details ? " - " + data.details : ""));
            }

            // Verificar si el id de la preferencia está llegando correctamente
            if (!data.preference_id) {
                throw new Error("No se recibió el ID de preferencia");
            }

            console.log("✅ Preferencia creada:", data.preference_id);

            // Inicializar Mercado Pago
            const mp = new MercadoPago(MP_PUBLIC_KEY, { 
                locale: "es-AR" 
            });

            // Abrir checkout de Mercado Pago
            mp.checkout({
                preference: { id: data.preference_id },
                autoOpen: true
            });

        } catch (error) {
            console.error("❌ Error en el pago:", error);
            alert("Error al procesar el pago: " + error.message);
        } finally {
            // Restaurar botón
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    });
});
