document.querySelectorAll('.js-newsletter-form').forEach(function(form) {
    var msg = form.parentElement.querySelector('.js-newsletter-msg');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var btn   = form.querySelector('button[type="submit"]');
        var email = (input.value || '').trim();
        if (!email) return;

        btn.disabled = true;
        btn.textContent = '...';
        if (msg) { msg.textContent = ''; msg.style.color = ''; }

        try {
            var resp = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            if (resp.ok) {
                input.value = '';
                if (msg) {
                    msg.textContent = '✅ ¡Te suscribiste! Te avisamos en cada drop.';
                    msg.style.color = '#22c55e';
                }
            } else {
                throw new Error('Error del servidor');
            }
        } catch (err) {
            if (msg) {
                msg.textContent = '❌ No se pudo suscribir. Intentá de nuevo.';
                msg.style.color = '#c1121f';
            }
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enviar';
        }
    });
});
