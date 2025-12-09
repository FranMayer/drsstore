/**
 * DRS Store - Countdown Timer
 * Cuenta regresiva para el próximo GP de F1
 */

(function() {
    'use strict';

    // Configuración del próximo GP
    const CONFIG = {
        eventName: 'GP de Australia',
        eventDate: new Date('March 8, 2026 00:00:00 GMT+0000'),
        updateInterval: 1000
    };

    const relojElement = document.getElementById('reloj');
    const relojWrapper = document.querySelector('.reloj-wrapper');
    
    if (!relojElement) return;

    /**
     * Formatea números con padding de ceros
     */
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

    /**
     * Actualiza el display del countdown
     */
    function actualizarReloj() {
        const ahora = new Date();
        const diferencia = CONFIG.eventDate - ahora;

        if (diferencia < 0) {
            relojElement.innerHTML = '🏁 ¡LIGHTS OUT!';
            relojElement.style.fontSize = '1.5rem';
            return;
        }

        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        // Formato compacto para móviles
        const isMobile = window.innerWidth < 480;
        
        if (isMobile) {
            relojElement.innerHTML = `${dias}d ${padZero(horas)}:${padZero(minutos)}:${padZero(segundos)}`;
        } else {
            relojElement.innerHTML = `${dias}d ${padZero(horas)}h ${padZero(minutos)}m ${padZero(segundos)}s`;
        }

        // Efecto de pulso cada segundo
        if (relojWrapper) {
            relojWrapper.classList.add('tic');
            setTimeout(() => {
                relojWrapper.classList.remove('tic');
            }, 100);
        }
    }

    // Inicializar
    actualizarReloj();
    setInterval(actualizarReloj, CONFIG.updateInterval);

    // Actualizar formato en resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(actualizarReloj, 100);
    });

})();
