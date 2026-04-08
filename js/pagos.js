/**
 * VOLT Store — Pago con Mercado Pago (Preference API)
 *
 * Flujo: stepper en modal (datos → envío → resumen) → backend crea preferencia → init_point.
 *
 * Variables de entorno (Vercel / hosting):
 *   MP_ACCESS_TOKEN, SITE_URL
 *
 * Desarrollo local: create_preference.php o `vercel dev` para /api/create-preference.
 */

document.addEventListener("DOMContentLoaded", () => {
    const checkoutBtn = document.getElementById("checkout-btn");
    const CUSTOMER_STORAGE_KEY = "volt_checkout_customer";

    /** Envío validado al tocar "Continuar" en paso 2; se usa en "IR A PAGAR" y se limpia al cerrar/resetear el modal. */
    let _shippingConfirmado = null;

    if (!checkoutBtn) return;

    let checkoutFlowActive = false;

    const isProduction = !window.location.hostname.includes("localhost");

    const API_URL = isProduction
        ? "/api/create-preference"
        : "http://localhost:8080/create_preference.php";

    const SHIPPING_LABELS = {
        cadete: "Cadete en moto (Córdoba Capital)",
        andreani: "Andreani",
        correo: "Correo Argentino",
        coordinar: "Coordinar entrega",
    };

    const SHIPPING_METHODS = ["cadete", "andreani", "correo", "coordinar"];

    function injectCheckoutStyles() {
        if (document.getElementById("voltCheckoutModalStyles")) return;
        const s = document.createElement("style");
        s.id = "voltCheckoutModalStyles";
        s.textContent = `
            #customerDataModal .volt-stepper { display:flex; gap:0; margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid #44464c; }
            #customerDataModal .volt-stepper__item { flex:1; text-align:center; font-family:Barlow,sans-serif; font-size:0.7rem; letter-spacing:0.06em; text-transform:uppercase; color:#888; position:relative; }
            #customerDataModal .volt-stepper__item strong { display:block; font-family:Teko,sans-serif; font-size:1.15rem; letter-spacing:0.06em; margin-bottom:2px; }
            #customerDataModal .volt-stepper__item.is-active { color:#f2f2f2; }
            #customerDataModal .volt-stepper__item.is-active strong { color:#c1121f; }
            #customerDataModal .volt-stepper__item.is-done strong { color:#f2f2f2; }
            #customerDataModal .volt-stepper__bar { height:3px; background:#333; border-radius:2px; margin-bottom:0.85rem; overflow:hidden; }
            #customerDataModal .volt-stepper__fill { height:100%; background:#c1121f; width:0%; transition:width 0.25s ease; }
            #customerDataModal .volt-step-panel { display:none; }
            #customerDataModal .volt-step-panel.is-visible { display:block; }
            #customerDataModal .volt-ship-grid { display:grid; grid-template-columns:1fr; gap:0.6rem; }
            @media (min-width:576px) {
                #customerDataModal .volt-ship-grid { grid-template-columns:1fr 1fr; }
            }
            #customerDataModal .volt-ship-card {
                border:1px solid #44464c; border-radius:4px; padding:0.65rem 0.75rem; cursor:pointer;
                background:#161616; text-align:left; transition:border-color 0.15s, background 0.15s;
                font-family:Barlow,sans-serif; font-size:0.875rem; color:#e8e8e8;
            }
            #customerDataModal .volt-ship-card:hover { border-color:#666; }
            #customerDataModal .volt-ship-card.is-selected { border-color:#c1121f; background:rgba(193,18,31,0.12); }
            #customerDataModal .volt-ship-card__title { font-family:Teko,sans-serif; font-size:1.25rem; letter-spacing:0.05em; margin:0 0 0.35rem 0; color:#fff; }
            #customerDataModal .volt-ship-card__meta { font-size:0.78rem; color:#aaa; line-height:1.35; margin:0; }
            #customerDataModal .volt-summary-list { list-style:none; padding:0; margin:0 0 1rem 0; font-size:0.9rem; }
            #customerDataModal .volt-summary-list li { padding:0.45rem 0; border-bottom:1px solid #333; display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; }
            #customerDataModal .volt-summary-ship { font-size:0.85rem; color:#ccc; line-height:1.5; white-space:pre-wrap; }
        `;
        document.head.appendChild(s);
    }

    function createCustomerModal() {
        if (document.getElementById("customerDataModal")) return;
        injectCheckoutStyles();
        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.id = "customerDataModal";
        modal.tabIndex = -1;
        modal.setAttribute("aria-labelledby", "customerDataModalTitle");
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                <div class="modal-content" style="background:#111;color:#f2f2f2;border:1px solid #44464c;">
                    <div class="modal-header" style="border-bottom:1px solid #44464c;flex-wrap:wrap;gap:0.5rem;">
                        <h5 class="modal-title" id="customerDataModalTitle" style="font-family:Teko,sans-serif;letter-spacing:0.08em;font-size:1.5rem;">CHECKOUT</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body pt-2">
                        <div class="volt-stepper__bar" aria-hidden="true"><div class="volt-stepper__fill" id="checkoutStepperFill"></div></div>
                        <div class="volt-stepper" role="navigation" aria-label="Pasos del checkout">
                            <div class="volt-stepper__item is-active" data-step-indicator="1"><strong>1</strong>Datos</div>
                            <div class="volt-stepper__item" data-step-indicator="2"><strong>2</strong>Envío</div>
                            <div class="volt-stepper__item" data-step-indicator="3"><strong>3</strong>Resumen</div>
                        </div>

                        <div id="checkoutStep1" class="volt-step-panel is-visible">
                            <form id="customerDataForm" novalidate>
                                <div class="mb-2">
                                    <label class="form-label" for="customerName">Nombre completo</label>
                                    <input type="text" class="form-control" id="customerName" required autocomplete="name" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;">
                                </div>
                                <div class="mb-2">
                                    <label class="form-label" for="customerEmail">Email</label>
                                    <input type="email" class="form-control" id="customerEmail" required autocomplete="email" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;">
                                </div>
                                <div class="mb-2">
                                    <label class="form-label" for="customerPhone">Teléfono</label>
                                    <input type="tel" class="form-control" id="customerPhone" required autocomplete="tel" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;">
                                </div>
                            </form>
                        </div>

                        <div id="checkoutStep2" class="volt-step-panel">
                            <p class="small text-secondary mb-2" style="font-family:Barlow,sans-serif;">Elegí un método de envío</p>
                            <div class="volt-ship-grid mb-3" role="radiogroup" aria-label="Método de envío">
                                <button type="button" class="volt-ship-card" data-shipping="cadete" aria-pressed="false">
                                    <div class="volt-ship-card__title">🏍️ Cadete en moto</div>
                                    <p class="volt-ship-card__meta">Solo Córdoba Capital. Coordinamos la entrega por WhatsApp. Sin costo adicional en este paso.</p>
                                </button>
                                <button type="button" class="volt-ship-card" data-shipping="andreani" aria-pressed="false">
                                    <div class="volt-ship-card__title">📦 Andreani</div>
                                    <p class="volt-ship-card__meta">Para todo el país. El costo de envío se coordina por WhatsApp después de la compra.</p>
                                </button>
                                <button type="button" class="volt-ship-card" data-shipping="correo" aria-pressed="false">
                                    <div class="volt-ship-card__title">📮 Correo Argentino</div>
                                    <p class="volt-ship-card__meta">Para localidades sin cobertura Andreani. El costo de envío se coordina por WhatsApp después de la compra.</p>
                                </button>
                                <button type="button" class="volt-ship-card" data-shipping="coordinar" aria-pressed="false">
                                    <div class="volt-ship-card__title">🤝 Coordinar entrega</div>
                                    <p class="volt-ship-card__meta">Para casos especiales. Contanos cómo preferís recibir tu pedido.</p>
                                </button>
                            </div>
                            <div id="shippingAddressFields" class="d-none">
                                <div class="mb-2">
                                    <label class="form-label" for="shipStreet">Calle y número</label>
                                    <input type="text" class="form-control" id="shipStreet" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;">
                                </div>
                                <div class="row g-2">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label" for="shipCity">Ciudad</label>
                                        <input type="text" class="form-control" id="shipCity" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;">
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label" for="shipProvince">Provincia</label>
                                        <input type="text" class="form-control" id="shipProvince" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;">
                                    </div>
                                </div>
                                <div class="mb-2">
                                    <label class="form-label" for="shipPostalCode">Código postal</label>
                                    <input type="text" class="form-control" id="shipPostalCode" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;">
                                </div>
                            </div>
                            <div id="shippingCoordinarField" class="d-none mb-1">
                                <label class="form-label" for="shipNotes">Contanos cómo preferís recibir tu pedido</label>
                                <textarea class="form-control" id="shipNotes" rows="3" style="background:#1a1a1a;border-color:#44464c;color:#f2f2f2;"></textarea>
                            </div>
                        </div>

                        <div id="checkoutStep3" class="volt-step-panel">
                            <h6 class="text-uppercase small mb-2" style="font-family:Teko,sans-serif;letter-spacing:0.1em;color:#c1121f;">Tu pedido</h6>
                            <ul class="volt-summary-list" id="checkoutSummaryItems"></ul>
                            <h6 class="text-uppercase small mb-2" style="font-family:Teko,sans-serif;letter-spacing:0.1em;color:#c1121f;">Envío</h6>
                            <div class="volt-summary-ship" id="checkoutSummaryShipping"></div>
                        </div>
                    </div>
                    <div class="modal-footer flex-wrap gap-2" style="border-top:1px solid #44464c;">
                        <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancelar</button>
                        <div class="ms-auto d-flex flex-wrap gap-2">
                            <button type="button" class="btn btn-outline-secondary btn-sm d-none" id="checkoutStepBack">Atrás</button>
                            <button type="button" class="btn btn-danger btn-sm" id="checkoutStepNext">Continuar</button>
                            <button type="button" class="btn btn-danger btn-sm d-none" id="customerDataConfirm">IR A PAGAR CON MERCADO PAGO</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        bindShippingCards(modal);
    }

    function getSavedCustomerData() {
        try {
            return JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function setSavedCustomerData(data) {
        localStorage.setItem(
            CUSTOMER_STORAGE_KEY,
            JSON.stringify({
                name: data.name || "",
                phone: data.phone || "",
                email: data.email || "",
            })
        );
    }

    function getSelectedCardMethod(modalEl) {
        const card = modalEl.querySelector(".volt-ship-card.is-selected");
        if (!card) return null;
        const method = card.getAttribute("data-shipping");
        if (!method || !SHIPPING_METHODS.includes(method)) return null;
        return method;
    }

    function updateShippingFieldVisibility(modalEl) {
        const method = getSelectedCardMethod(modalEl);
        const addrBlock = modalEl.querySelector("#shippingAddressFields");
        const coordBlock = modalEl.querySelector("#shippingCoordinarField");
        if (!addrBlock || !coordBlock) return;
        const showAddr = method === "andreani" || method === "correo";
        const showCoord = method === "coordinar";
        addrBlock.classList.toggle("d-none", !showAddr);
        coordBlock.classList.toggle("d-none", !showCoord);
    }

    function bindShippingCards(modalEl) {
        modalEl.querySelectorAll(".volt-ship-card[data-shipping]").forEach((btn) => {
            btn.addEventListener("click", () => {
                modalEl.querySelectorAll(".volt-ship-card").forEach((b) => {
                    b.classList.remove("is-selected");
                    b.setAttribute("aria-pressed", "false");
                });
                btn.classList.add("is-selected");
                btn.setAttribute("aria-pressed", "true");
                updateShippingFieldVisibility(modalEl);
            });
        });
    }

    function normalizeShippingShape(s) {
        const emptyAddr = { street: "", city: "", province: "", postalCode: "" };
        if (!s || typeof s !== "object") {
            return { method: "", address: { ...emptyAddr }, notes: "" };
        }
        const a = s.address && typeof s.address === "object" ? s.address : {};
        return {
            method: String(s.method || "").trim(),
            address: {
                street: String(a.street || "").trim(),
                city: String(a.city || "").trim(),
                province: String(a.province || "").trim(),
                postalCode: String(a.postalCode || "").trim(),
            },
            notes: String(s.notes || "").trim(),
        };
    }

    function cloneShipping(s) {
        const n = normalizeShippingShape(s);
        return { ...n, address: { ...n.address } };
    }

    function formatMoney(n) {
        return `$${Number(n || 0).toLocaleString("es-AR")}`;
    }

    function renderSummary(modalEl, cart, customer, shipping) {
        const itemsEl = modalEl.querySelector("#checkoutSummaryItems");
        const shipEl = modalEl.querySelector("#checkoutSummaryShipping");
        if (!itemsEl || !shipEl) return;

        itemsEl.innerHTML = cart
            .map((item) => {
                const title = item.title || "Producto";
                const qty = item.quantity || 1;
                const line = formatMoney(item.price * qty);
                const bits = [];
                if (item.variantSize) bits.push(`Talle: ${item.variantSize}`);
                if (item.variantColor) bits.push(`Color: ${item.variantColor}`);
                const sub = bits.length ? ` · ${bits.join(" · ")}` : "";
                return `<li><span>${title}${sub} ×${qty}</span><span>${line}</span></li>`;
            })
            .join("");

        const methodLabel = SHIPPING_LABELS[shipping.method] || shipping.method;
        let shipText = `${methodLabel}\n`;
        if (shipping.method === "andreani" || shipping.method === "correo") {
            const a = shipping.address;
            shipText += `${a.street}\n${a.city}, ${a.province} — CP ${a.postalCode}\n`;
            shipText += "El costo de envío se coordina por WhatsApp después de la compra.";
        } else if (shipping.method === "cadete") {
            shipText += "Córdoba Capital. Coordinamos la entrega por WhatsApp.";
        } else if (shipping.method === "coordinar") {
            shipText += shipping.notes;
        }
        shipText += `\n\nContacto: ${customer.name} · ${customer.email} · ${customer.phone}`;
        shipEl.textContent = shipText;
    }

    /**
     * Paso 2 → 3: lee `.volt-ship-card.is-selected`, arma objeto y guarda en _shippingConfirmado.
     * @returns {object|null}
     */
    function confirmShippingStep2(modalEl) {
        const card = modalEl.querySelector(".volt-ship-card.is-selected");
        if (!card) {
            alert("Elegí un método de envío.");
            return null;
        }
        const method = card.getAttribute("data-shipping");
        if (!method || !SHIPPING_METHODS.includes(method)) {
            alert("Elegí un método de envío.");
            return null;
        }

        const emptyAddr = { street: "", city: "", province: "", postalCode: "" };

        if (method === "andreani" || method === "correo") {
            const address = {
                street: (modalEl.querySelector("#shipStreet")?.value || "").trim(),
                city: (modalEl.querySelector("#shipCity")?.value || "").trim(),
                province: (modalEl.querySelector("#shipProvince")?.value || "").trim(),
                postalCode: (modalEl.querySelector("#shipPostalCode")?.value || "").trim(),
            };
            if (!address.street || !address.city || !address.province || !address.postalCode) {
                alert("Completá calle y número, ciudad, provincia y código postal.");
                return null;
            }
            return { method, address, notes: "" };
        }

        if (method === "coordinar") {
            const notes = (modalEl.querySelector("#shipNotes")?.value || "").trim();
            if (!notes) {
                alert("Contanos cómo preferís recibir tu pedido.");
                return null;
            }
            return { method, address: { ...emptyAddr }, notes };
        }

        return { method, address: { ...emptyAddr }, notes: "" };
    }

    /**
     * @param {Array} cart — ítems del carrito local
     * @returns {Promise<{customer: object, shipping: object} | null>}
     */
    function askCheckoutData(cart) {
        createCustomerModal();
        const modalEl = document.getElementById("customerDataModal");

        _shippingConfirmado = null;

        const saved = getSavedCustomerData();
        const authUser = window.VoltStoreAuth?.getCurrentUser();
        modalEl.querySelector("#customerName").value = saved.name || authUser?.displayName || "";
        modalEl.querySelector("#customerEmail").value = saved.email || authUser?.email || "";
        modalEl.querySelector("#customerPhone").value = saved.phone || "";

        modalEl.querySelectorAll(".volt-ship-card").forEach((b) => {
            b.classList.remove("is-selected");
            b.setAttribute("aria-pressed", "false");
        });
        ["#shipStreet", "#shipCity", "#shipProvince", "#shipPostalCode", "#shipNotes"].forEach((sel) => {
            const el = modalEl.querySelector(sel);
            if (el) el.value = "";
        });
        updateShippingFieldVisibility(modalEl);

        let currentStep = 1;
        const fillEl = modalEl.querySelector("#checkoutStepperFill");
        const indicators = modalEl.querySelectorAll("[data-step-indicator]");
        const stepPanels = [
            modalEl.querySelector("#checkoutStep1"),
            modalEl.querySelector("#checkoutStep2"),
            modalEl.querySelector("#checkoutStep3"),
        ];
        const btnBack = modalEl.querySelector("#checkoutStepBack");
        const btnNext = modalEl.querySelector("#checkoutStepNext");
        const btnPay = modalEl.querySelector("#customerDataConfirm");

        function setStepperUI() {
            const pct = currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%";
            if (fillEl) fillEl.style.width = pct;
            indicators.forEach((ind) => {
                const n = Number(ind.getAttribute("data-step-indicator"));
                ind.classList.remove("is-active", "is-done");
                if (n < currentStep) ind.classList.add("is-done");
                if (n === currentStep) ind.classList.add("is-active");
            });
            stepPanels.forEach((panel, i) => {
                if (!panel) return;
                panel.classList.toggle("is-visible", i + 1 === currentStep);
            });
            btnBack.classList.toggle("d-none", currentStep === 1);
            btnNext.classList.toggle("d-none", currentStep === 3);
            btnPay.classList.toggle("d-none", currentStep !== 3);
        }

        currentStep = 1;
        setStepperUI();

        return new Promise((resolve) => {
            const modal = new bootstrap.Modal(modalEl);
            let settled = false;

            const finish = (payload) => {
                if (settled) return;
                settled = true;
                cleanup();
                modal.hide();
                resolve(payload);
            };

            const cleanup = () => {
                btnNext.removeEventListener("click", onNext);
                btnBack.removeEventListener("click", onBack);
                btnPay.removeEventListener("click", onPay);
                modalEl.removeEventListener("hidden.bs.modal", onHidden);
            };

            const onHidden = () => {
                if (!settled) {
                    _shippingConfirmado = null;
                    finish(null);
                }
            };

            const onBack = () => {
                if (currentStep > 1) {
                    if (currentStep === 3) _shippingConfirmado = null;
                    currentStep -= 1;
                    setStepperUI();
                }
            };

            const onNext = () => {
                if (currentStep === 1) {
                    const customer = {
                        name: modalEl.querySelector("#customerName").value.trim(),
                        phone: modalEl.querySelector("#customerPhone").value.trim(),
                        email: modalEl.querySelector("#customerEmail").value.trim(),
                    };
                    if (!customer.name || !customer.email || !customer.phone) {
                        alert("Completá nombre completo, email y teléfono.");
                        return;
                    }
                    setSavedCustomerData(customer);
                    currentStep = 2;
                    setStepperUI();
                    return;
                }
                if (currentStep === 2) {
                    const shipping = confirmShippingStep2(modalEl);
                    if (!shipping) return;
                    _shippingConfirmado = shipping;
                    const customer = {
                        name: modalEl.querySelector("#customerName").value.trim(),
                        phone: modalEl.querySelector("#customerPhone").value.trim(),
                        email: modalEl.querySelector("#customerEmail").value.trim(),
                    };
                    renderSummary(modalEl, cart, customer, _shippingConfirmado);
                    currentStep = 3;
                    setStepperUI();
                }
            };

            const onPay = () => {
                if (!_shippingConfirmado || !String(_shippingConfirmado.method || "").trim()) {
                    alert("Por favor volvé al paso 2 y elegí un método de envío");
                    currentStep = 2;
                    setStepperUI();
                    return;
                }

                const shipping = cloneShipping(_shippingConfirmado);
                const a = shipping.address;

                if (shipping.method === "andreani" || shipping.method === "correo") {
                    if (!a.street || !a.city || !a.province || !a.postalCode) {
                        alert("Completá la dirección de envío.");
                        _shippingConfirmado = null;
                        currentStep = 2;
                        setStepperUI();
                        return;
                    }
                }
                if (shipping.method === "coordinar" && !shipping.notes.trim()) {
                    alert("Contanos cómo preferís recibir tu pedido.");
                    _shippingConfirmado = null;
                    currentStep = 2;
                    setStepperUI();
                    return;
                }

                const customer = {
                    name: modalEl.querySelector("#customerName").value.trim(),
                    phone: modalEl.querySelector("#customerPhone").value.trim(),
                    email: modalEl.querySelector("#customerEmail").value.trim(),
                };
                if (!customer.name || !customer.email || !customer.phone) {
                    alert("Completá tus datos personales.");
                    currentStep = 1;
                    setStepperUI();
                    return;
                }

                setSavedCustomerData(customer);
                const payload = { customer, shipping: cloneShipping(_shippingConfirmado) };
                _shippingConfirmado = null;
                finish(payload);
            };

            btnNext.addEventListener("click", onNext);
            btnBack.addEventListener("click", onBack);
            btnPay.addEventListener("click", onPay);
            modalEl.addEventListener("hidden.bs.modal", onHidden, { once: true });
            modal.show();
        });
    }

    checkoutBtn.addEventListener("click", async function () {
        if (checkoutFlowActive) return;

        let cart;
        try {
            cart = JSON.parse(localStorage.getItem("cart")) || [];
        } catch {
            alert("Tu carrito tiene un error, por favor recargá la página");
            return;
        }

        if (cart.length === 0) {
            alert("🛒 El carrito está vacío.");
            return;
        }

        if (window.VoltStoreAuth) {
            const user = await window.VoltStoreAuth.requireAuth();
            if (!user) return;
        }

        checkoutFlowActive = true;
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = "⏳ Generando link de pago...";
        checkoutBtn.disabled = true;

        try {
            const result = await askCheckoutData(cart);
            if (!result) {
                checkoutFlowActive = false;
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
                return;
            }
            const { customer, shipping } = result;

            const missingId = cart.find((item) => !item.id);
            if (missingId) {
                throw new Error(
                    "Un producto del carrito no tiene id. Volvé al shop, vaciá el carrito y agregá los productos de nuevo."
                );
            }

            const items = cart.map((item) => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
                variantColor: item.variantColor || "",
                variantSize: item.variantSize || "",
            }));

            const postBody = {
                items,
                customer,
                shipping: normalizeShippingShape(shipping),
            };

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postBody),
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

            const uid = firebase.auth().currentUser?.uid;
            if (window.VoltCartSync) {
                await window.VoltCartSync.clearFirestore(uid);
                window.VoltCartSync.clearLocal();
            }

            window.location.href = payUrl;
        } catch (error) {
            console.error("❌ Error al iniciar el pago:", error);
            alert("Error al generar el pago: " + error.message);
            checkoutFlowActive = false;
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    });
});
