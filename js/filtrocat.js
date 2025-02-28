const categories = document.querySelectorAll('.category-list li');
const products = document.querySelectorAll('.product-card');
const noProductsMessage = document.querySelector('.no-products-message');

categories.forEach(category => {
    category.addEventListener('click', () => {
        const selectedCategory = category.textContent;
        let productsVisible = 0;

        products.forEach(product => {
            if (product.getAttribute('data-category') === selectedCategory) {
                product.style.display = 'block';
                productsVisible++;
            } else {
                product.style.display = 'none';
            }
        });

        if (productsVisible === 0) {
            noProductsMessage.style.display = 'block';
        } else {
            noProductsMessage.style.display = 'none';
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const loader = document.querySelector('.loader-overlay');

    // Mostrar loader al cargar la página
    loader.style.display = 'flex';

    // Simular carga (puede ser real si haces un fetch de productos)
    setTimeout(() => {
        loader.style.display = 'none';
    }, 2500); 
});