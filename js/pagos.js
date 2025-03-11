document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.getElementById("checkout-btn");

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async function () {
            // Obtener carrito desde localStorage
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if (cart.length === 0) {
                alert("El carrito está vacío.");
                return;
            }

            // Preparar los datos de los productos para Mercado Pago
            let items = [];
            cart.forEach(item => {
                items.push({
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price
                });
            });

            // Enviar la lista de productos al backend (PHP)
            const response = await fetch("create_preference.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: items })
            });

            const data = await response.json();
            const mp = new MercadoPago("TU_PUBLIC_KEY", { locale: "es-AR" });

            mp.checkout({
                preference: { id: data.id },
                autoOpen: true
            });
        });
    }
});


