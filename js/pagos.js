/**
 * VOLT Store — Pago con Mercado Pago (Preference API)
 *
 * Flujo: el carrito se envía al backend → se crea una preferencia con el Access Token
 * (solo en servidor) → la API devuelve init_point → redirección al checkout de MP.
 *
 * Variables de entorno (Vercel / hosting):
 *   MP_ACCESS_TOKEN — Credenciales de producción (o prueba) desde mercadopago.com.ar
 *   SITE_URL — URL pública del sitio (back_urls y webhook)
 *
 * Desarrollo local: configurá create_preference.php con tu token y levantá PHP en :8080,
 * o usá `vercel dev` para probar /api/create-preference.
 */

document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.getElementById("checkout-btn");
    const CUSTOMER_STORAGE_KEY = "volt_checkout_customer";

    if (!checkoutBtn) return;

    const isProduction = !window.location.hostname.includes("localhost");

    const API_URL = isProduction
        ? "/api/create-preference"
        : "http://localhost:8080/create_preference.php";

    function createCustomerModal() {
        if (document.getElementById("customerDataModal")) return;
        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.id = "customerDataModal";
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content" style="background:#111;color:#f2f2f2;border:1px solid #44464c;">
                    <div class="modal-header" style="border-bottom:1px solid #44464c;">
                        <h5 class="modal-title" style="font-family:Teko, sans-serif; letter-spacing:0.08em;">DATOS DE ENVIO</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <form id="customerDataForm">
                            <div class="mb-2">
                                <label class="form-label">Nombre y apellido</label>
                                <input type="text" class="form-control" id="customerName" required>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Telefono</label>
                                <input type="tel" class="form-control" id="customerPhone" required>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Correo</label>
                                <input type="email" class="form-control" id="customerEmail" required>
                            </div>
                            <div class="mb-1">
                                <label class="form-label">Direccion completa</label>
                                <textarea class="form-control" id="customerAddress" rows="2" required></textarea>
                            </div>
                            <div class="mb-1">
                                <label class="form-label">CODIGO POSTAL</label>
                                <input type="text" class="form-control" id="customerPostalCode" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer" style="border-top:1px solid #44464c;">
                        <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger btn-sm" id="customerDataConfirm">Continuar al pago</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function getSavedCustomerData() {
        try {
            return JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function setSavedCustomerData(data) {
        localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data));
    }

    // Solicita datos de cliente y devuelve objeto listo para enviar al backend.
    function askCustomerData() {
        createCustomerModal();
        const modalEl = document.getElementById("customerDataModal");
        const saved = getSavedCustomerData();
        document.getElementById("customerName").value = saved.name || "";
        document.getElementById("customerPhone").value = saved.phone || "";
        document.getElementById("customerEmail").value = saved.email || "";
        document.getElementById("customerAddress").value = saved.address || "";
        document.getElementById("customerPostalCode").value = saved.postalCode || "";

        return new Promise((resolve) => {
            const modal = new bootstrap.Modal(modalEl);
            const confirmBtn = document.getElementById("customerDataConfirm");

            const cleanup = () => {
                confirmBtn.removeEventListener("click", onConfirm);
                modalEl.removeEventListener("hidden.bs.modal", onHidden);
            };

            const onHidden = () => {
                cleanup();
                resolve(null);
            };

            const onConfirm = () => {
                const customer = {
                    name: document.getElementById("customerName").value.trim(),
                    phone: document.getElementById("customerPhone").value.trim(),
                    email: document.getElementById("customerEmail").value.trim(),
                    address: document.getElementById("customerAddress").value.trim(),
                    postalCode: document.getElementById("customerPostalCode").value.trim(),
                };

                if (!customer.name || !customer.phone || !customer.email || !customer.address || !customer.postalCode) {
                    alert("Completá nombre, teléfono, correo, dirección y código postal.");
                    return;
                }

                setSavedCustomerData(customer);
                cleanup();
                modal.hide();
                resolve(customer);
            };

            confirmBtn.addEventListener("click", onConfirm);
            modalEl.addEventListener("hidden.bs.modal", onHidden, { once: true });
            modal.show();
        });
    }

    checkoutBtn.addEventListener("click", async function () {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        if (cart.length === 0) {
            alert("🛒 El carrito está vacío.");
            return;
        }

        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = "⏳ Generando link de pago...";
        checkoutBtn.disabled = true;

        try {
            const customer = await askCustomerData();
            if (!customer) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
                return;
            }

            const items = cart.map((item) => ({
                title: item.title,
                quantity: item.quantity,
                price: item.price,
            }));

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, customer }),
            });

            const data = await response.json();

            if (data.error) {
                console.log("📋 Detalles del error:", JSON.stringify(data, null, 2));
                throw new Error(data.error + (data.details ? " — " + data.details : ""));
            }

            const payUrl = data.init_point;

            if (!payUrl) {
                throw new Error(
                    "El servidor no devolvió el link de pago (init_point). Revisá MP_ACCESS_TOKEN y la respuesta de la API."
                );
            }
            if (!data.orderId) {
                throw new Error("El servidor no devolvió orderId para seguimiento de la orden.");
            }

            localStorage.setItem("volt_current_order", data.orderId);
            window.location.href = payUrl;
        } catch (error) {
            console.error("❌ Error al iniciar el pago:", error);
            alert("Error al generar el pago: " + error.message);
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    });
});
