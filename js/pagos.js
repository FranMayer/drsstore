/**
 * VOLT Store - Sistema de Pagos con Mercado Pago
 */

document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.getElementById("checkout-btn");

    if (!checkoutBtn) return;

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

            // Enviar al backend PHP
            const response = await fetch("http://localhost:8000/create_preference.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: items })
            });

            const data = await response.json();

            // Verificar si hay error
            if (data.error) {
                throw new Error(data.error);
            }

            // Verificar si el id de la preferencia está llegando correctamente
            if (!data.preference_id) {
                throw new Error("No se recibió el ID de preferencia");
            }

            console.log("✅ Preferencia creada:", data.preference_id);

            // =====================================================
            // CONFIGURACIÓN - Reemplaza con tu Public Key
            // =====================================================
            // Obtén tu Public Key en: https://www.mercadopago.com.ar/developers/panel/app
            const mp = new MercadoPago("APP_USR-ad9e51e0-00b7-4e8c-af15-60491863a48d", { 
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
