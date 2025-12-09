/**
 * DRS Store - Animations & Interactions
 * Maneja animaciones de scroll, menú móvil y efectos visuales
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // =====================================================
    // MENÚ MÓVIL HAMBURGUESA
    // =====================================================
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const header = document.getElementById('mainHeader');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (menuOverlay) {
                menuOverlay.classList.toggle('active');
            }
            // Prevenir scroll del body cuando el menú está abierto
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Cerrar menú al hacer clic en el overlay
        if (menuOverlay) {
            menuOverlay.addEventListener('click', function() {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Cerrar menú al hacer clic en un enlace
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                if (menuOverlay) {
                    menuOverlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            });
        });
    }

    // =====================================================
    // HEADER CON EFECTO AL SCROLL
    // =====================================================
    if (header) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            // Agregar clase cuando se hace scroll
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }

    // =====================================================
    // ANIMACIONES DE SCROLL REVEAL
    // =====================================================
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    
    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    }

    // Ejecutar al cargar y al hacer scroll
    checkReveal();
    window.addEventListener('scroll', checkReveal);

    // =====================================================
    // SMOOTH SCROLL PARA ENLACES INTERNOS
    // =====================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // =====================================================
    // EFECTO PARALLAX SUAVE EN HERO (opcional)
    // =====================================================
    const hero = document.querySelector('.hero');
    
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.3;
            
            if (scrolled < window.innerHeight) {
                hero.style.backgroundPositionY = rate + 'px';
            }
        });
    }

    // =====================================================
    // ANIMACIÓN DE NÚMEROS (para countdown)
    // =====================================================
    const relojWrapper = document.querySelector('.reloj-wrapper');
    
    if (relojWrapper) {
        // Efecto de pulso cada segundo
        setInterval(() => {
            relojWrapper.classList.add('tic');
            setTimeout(() => {
                relojWrapper.classList.remove('tic');
            }, 100);
        }, 1000);
    }

});

// =====================================================
// LAZY LOADING DE IMÁGENES (nativo con fallback)
// =====================================================
if ('loading' in HTMLImageElement.prototype) {
    // El navegador soporta lazy loading nativo
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        if (img.dataset.src) {
            img.src = img.dataset.src;
        }
    });
} else {
    // Fallback para navegadores antiguos
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

