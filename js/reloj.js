function actualizarReloj() {
    // Fecha y hora del primer GP de Australia (2025, marzo 16 a las 00:00)
    const fechaGP = new Date("March 16, 2025 00:00:00 GMT+0000");

    // Fecha y hora actual
    const ahora = new Date();

    // Calcular la diferencia
    const diferencia = fechaGP - ahora;

    // Calcular días, horas, minutos y segundos
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    // Mostrar el resultado en el div
    document.getElementById("reloj").innerHTML = `${dias}d ${horas}h ${minutos}m ${segundos}s`;

    // Si el tiempo se acaba
    if (diferencia < 0) {
        document.getElementById("reloj").innerHTML = "¡El Gran Premio de Australia ha comenzado!";
    }
}

// Actualizar el reloj cada segundo
setInterval(actualizarReloj, 1000);

// Llamada inicial para mostrar el reloj al cargar la página
actualizarReloj();
