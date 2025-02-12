document.addEventListener("DOMContentLoaded", function () {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartList = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const clearCartBtn = document.getElementById("clear-cart");
    const addToCartButtons = document.querySelectorAll(".add-to-cart");

    // 🛍 Agregar producto al carrito
    function addToCart(event) {
        const button = event.target;
        const productCard = button.closest(".product-card");
        const productId = productCard.getAttribute("data-id");
        const productTitle = productCard.querySelector(".product-title").innerText;
        const productPrice = parseFloat(productCard.getAttribute("data-price"));

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: productId, title: productTitle, price: productPrice, quantity: 1 });
        }

        updateCart();
        button.innerText = "Añadido ✅";
        button.disabled = true;
    }

    // 🗑 Eliminar producto del carrito (Evento Delegado)
    cartList.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-item")) {
            const index = event.target.getAttribute("data-index");
            cart.splice(index, 1);
            updateCart();
            resetButtons(); // Restaurar los botones al eliminar
        }
    });

    // 🔄 Actualizar carrito en el DOM y localStorage
    function updateCart() {
        cartList.innerHTML = "";
        let total = 0;

        cart.forEach((item, index) => {
            total += item.price * item.quantity;

            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            li.innerHTML = `
                ${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}
                <button class="btn btn-sm btn-danger remove-item" data-index="${index}">🗑</button>
            `;
            cartList.appendChild(li);
        });

        cartTotal.innerText = `$${total.toFixed(2)}`;
        localStorage.setItem("cart", JSON.stringify(cart));
        updateButtons();
    }

    // 🔄 Restaurar botones de "Añadir al carrito"
    function resetButtons() {
        addToCartButtons.forEach(button => {
            button.innerText = "Añadir al carrito";
            button.disabled = false;
        });
    }

    // 🔄 Actualizar botones según los productos en el carrito
    function updateButtons() {
        addToCartButtons.forEach(button => {
            const productCard = button.closest(".product-card");
            const productId = productCard.getAttribute("data-id");
            const inCart = cart.some(item => item.id === productId);

            if (inCart) {
                button.innerText = "Añadido ✅";
                button.disabled = true;
            } else {
                button.innerText = "Añadir al carrito";
                button.disabled = false;
            }
        });
    }

    // 🧹 Vaciar carrito
    clearCartBtn.addEventListener("click", function () {
        cart.length = 0;
        updateCart();
    });

    // 🛒 Event listeners para los botones "Añadir al carrito"
    addToCartButtons.forEach(button => {
        button.addEventListener("click", addToCart);
    });

    // Cargar carrito al abrir la página
    updateCart();
});
