/**
 * DRS Store - Filtro de Categorías
 * Sistema de filtrado de productos y loader
 */

document.addEventListener('DOMContentLoaded', function() {
    const categories = document.querySelectorAll('.category-list li');
    const products = document.querySelectorAll('.product-card');
    const noProductsMessage = document.querySelector('.no-products-message');
    const loader = document.querySelector('.loader-overlay');

    // =====================================================
    // LOADER
    // =====================================================
    if (loader) {
        // Mostrar loader al cargar
        loader.style.display = 'flex';

        // Ocultar después de cargar
        window.addEventListener('load', function() {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }, 800);
        });
    }

    // =====================================================
    // FILTRO DE CATEGORÍAS
    // =====================================================
    categories.forEach(category => {
        category.addEventListener('click', function() {
            // Remover clase active de todas las categorías
            categories.forEach(cat => cat.classList.remove('active'));
            // Agregar clase active a la categoría seleccionada
            this.classList.add('active');

            const selectedCategory = this.getAttribute('data-category') || this.textContent;
            let productsVisible = 0;

            // Animar productos
            products.forEach((product, index) => {
                const productCategory = product.getAttribute('data-category');
                
                // Si es "Ver todos" o "all", mostrar todos los productos
                if (selectedCategory === 'all' || selectedCategory === 'Ver todos') {
                    product.style.display = 'block';
                    product.style.animation = `fadeInUp 0.3s ease forwards ${index * 0.05}s`;
                    productsVisible++;
                } else if (productCategory === selectedCategory) {
                    product.style.display = 'block';
                    product.style.animation = `fadeInUp 0.3s ease forwards ${index * 0.05}s`;
                    productsVisible++;
                } else {
                    product.style.animation = 'fadeOut 0.2s ease forwards';
                    setTimeout(() => {
                        product.style.display = 'none';
                    }, 200);
                }
            });

            // Mostrar mensaje si no hay productos
            if (noProductsMessage) {
                if (productsVisible === 0) {
                    noProductsMessage.style.display = 'block';
                    noProductsMessage.style.animation = 'fadeInUp 0.3s ease forwards';
                } else {
                    noProductsMessage.style.display = 'none';
                }
            }
        });
    });

    // =====================================================
    // ANIMACIONES CSS DINÁMICAS
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
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.95);
            }
        }
    `;
    document.head.appendChild(styleSheet);
});
