/**
 * DRS Store - Catalog Manager
 * Maneja la carga dinámica de productos y el filtrado por categorías
 */

document.addEventListener('DOMContentLoaded', async function() {
    
    // =====================================================
    // INICIALIZACIÓN
    // =====================================================
    
    // Inicializar Firebase si está configurado
    if (window.FirebaseConfig) {
        window.FirebaseConfig.init();
    }

    const productGrid = document.querySelector('.product-grid');
    const categoryList = document.querySelector('.category-list ul');
    const noProductsMessage = document.querySelector('.no-products-message');
    const loader = document.querySelector('.loader-overlay');

    if (!productGrid) return;

    // =====================================================
    // CARGAR PRODUCTOS
    // =====================================================
    
    async function loadProducts(category = 'all') {
        try {
            // Mostrar loader
            if (loader) loader.style.display = 'flex';

            // Obtener productos del servicio
            const products = await window.ProductsService.getAll(category === 'all' ? null : category);

            // Limpiar grid (excepto el mensaje de no productos)
            const existingCards = productGrid.querySelectorAll('.product-card');
            existingCards.forEach(card => card.remove());

            // Verificar si hay productos
            if (products.length === 0) {
                if (noProductsMessage) {
                    noProductsMessage.style.display = 'block';
                }
            } else {
                if (noProductsMessage) {
                    noProductsMessage.style.display = 'none';
                }

                // Renderizar productos
                products.forEach((product, index) => {
                    const card = createProductCard(product, index);
                    productGrid.appendChild(card);
                });

                // Inicializar botones de carrito para los nuevos productos
                initCartButtons();
            }

        } catch (error) {
            console.error('Error al cargar productos:', error);
            if (noProductsMessage) {
                noProductsMessage.innerHTML = '<p>❌ Error al cargar productos. Intenta de nuevo.</p>';
                noProductsMessage.style.display = 'block';
            }
        } finally {
            // Ocultar loader
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }
        }
    }

    // =====================================================
    // CREAR TARJETA DE PRODUCTO
    // =====================================================
    
    function createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-category', product.category);
        card.setAttribute('data-id', product.id);
        card.setAttribute('data-stock', product.stock);
        card.setAttribute('data-price', product.price);
        
        // Animación de entrada escalonada
        card.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05}s`;
        card.style.opacity = '0';

        // Formatear precio
        const formattedPrice = product.price.toLocaleString('es-AR');

        // Verificar si está en el carrito
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const inCart = cart.some(item => item.id === product.id);

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <p class="product-price">$${formattedPrice}</p>
            <p class="product-stock">Disponibles: <span>${product.stock}</span></p>
            <div class="product-buttons">
                <button class="add-to-cart" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Sin stock' : 'Añadir al carrito'}
                </button>
                <button class="remove-from-cart" style="display: ${inCart ? 'flex' : 'none'};" title="Quitar del carrito">
                    ✕
                </button>
            </div>
        `;

        return card;
    }

    // =====================================================
    // CARGAR CATEGORÍAS DINÁMICAMENTE
    // =====================================================
    
    async function loadCategories() {
        try {
            const categories = await window.ProductsService.getCategories();
            
            if (categoryList) {
                // Mantener "Ver todos" y agregar las categorías
                categoryList.innerHTML = `
                    <li class="active" data-category="all">Ver todos</li>
                    ${categories.map(cat => `<li data-category="${cat}">${cat}</li>`).join('')}
                `;

                // Agregar event listeners a las categorías
                initCategoryFilters();
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }

    // =====================================================
    // FILTRO DE CATEGORÍAS
    // =====================================================
    
    function initCategoryFilters() {
        const categories = document.querySelectorAll('.category-list li');
        
        categories.forEach(category => {
            category.addEventListener('click', async function() {
                // Actualizar estado activo
                categories.forEach(cat => cat.classList.remove('active'));
                this.classList.add('active');

                // Cargar productos de la categoría
                const selectedCategory = this.getAttribute('data-category');
                await loadProducts(selectedCategory);
            });
        });
    }

    // =====================================================
    // INICIALIZAR BOTONES DE CARRITO
    // =====================================================
    
    function initCartButtons() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        const removeFromCartButtons = document.querySelectorAll('.remove-from-cart');
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        addToCartButtons.forEach(button => {
            const productCard = button.closest('.product-card');
            const productId = productCard.getAttribute('data-id');
            const removeBtn = productCard.querySelector('.remove-from-cart');
            
            // Verificar si ya está en el carrito
            const inCart = cart.some(item => item.id === productId);
            if (inCart) {
                button.innerText = '✓ Añadido';
                button.disabled = true;
                button.style.background = 'var(--volt-red, #c1121f)';
                if (removeBtn) removeBtn.style.display = 'flex';
            }

            // Agregar evento click
            button.addEventListener('click', function() {
                addToCart(this);
            });
        });

        // Botones de quitar del carrito
        removeFromCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                removeFromCart(this);
            });
        });
    }

    // =====================================================
    // QUITAR DEL CARRITO (desde la card)
    // =====================================================
    
    function removeFromCart(button) {
        const productCard = button.closest('.product-card');
        const productId = productCard.getAttribute('data-id');
        const addBtn = productCard.querySelector('.add-to-cart');
        const stock = parseInt(productCard.getAttribute('data-stock'));

        // Obtener carrito y filtrar el producto
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));

        // Restaurar botón de añadir
        if (stock > 0) {
            addBtn.innerText = 'Añadir al carrito';
            addBtn.disabled = false;
            addBtn.style.background = '';
        }

        // Ocultar botón de quitar
        button.style.display = 'none';

        // Actualizar badge y notificar a main.js
        updateCartBadge();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }

    // =====================================================
    // AGREGAR AL CARRITO
    // =====================================================
    
    function addToCart(button) {
        const productCard = button.closest('.product-card');
        const productId = productCard.getAttribute('data-id');
        const productTitle = productCard.querySelector('.product-title').innerText;
        const productPrice = parseFloat(productCard.getAttribute('data-price'));
        const removeBtn = productCard.querySelector('.remove-from-cart');

        // Obtener carrito actual
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Verificar si ya existe
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

        // Guardar carrito
        localStorage.setItem('cart', JSON.stringify(cart));

        // Actualizar UI del botón
        button.innerText = '✓ Añadido';
        button.disabled = true;
        button.style.background = 'var(--volt-red, #c1121f)';

        // Mostrar botón de quitar
        if (removeBtn) removeBtn.style.display = 'flex';

        // Actualizar badge del carrito
        updateCartBadge();

        // Disparar evento para que main.js actualice el carrito
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }

    // =====================================================
    // ACTUALIZAR BADGE DEL CARRITO
    // =====================================================
    
    function updateCartBadge() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const badge = document.getElementById('cartBadge');
        
        if (badge) {
            const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
            
            if (itemCount > 0) {
                badge.textContent = itemCount > 99 ? '99+' : itemCount;
                badge.style.display = 'flex';
                badge.style.animation = 'badge-pop 0.3s ease';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // =====================================================
    // ANIMACIONES CSS
    // =====================================================
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(styleSheet);

    // =====================================================
    // ACTUALIZAR BOTONES SEGÚN EL CARRITO
    // =====================================================
    
    function refreshButtonStates() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const productId = card.getAttribute('data-id');
            const addBtn = card.querySelector('.add-to-cart');
            const removeBtn = card.querySelector('.remove-from-cart');
            const stock = parseInt(card.getAttribute('data-stock'));
            
            const inCart = cart.some(item => item.id === productId);

            if (inCart) {
                addBtn.innerText = '✓ Añadido';
                addBtn.disabled = true;
                addBtn.style.background = 'var(--volt-red, #c1121f)';
                if (removeBtn) removeBtn.style.display = 'flex';
            } else {
                if (stock > 0) {
                    addBtn.innerText = 'Añadir al carrito';
                    addBtn.disabled = false;
                    addBtn.style.background = '';
                }
                if (removeBtn) removeBtn.style.display = 'none';
            }
        });
    }

    // =====================================================
    // INICIALIZACIÓN
    // =====================================================
    
    // Cargar categorías y productos al iniciar
    await loadCategories();
    await loadProducts();
    updateCartBadge();

    // Escuchar actualizaciones del carrito (desde main.js cuando se elimina)
    window.addEventListener('cartUpdated', function() {
        updateCartBadge();
        refreshButtonStates();
    });
});

