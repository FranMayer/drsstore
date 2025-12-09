/**
 * DRS Store - Sistema de Carrito
 * Maneja el carrito de compras con localStorage
 */

document.addEventListener("DOMContentLoaded", function () {
    // Obtener carrito del localStorage o crear uno vacío
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    const cartList = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const clearCartBtn = document.getElementById("clear-cart");
    const addToCartButtons = document.querySelectorAll(".add-to-cart");
    const cartBadge = document.getElementById("cartBadge");

    // =====================================================
    // AGREGAR PRODUCTO AL CARRITO
    // =====================================================
    function addToCart(event) {
        const button = event.target;
        const productCard = button.closest(".product-card");
        const productId = productCard.getAttribute("data-id");
        const productTitle = productCard.querySelector(".product-title").innerText;
        const productPrice = parseFloat(productCard.getAttribute("data-price"));

        // Verificar si el producto ya está en el carrito
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ 
                id: productId, 
                title: productTitle, 
                price: productPrice, 
                quantity: 1 
            });
        }

        // Actualizar UI
        updateCart();
        
        // Feedback visual
        button.innerText = "✓ Añadido";
        button.disabled = true;
        button.style.background = "var(--accent, #00D2BE)";
        
        // Animación del badge
        animateBadge();
    }

    // =====================================================
    // ELIMINAR PRODUCTO (Event Delegation)
    // =====================================================
    if (cartList) {
        cartList.addEventListener("click", function (event) {
            if (event.target.classList.contains("remove-item")) {
                const index = event.target.getAttribute("data-index");
                
                // Animación de eliminación
                const item = event.target.closest('li');
                if (item) {
                    item.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => {
                        cart.splice(index, 1);
                        updateCart();
                        resetButtons();
                    }, 300);
                } else {
                    cart.splice(index, 1);
                    updateCart();
                    resetButtons();
                }
            }
        });
    }

    // =====================================================
    // ACTUALIZAR CARRITO EN DOM Y LOCALSTORAGE
    // =====================================================
    function updateCart() {
        if (!cartList || !cartTotal) return;
        
        cartList.innerHTML = "";
        let total = 0;
        let itemCount = 0;

        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            itemCount += item.quantity;

            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            li.style.animation = 'slideIn 0.3s ease forwards';
            li.innerHTML = `
                <div class="d-flex flex-column">
                    <span class="fw-bold">${item.title}</span>
                    <small class="text-muted">x${item.quantity} - $${(item.price * item.quantity).toLocaleString('es-AR')}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
                    ✕
                </button>
            `;
            cartList.appendChild(li);
        });

        // Actualizar total con formato argentino
        cartTotal.innerText = `$${total.toLocaleString('es-AR')}`;
        
        // Guardar en localStorage
        localStorage.setItem("cart", JSON.stringify(cart));
        
        // Actualizar badge
        updateBadge(itemCount);
        
        // Actualizar estado de botones
        updateButtons();
    }

    // =====================================================
    // BADGE DEL CARRITO
    // =====================================================
    function updateBadge(count) {
        if (!cartBadge) return;
        
        if (count > 0) {
            cartBadge.textContent = count > 99 ? '99+' : count;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    function animateBadge() {
        if (!cartBadge) return;
        
        cartBadge.style.animation = 'none';
        cartBadge.offsetHeight; // Trigger reflow
        cartBadge.style.animation = 'badge-pop 0.3s ease';
    }

    // =====================================================
    // RESTAURAR BOTONES "AÑADIR AL CARRITO"
    // =====================================================
    function resetButtons() {
        addToCartButtons.forEach(button => {
            const productCard = button.closest(".product-card");
            const productId = productCard.getAttribute("data-id");
            const inCart = cart.some(item => item.id === productId);

            if (!inCart) {
                button.innerText = "Añadir al carrito";
                button.disabled = false;
                button.style.background = "";
            }
        });
    }

    // =====================================================
    // ACTUALIZAR BOTONES SEGÚN CARRITO
    // =====================================================
    function updateButtons() {
        addToCartButtons.forEach(button => {
            const productCard = button.closest(".product-card");
            const productId = productCard.getAttribute("data-id");
            const inCart = cart.some(item => item.id === productId);

            if (inCart) {
                button.innerText = "✓ Añadido";
                button.disabled = true;
                button.style.background = "var(--accent, #00D2BE)";
            } else {
                button.innerText = "Añadir al carrito";
                button.disabled = false;
                button.style.background = "";
            }
        });
    }

    // =====================================================
    // VACIAR CARRITO
    // =====================================================
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", function () {
            // Confirmación
            if (cart.length === 0) return;
            
            // Animación de vaciado
            const items = cartList.querySelectorAll('li');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.animation = 'slideOut 0.2s ease forwards';
                }, index * 50);
            });

            setTimeout(() => {
                cart.length = 0;
                updateCart();
                resetButtons();
            }, items.length * 50 + 200);
        });
    }

    // =====================================================
    // EVENT LISTENERS PARA BOTONES
    // =====================================================
    addToCartButtons.forEach(button => {
        button.addEventListener("click", addToCart);
    });

    // =====================================================
    // ANIMACIONES CSS
    // =====================================================
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(20px);
            }
        }
        
        @keyframes badge-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(styleSheet);

    // Cargar carrito al iniciar
    updateCart();
});
