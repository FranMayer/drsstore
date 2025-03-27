document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.getElementById("checkout-btn");

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async function () {
            // Obtener el carrito desde localStorage
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

            const response = await fetch("http://localhost:8000/create_preference.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: items })
            });

            // Obtener la respuesta como texto
            const text = await response.text();
            console.log("Respuesta del servidor:", text); // Muestra la respuesta completa para verificar qué contiene

            try {
                // Intentar parsear la respuesta como JSON
                const data = JSON.parse(text);
                console.log("Datos de la preferencia:", data);

                // Verificar si el id de la preferencia está llegando correctamente
                if (!data.preference_id) {
                    alert("Error al crear la preferencia.");
                    return;
                }

                console.log("Preferencia creada con éxito. ID:", data.preference_id);

                // Inicializar MercadoPago con tu clave pública
                const mp = new MercadoPago("APP_USR-ad9e51e0-00b7-4e8c-af15-60491863a48d", { locale: "es-AR" });

                // Verifica si el botón está intentando abrir el modal
                console.log("Abriendo el modal de MercadoPago...");

                mp.checkout({
                    preference: { id: data.preference_id },  // Asegúrate de que la propiedad es preference_id
                    autoOpen: true
                });
            } catch (e) {
                // Si no se puede parsear el JSON, mostrar el error
                console.error("Error al parsear la respuesta JSON:", e);
                alert("Error al procesar la respuesta del servidor.");
            }
        });
    } else {
        console.log("No se encontró el botón de pago.");
    }

    // Verifica si la respuesta fue exitosa antes de continuar
    if (!response.ok) {
        alert("Error al conectar con el servidor.");
        return;
    }
});
