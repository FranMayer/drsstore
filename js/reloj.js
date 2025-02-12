function actualizarReloj() {
    const fechaGP = new Date("March 16, 2025 00:00:00 GMT+0000");
    const ahora = new Date();
    const diferencia = fechaGP - ahora;

    if (diferencia < 0) {
        document.getElementById("reloj").innerHTML = "¡El GP ha comenzado!";
    } else {
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        document.getElementById("reloj").innerHTML = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
    }
}


setInterval(actualizarReloj, 1000);
actualizarReloj();

