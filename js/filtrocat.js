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
