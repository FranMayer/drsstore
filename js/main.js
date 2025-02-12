//Almacenamos en localStorage lo pedido por el usuario

document.addEventListener("DOMContentLoaded", function() {
    const toggleCartBtn = document.getElementById("toggle-cart-btn");
    const cartContainer = document.getElementById("cart-container");

    // Mostrar/Ocultar el Carrito
    toggleCartBtn.addEventListener("click", function() {
        cartContainer.classList.toggle("hidden");

        // Cambiar el texto del botón
        if (cartContainer.classList.contains("hidden")) {
            toggleCartBtn.innerText = "Mostrar Carrito";
        } else {
            toggleCartBtn.innerText = "Ocultar Carrito";
        }
    });

    // Actualizar el carrito al cargar la página
    updateCartDisplay();
});

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProduct = cart.find(item => item.id === product.id);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push(product);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(product => product.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartItemsContainer = document.getElementById("cart-items");

    cartItemsContainer.innerHTML = "";

    cart.forEach(product => {
        const productElement = document.createElement("div");
        productElement.classList.add("cart-item");
        productElement.innerHTML = `
            <p>${product.name} - $${product.price} x ${product.quantity}</p>
            <button onclick="removeFromCart('${product.id}')">Eliminar</button>
        `;
        cartItemsContainer.appendChild(productElement);
    });
}