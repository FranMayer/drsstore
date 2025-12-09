/**
 * DRS Store - Theme Toggle
 * Maneja el cambio entre modo claro y oscuro
 */

(function() {
    'use strict';

    // Claves de localStorage
    const THEME_KEY = 'drs-theme';
    
    // Obtener tema guardado o preferencia del sistema
    function getPreferredTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        
        if (savedTheme) {
            return savedTheme;
        }
        
        // Detectar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }

    // Aplicar tema
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        
        // Actualizar meta theme-color para móviles
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0A0A0A' : '#00A0E3');
        }
    }

    // Toggle tema
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    // Inicializar al cargar
    function init() {
        // Aplicar tema guardado inmediatamente (antes del render)
        const theme = getPreferredTheme();
        setTheme(theme);

        // Escuchar clicks en botones de toggle
        document.addEventListener('click', function(e) {
            if (e.target.closest('.theme-toggle')) {
                toggleTheme();
            }
        });

        // Escuchar cambios en la preferencia del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                // Solo cambiar si no hay tema guardado
                if (!localStorage.getItem(THEME_KEY)) {
                    setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // Ejecutar inmediatamente para evitar flash
    const theme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exportar funciones globalmente
    window.ThemeToggle = {
        toggle: toggleTheme,
        set: setTheme,
        get: () => document.documentElement.getAttribute('data-theme') || 'light'
    };

})();

