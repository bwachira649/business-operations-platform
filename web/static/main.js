"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const mobileMenu = document.getElementById("mobileMenu");

    const commandOverlay = document.getElementById("commandOverlay");
    const commandInput = document.getElementById("commandInput");
    const commandResults = document.getElementById("commandResults");
    const searchTrigger = document.getElementById("searchTrigger");

    const kpiRail = document.getElementById("kpiRail");
    const kpiPrev = document.getElementById("kpiPrev");
    const kpiNext = document.getElementById("kpiNext");

    const quickActionButton = document.getElementById("quickActionButton");
    const exportButton = document.getElementById("exportButton");
    const revenuePeriod = document.getElementById("revenuePeriod");

    const toast = document.getElementById("toast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    let toastTimer = null;
    let customers = [];
    let customerSearchTimer = null;
    let editingCustomerId = null;

    /* ============================================================
       CUSTOMER MODULE STYLES
       ============================================================ */

    function installCustomerStyles() {
        if (document.getElementById("customerModuleStyles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "customerModuleStyles";

        style.textContent = `
            .customers-view {
                display: none;
                padding: 32px 36px 48px;
                animation: customerViewIn .35s ease both;
            }

            .customers-view.visible {
                display: block;
            }

            @keyframes customerViewIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .customer-page-header {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 24px;
                margin-bottom: 28px;
            }

            .customer-page-header h1 {
                margin: 6px 0 8px;
                font-family: "Space Grotesk", sans-serif;
                font-size: clamp(30px, 4vw, 46px);
                line-height: 1;
                letter-spacing: -1.5px;
            }

            .customer-page-header p {
                margin: 0;
                color: var(--text-muted, #6b7280);
                font-size: 15px;
            }

            .customer-header-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .customer-toolbar {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 18px;
                padding: 12px;
                border: 1px solid var(--border, #e5e7eb);
                border-radius: 18px;
                background: var(--surface, #fff);
                box-shadow: 0 10px 30px rgba(0, 0, 0, .04);
            }

            .customer-search {
                flex: 1;
                min-width: 220px;
                position: relative;
            }

            .customer-search span {
                position: absolute;
                left: 15px;
                top: 50%;
                transform: translateY(-50%);
                opacity: .55;
                font-size: 18px;
            }

            .customer-search input {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid transparent;
                border-radius: 12px;
                padding: 12px 14px 12px 42px;
                background: var(--surface-soft, #f5f6f8);
                color: inherit;
                outline: none;
                font: inherit;
                transition: .2s ease;
            }

            .customer-search input:focus {
                border-color: currentColor;
                background: var(--surface, #fff);
                box-shadow: 0 0 0 4px rgba(0, 0, 0, .04);
            }

            .customer-filter {
                border: 1px solid var(--border, #e5e7eb);
                border-radius: 12px;
                padding: 12px 38px 12px 14px;
                background: var(--surface, #fff);
                color: inherit;
                font: inherit;
                cursor: pointer;
            }

            .customer-summary {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin: 0 4px 12px;
                color: var(--text-muted, #6b7280);
                font-size: 13px;
            }

            .customer-summary strong {
                color: inherit;
            }

            .customer-table-card {
                overflow: hidden;
                border: 1px solid var(--border, #e5e7eb);
                border-radius: 20px;
                background: var(--surface, #fff);
                box-shadow: 0 14px 40px rgba(0, 0, 0, .045);
            }

            .customer-table-scroll {
                overflow-x: auto;
            }

            .customer-table {
                width: 100%;
                min-width: 820px;
                border-collapse: collapse;
            }

            .customer-table th {
                padding: 15px 18px;
                text-align: left;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: .08em;
                color: var(--text-muted, #6b7280);
                background: var(--surface-soft, #f8f9fb);
                border-bottom: 1px solid var(--border, #e5e7eb);
                white-space: nowrap;
            }

            .customer-table td {
                padding: 17px 18px;
                border-bottom: 1px solid var(--border, #eef0f2);
                font-size: 14px;
                vertical-align: middle;
            }

            .customer-table tbody tr {
                transition: background .18s ease;
            }

            .customer-table tbody tr:hover {
                background: var(--surface-soft, #fafafa);
            }

            .customer-table tbody tr:last-child td {
                border-bottom: 0;
            }

            .customer-identity {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 200px;
            }

            .customer-avatar {
                width: 40px;
                height: 40px;
                flex: 0 0 40px;
                display: grid;
                place-items: center;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 700;
                background: linear-gradient(135deg, #111827, #4b5563);
                color: #fff;
            }

            .customer-name {
                font-weight: 700;
            }

            .customer-subtext {
                margin-top: 3px;
                color: var(--text-muted, #6b7280);
                font-size: 12px;
            }

            .customer-status {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                border-radius: 999px;
                padding: 6px 10px;
                font-size: 12px;
                font-weight: 700;
                text-transform: capitalize;
            }

            .customer-status::before {
                content: "";
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: currentColor;
            }

            .customer-status.active {
                color: #15803d;
                background: #dcfce7;
            }

            .customer-status.inactive {
                color: #6b7280;
                background: #f3f4f6;
            }

            .customer-status.prospect {
                color: #a16207;
                background: #fef3c7;
            }

            .customer-actions {
                display: flex;
                justify-content: flex-end;
                gap: 6px;
            }

            .customer-action {
                width: 34px;
                height: 34px;
                border: 1px solid var(--border, #e5e7eb);
                border-radius: 10px;
                background: transparent;
                color: inherit;
                cursor: pointer;
                transition: transform .18s ease, background .18s ease;
            }

            .customer-action:hover {
                transform: translateY(-1px);
                background: var(--surface-soft, #f5f6f8);
            }

            .customer-empty {
                padding: 70px 24px;
                text-align: center;
            }

            .customer-empty-icon {
                width: 58px;
                height: 58px;
                margin: 0 auto 15px;
                display: grid;
                place-items: center;
                border-radius: 18px;
                background: var(--surface-soft, #f3f4f6);
                font-size: 25px;
            }

            .customer-empty h3 {
                margin: 0 0 7px;
                font-family: "Space Grotesk", sans-serif;
            }

            .customer-empty p {
                margin: 0 0 18px;
                color: var(--text-muted, #6b7280);
            }

            .customer-loading {
                padding: 65px 20px;
                text-align: center;
                color: var(--text-muted, #6b7280);
            }

            .customer-spinner {
                width: 30px;
                height: 30px;
                margin: 0 auto 14px;
                border: 3px solid rgba(0, 0, 0, .1);
                border-top-color: currentColor;
                border-radius: 50%;
                animation: customerSpin .8s linear infinite;
            }

            @keyframes customerSpin {
                to {
                    transform: rotate(360deg);
                }
            }

            .customer-modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(10, 14, 20, .58);
                backdrop-filter: blur(10px);
            }

            .customer-modal-backdrop.open {
                display: flex;
                animation: modalFade .2s ease both;
            }

            @keyframes modalFade {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .customer-modal {
                width: min(600px, 100%);
                max-height: calc(100vh - 40px);
                overflow-y: auto;
                border: 1px solid rgba(255, 255, 255, .16);
                border-radius: 24px;
                background: var(--surface, #fff);
                box-shadow: 0 30px 90px rgba(0, 0, 0, .28);
                animation: modalUp .25s ease both;
            }

            @keyframes modalUp {
                from {
                    opacity: 0;
                    transform: translateY(14px) scale(.98);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .customer-modal-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 20px;
                padding: 25px 26px 18px;
                border-bottom: 1px solid var(--border, #e5e7eb);
            }

            .customer-modal-header h2 {
                margin: 0 0 5px;
                font-family: "Space Grotesk", sans-serif;
            }

            .customer-modal-header p {
                margin: 0;
                color: var(--text-muted, #6b7280);
                font-size: 13px;
            }

            .customer-close {
                width: 36px;
                height: 36px;
                border: 0;
                border-radius: 10px;
                background: var(--surface-soft, #f3f4f6);
                cursor: pointer;
                font-size: 18px;
            }

            .customer-form {
                padding: 24px 26px 26px;
            }

            .customer-form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }

            .customer-field {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .customer-field.full {
                grid-column: 1 / -1;
            }

            .customer-field label {
                font-size: 12px;
                font-weight: 700;
            }

            .customer-field input,
            .customer-field select,
            .customer-field textarea {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid var(--border, #dfe3e8);
                border-radius: 11px;
                padding: 11px 12px;
                background: var(--surface, #fff);
                color: inherit;
                font: inherit;
                outline: none;
                transition: .2s ease;
            }

            .customer-field textarea {
                min-height: 100px;
                resize: vertical;
            }

            .customer-field input:focus,
            .customer-field select:focus,
            .customer-field textarea:focus {
                border-color: currentColor;
                box-shadow: 0 0 0 4px rgba(0, 0, 0, .045);
            }

            .customer-form-error {
                display: none;
                margin: 0 0 16px;
                padding: 11px 13px;
                border-radius: 11px;
                color: #b91c1c;
                background: #fee2e2;
                font-size: 13px;
            }

            .customer-form-error.visible {
                display: block;
            }

            .customer-form-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 22px;
            }

            .customer-button {
                border: 1px solid var(--border, #e5e7eb);
                border-radius: 11px;
                padding: 11px 16px;
                background: var(--surface, #fff);
                color: inherit;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
                transition: transform .18s ease, opacity .18s ease;
            }

            .customer-button:hover {
                transform: translateY(-1px);
            }

            .customer-button.primary {
                border-color: transparent;
                background: #111827;
                color: #fff;
            }

            .customer-button:disabled {
                opacity: .55;
                cursor: wait;
                transform: none;
            }

            .customer-detail {
                padding: 25px 26px 28px;
            }

            .customer-detail-hero {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 24px;
            }

            .customer-detail-avatar {
                width: 60px;
                height: 60px;
                display: grid;
                place-items: center;
                border-radius: 18px;
                background: linear-gradient(135deg, #111827, #4b5563);
                color: #fff;
                font-weight: 700;
                font-size: 17px;
            }

            .customer-detail-hero h3 {
                margin: 0 0 5px;
                font-family: "Space Grotesk", sans-serif;
                font-size: 21px;
            }

            .customer-detail-hero p {
                margin: 0;
                color: var(--text-muted, #6b7280);
            }

            .customer-detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1px;
                overflow: hidden;
                border: 1px solid var(--border, #e5e7eb);
                border-radius: 15px;
                background: var(--border, #e5e7eb);
            }

            .customer-detail-item {
                padding: 15px;
                background: var(--surface, #fff);
            }

            .customer-detail-item small {
                display: block;
                margin-bottom: 5px;
                color: var(--text-muted, #6b7280);
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: .06em;
            }

            .customer-detail-item strong {
                overflow-wrap: anywhere;
            }

            @media (max-width: 800px) {
                .customers-view {
                    padding: 24px 18px 38px;
                }

                .customer-page-header {
                    align-items: flex-start;
                    flex-direction: column;
                }

                .customer-toolbar {
                    align-items: stretch;
                    flex-direction: column;
                }

                .customer-filter {
                    width: 100%;
                }
            }

            @media (max-width: 560px) {
                .customer-form-grid,
                .customer-detail-grid {
                    grid-template-columns: 1fr;
                }

                .customer-field.full {
                    grid-column: auto;
                }

                .customer-modal-header,
                .customer-form,
                .customer-detail {
                    padding-left: 18px;
                    padding-right: 18px;
                }

                .customer-header-actions {
                    width: 100%;
                }

                .customer-header-actions .customer-button {
                    flex: 1;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .customers-view,
                .customer-modal,
                .customer-modal-backdrop {
                    animation: none;
                }

                .customer-action,
                .customer-button {
                    transition: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ============================================================
       NAVIGATION
       ============================================================ */

    function setActiveView(view) {
        document.querySelectorAll(".nav-item").forEach((item) => {
            item.classList.toggle("active", item.dataset.view === view);
        });

        const currentPage = document.querySelector(".breadcrumb strong");

        if (currentPage) {
            const labels = {
                overview: "Overview",
                customers: "Customers",
                orders: "Orders",
                inventory: "Inventory",
                analytics: "Analytics",
                tasks: "Tasks",
                reports: "Reports",
                integrations: "Integrations",
                settings: "Settings",
            };

            currentPage.textContent = labels[view] || "Overview";
        }

        const dashboard = document.getElementById("dashboard");
        const customersView = document.getElementById("customersView");

        if (dashboard) {
            dashboard.style.display = view === "overview" ? "" : "none";
        }

        if (customersView) {
            customersView.classList.toggle("visible", view === "customers");
        }

        if (window.innerWidth <= 760) {
            sidebar.classList.remove("open");
        }

        if (view === "customers") {
            loadCustomers();
        } else if (view !== "overview") {
            showToast(
                `${capitalize(view)} workspace`,
                `${capitalize(view)} module is ready for the next implementation phase.`
            );
        }
    }

    document.querySelectorAll("[data-view]").forEach((item) => {
        item.addEventListener("click", () => {
            setActiveView(item.dataset.view);
        });
    });

    function capitalize(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    /* ============================================================
       MOBILE SIDEBAR
       ============================================================ */

    mobileMenu?.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
        if (window.innerWidth > 760) {
            return;
        }

        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !mobileMenu.contains(event.target)
        ) {
            sidebar.classList.remove("open");
        }
    });

    /* ============================================================
       KPI HORIZONTAL SCROLL
       ============================================================ */

    const getKpiScrollAmount = () => {
        const card = kpiRail?.querySelector(".kpi-card");

        if (!card) {
            return 260;
        }

        return card.getBoundingClientRect().width + 12;
    };

    kpiPrev?.addEventListener("click", () => {
        kpiRail.scrollBy({
            left: -getKpiScrollAmount(),
            behavior: "smooth",
        });
    });

    kpiNext?.addEventListener("click", () => {
        kpiRail.scrollBy({
            left: getKpiScrollAmount(),
            behavior: "smooth",
        });
    });

    /* ============================================================
       COMMAND PALETTE
       ============================================================ */

    function openCommandPalette() {
        commandOverlay.classList.add("open");
        commandOverlay.setAttribute("aria-hidden", "false");

        window.setTimeout(() => {
            commandInput.focus();
        }, 80);
    }

    function closeCommandPalette() {
        commandOverlay.classList.remove("open");
        commandOverlay.setAttribute("aria-hidden", "true");
        commandInput.value = "";
        filterCommands("");
    }

    searchTrigger?.addEventListener("click", openCommandPalette);

    commandOverlay?.addEventListener("click", (event) => {
        if (event.target === commandOverlay) {
            closeCommandPalette();
        }
    });

    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openCommandPalette();
        }

        if (
            event.key === "Escape" &&
            commandOverlay.classList.contains("open")
        ) {
            closeCommandPalette();
        }
    });

    commandInput?.addEventListener("input", () => {
        filterCommands(commandInput.value.trim().toLowerCase());
    });

    function filterCommands(query) {
        const items = commandResults.querySelectorAll(".command-item");

        items.forEach((item) => {
            const text = item.textContent.toLowerCase();
            item.style.display = !query || text.includes(query) ? "flex" : "none";
        });
    }

    commandResults?.addEventListener("click", (event) => {
        const item = event.target.closest(".command-item");

        if (!item) {
            return;
        }

        if (item.dataset.view) {
            setActiveView(item.dataset.view);
            closeCommandPalette();
            return;
        }

        const action = item.dataset.action;

        if (action === "new-order") {
            showToast(
                "New order",
                "Order creation workflow will open when the orders module is connected."
            );
        } else if (action === "customer") {
            setActiveView("customers");
            window.setTimeout(() => {
                openCustomerModal();
            }, 100);
        } else if (action === "report") {
            showToast(
                "Report generator",
                "Report generation will be connected to the reporting service."
            );
        }

        closeCommandPalette();
    });

    /* ============================================================
       QUICK ACTIONS
       ============================================================ */

    quickActionButton?.addEventListener("click", openCommandPalette);

    exportButton?.addEventListener("click", () => {
        showToast(
            "Export prepared",
            "Export functionality will connect to the reporting API."
        );
    });

    /* ============================================================
       REVENUE PERIOD
       ============================================================ */

    revenuePeriod?.addEventListener("change", () => {
        showToast(
            "Period updated",
            `Revenue view changed to ${revenuePeriod.value.toLowerCase()}.`
        );
    });

    /* ============================================================
       DEMO INTERACTIONS
       ============================================================ */

    document.querySelectorAll(".text-button").forEach((button) => {
        button.addEventListener("click", () => {
            showToast(
                "Module navigation",
                "The detailed workspace will be connected to the API in the next phase."
            );
        });
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                item.click();
            }
        });
    });

    /* ============================================================
       TOAST
       ============================================================ */

    function showToast(title, message) {
        if (!toast || !toastTitle || !toastMessage) {
            return;
        }

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        toast.classList.add("visible");

        if (toastTimer) {
            window.clearTimeout(toastTimer);
        }

        toastTimer = window.setTimeout(() => {
            toast.classList.remove("visible");
        }, 3500);
    }

    /* ============================================================
       BACKEND HEALTH CHECK
       ============================================================ */

    async function verifyBackend() {
        try {
            const response = await fetch("/health", {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Health endpoint returned ${response.status}`);
            }

            const data = await response.json();

            if (data.status === "healthy") {
                document.body.dataset.backend = "healthy";
            }
        } catch (error) {
            console.warn("Backend health check failed:", error);
            document.body.dataset.backend = "offline";
        }
    }

    /* ============================================================
       CUSTOMER WORKSPACE
       ============================================================ */

    installCustomerStyles();
    createCustomersView();

    function createCustomersView() {
        const dashboard = document.getElementById("dashboard");

        if (!dashboard || document.getElementById("customersView")) {
            return;
        }

        const customersView = document.createElement("section");

        customersView.className = "customers-view";
        customersView.id = "customersView";

        customersView.innerHTML = `
            <div class="customer-page-header">
                <div>
                    <span class="eyebrow">Relationship management</span>
                    <h1>Customers</h1>
                    <p>Manage customer profiles, relationships and account information.</p>
                </div>

                <div class="customer-header-actions">
                    <button
                        class="customer-button"
                        id="refreshCustomersButton"
                        type="button"
                    >
                        ↻ Refresh
                    </button>

                    <button
                        class="customer-button primary"
                        id="addCustomerButton"
                        type="button"
                    >
                        + Add customer
                    </button>
                </div>
            </div>

            <div class="customer-toolbar">
                <div class="customer-search">
                    <span>⌕</span>
                    <input
                        id="customerSearch"
                        type="search"
                        placeholder="Search by name, email or company..."
                        autocomplete="off"
                    >
                </div>

                <select class="customer-filter" id="customerStatusFilter">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div class="customer-summary">
                <span id="customerResultSummary">Loading customers...</span>
                <span>API: <strong id="customerApiStatus">Connected</strong></span>
            </div>

            <div class="customer-table-card">
                <div class="customer-table-scroll">
                    <div id="customerTableContainer">
                        <div class="customer-loading">
                            <div class="customer-spinner"></div>
                            Loading customer workspace...
                        </div>
                    </div>
                </div>
            </div>
        `;

        dashboard.parentNode.insertBefore(customersView, dashboard.nextSibling);

        document
            .getElementById("addCustomerButton")
            ?.addEventListener("click", () => openCustomerModal());

        document
            .getElementById("refreshCustomersButton")
            ?.addEventListener("click", () => loadCustomers());

        document
            .getElementById("customerStatusFilter")
            ?.addEventListener("change", () => loadCustomers());

        document
            .getElementById("customerSearch")
            ?.addEventListener("input", () => {
                window.clearTimeout(customerSearchTimer);

                customerSearchTimer = window.setTimeout(() => {
                    loadCustomers();
                }, 300);
            });
    }

    async function loadCustomers() {
        const container = document.getElementById("customerTableContainer");
        const summary = document.getElementById("customerResultSummary");
        const apiStatus = document.getElementById("customerApiStatus");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="customer-loading">
                <div class="customer-spinner"></div>
                Loading customers...
            </div>
        `;

        const search =
            document.getElementById("customerSearch")?.value.trim() || "";

        const status =
            document.getElementById("customerStatusFilter")?.value || "";

        const params = new URLSearchParams();

        if (search) {
            params.set("search", search);
        }

        if (status) {
            params.set("status", status);
        }

        params.set("limit", "100");

        try {
            const response = await fetch(
                `/api/v1/customers?${params.toString()}`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Customer API returned ${response.status}`);
            }

            const data = await response.json();

            customers = data.items || [];

            if (summary) {
                summary.textContent =
                    `${data.total} customer${data.total === 1 ? "" : "s"} found`;
            }

            if (apiStatus) {
                apiStatus.textContent = "Connected";
            }

            renderCustomers(customers);
            updateCustomerKpi(data.total);
        } catch (error) {
            console.error("Failed to load customers:", error);

            if (summary) {
                summary.textContent = "Unable to load customers";
            }

            if (apiStatus) {
                apiStatus.textContent = "Offline";
            }

            container.innerHTML = `
                <div class="customer-empty">
                    <div class="customer-empty-icon">!</div>
                    <h3>Customer data unavailable</h3>
                    <p>We couldn't reach the customer API. Check the backend and try again.</p>
                    <button class="customer-button primary" type="button" id="retryCustomersButton">
                        Try again
                    </button>
                </div>
            `;

            document
                .getElementById("retryCustomersButton")
                ?.addEventListener("click", loadCustomers);
        }
    }

    function renderCustomers(items) {
        const container = document.getElementById("customerTableContainer");

        if (!container) {
            return;
        }

        if (!items.length) {
            container.innerHTML = `
                <div class="customer-empty">
                    <div class="customer-empty-icon">◎</div>
                    <h3>No customers found</h3>
                    <p>
                        ${
                            document.getElementById("customerSearch")?.value
                                ? "Try a different search term."
                                : "Create your first customer to start building your workspace."
                        }
                    </p>
                    <button class="customer-button primary" type="button" id="emptyAddCustomerButton">
                        + Add customer
                    </button>
                </div>
            `;

            document
                .getElementById("emptyAddCustomerButton")
                ?.addEventListener("click", () => openCustomerModal());

            return;
        }

        const rows = items.map((customer) => {
            const initials = getInitials(customer.name);
            const company = customer.company || "Individual account";

            return `
                <tr>
                    <td>
                        <div class="customer-identity">
                            <div class="customer-avatar">${escapeHtml(initials)}</div>
                            <div>
                                <div class="customer-name">${escapeHtml(customer.name)}</div>
                                <div class="customer-subtext">
                                    Customer #${customer.id}
                                </div>
                            </div>
                        </div>
                    </td>

                    <td>${escapeHtml(company)}</td>

                    <td>${escapeHtml(customer.email)}</td>

                    <td>
                        <span class="customer-status ${escapeHtml(customer.status)}">
                            ${escapeHtml(customer.status)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(customer.phone || "—")}
                    </td>

                    <td>
                        <div class="customer-actions">
                            <button
                                class="customer-action"
                                type="button"
                                title="View customer"
                                aria-label="View ${escapeHtml(customer.name)}"
                                data-customer-action="view"
                                data-customer-id="${customer.id}"
                            >
                                ↗
                            </button>

                            <button
                                class="customer-action"
                                type="button"
                                title="Edit customer"
                                aria-label="Edit ${escapeHtml(customer.name)}"
                                data-customer-action="edit"
                                data-customer-id="${customer.id}"
                            >
                                ✎
                            </button>

                            <button
                                class="customer-action"
                                type="button"
                                title="Delete customer"
                                aria-label="Delete ${escapeHtml(customer.name)}"
                                data-customer-action="delete"
                                data-customer-id="${customer.id}"
                            >
                                ×
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <table class="customer-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;

        container
            .querySelectorAll("[data-customer-action]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    const action = button.dataset.customerAction;
                    const id = Number(button.dataset.customerId);

                    if (action === "view") {
                        viewCustomer(id);
                    } else if (action === "edit") {
                        editCustomer(id);
                    } else if (action === "delete") {
                        deleteCustomer(id);
                    }
                });
            });
    }

    function updateCustomerKpi(total) {
        const cards = document.querySelectorAll(".kpi-card");

        cards.forEach((card) => {
            const text = card.textContent;

            if (!text.includes("Customers")) {
                return;
            }

            const value = card.querySelector(".kpi-value");

            if (value) {
                value.textContent = Number(total).toLocaleString();
            }
        });
    }

    /* ============================================================
       CUSTOMER MODAL
       ============================================================ */

    function ensureCustomerModal() {
        if (document.getElementById("customerModalBackdrop")) {
            return;
        }

        const modal = document.createElement("div");

        modal.className = "customer-modal-backdrop";
        modal.id = "customerModalBackdrop";
        modal.setAttribute("aria-hidden", "true");

        modal.innerHTML = `
            <div class="customer-modal" role="dialog" aria-modal="true">
                <div class="customer-modal-header">
                    <div>
                        <h2 id="customerModalTitle">Add customer</h2>
                        <p id="customerModalSubtitle">
                            Create a customer profile in OpsFlow.
                        </p>
                    </div>

                    <button
                        class="customer-close"
                        id="customerModalClose"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form class="customer-form" id="customerForm">
                    <div class="customer-form-error" id="customerFormError"></div>

                    <div class="customer-form-grid">
                        <div class="customer-field full">
                            <label for="customerName">Full name *</label>
                            <input
                                id="customerName"
                                name="name"
                                required
                                minlength="2"
                                maxlength="150"
                                placeholder="e.g. Acme Corporation"
                            >
                        </div>

                        <div class="customer-field">
                            <label for="customerEmail">Email *</label>
                            <input
                                id="customerEmail"
                                name="email"
                                type="email"
                                required
                                placeholder="contact@example.com"
                            >
                        </div>

                        <div class="customer-field">
                            <label for="customerPhone">Phone</label>
                            <input
                                id="customerPhone"
                                name="phone"
                                maxlength="50"
                                placeholder="+254 700 000 000"
                            >
                        </div>

                        <div class="customer-field">
                            <label for="customerCompany">Company</label>
                            <input
                                id="customerCompany"
                                name="company"
                                maxlength="150"
                                placeholder="Company or organization"
                            >
                        </div>

                        <div class="customer-field">
                            <label for="customerStatus">Status</label>
                            <select id="customerStatus" name="status">
                                <option value="active">Active</option>
                                <option value="prospect">Prospect</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div class="customer-field full">
                            <label for="customerNotes">Notes</label>
                            <textarea
                                id="customerNotes"
                                name="notes"
                                maxlength="5000"
                                placeholder="Optional account notes..."
                            ></textarea>
                        </div>
                    </div>

                    <div class="customer-form-footer">
                        <button
                            class="customer-button"
                            id="customerCancelButton"
                            type="button"
                        >
                            Cancel
                        </button>

                        <button
                            class="customer-button primary"
                            id="customerSubmitButton"
                            type="submit"
                        >
                            Create customer
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("customerModalClose")
            ?.addEventListener("click", closeCustomerModal);

        document
            .getElementById("customerCancelButton")
            ?.addEventListener("click", closeCustomerModal);

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeCustomerModal();
            }
        });

        document
            .getElementById("customerForm")
            ?.addEventListener("submit", submitCustomerForm);
    }

    function openCustomerModal(customer = null) {
        ensureCustomerModal();

        const modal = document.getElementById("customerModalBackdrop");
        const title = document.getElementById("customerModalTitle");
        const subtitle = document.getElementById("customerModalSubtitle");
        const submitButton = document.getElementById("customerSubmitButton");
        const error = document.getElementById("customerFormError");

        editingCustomerId = customer?.id || null;

        title.textContent = customer ? "Edit customer" : "Add customer";

        subtitle.textContent = customer
            ? "Update the customer profile and account information."
            : "Create a customer profile in OpsFlow.";

        submitButton.textContent = customer
            ? "Save changes"
            : "Create customer";

        error.classList.remove("visible");
        error.textContent = "";

        setFormValue("customerName", customer?.name || "");
        setFormValue("customerEmail", customer?.email || "");
        setFormValue("customerPhone", customer?.phone || "");
        setFormValue("customerCompany", customer?.company || "");
        setFormValue("customerStatus", customer?.status || "active");
        setFormValue("customerNotes", customer?.notes || "");

        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");

        window.setTimeout(() => {
            document.getElementById("customerName")?.focus();
        }, 80);
    }

    function closeCustomerModal() {
        const modal = document.getElementById("customerModalBackdrop");

        if (!modal) {
            return;
        }

        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        editingCustomerId = null;
    }

    function setFormValue(id, value) {
        const field = document.getElementById(id);

        if (field) {
            field.value = value;
        }
    }

    async function submitCustomerForm(event) {
        event.preventDefault();

        const submitButton = document.getElementById("customerSubmitButton");
        const error = document.getElementById("customerFormError");

        const payload = {
            name: document.getElementById("customerName").value.trim(),
            email: document.getElementById("customerEmail").value.trim(),
            phone: document.getElementById("customerPhone").value.trim() || null,
            company:
                document.getElementById("customerCompany").value.trim() || null,
            status: document.getElementById("customerStatus").value,
            notes: document.getElementById("customerNotes").value.trim() || null,
        };

        error.classList.remove("visible");
        error.textContent = "";

        submitButton.disabled = true;
        submitButton.textContent = editingCustomerId
            ? "Saving..."
            : "Creating...";

        try {
            const endpoint = editingCustomerId
                ? `/api/v1/customers/${editingCustomerId}`
                : "/api/v1/customers";

            const method = editingCustomerId ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(getApiErrorMessage(data, response.status));
            }

            const wasEditing = Boolean(editingCustomerId);

            closeCustomerModal();
            await loadCustomers();

            showToast(
                wasEditing ? "Customer updated" : "Customer created",
                wasEditing
                    ? `${payload.name}'s profile was updated successfully.`
                    : `${payload.name} was added to your customer workspace.`
            );
        } catch (requestError) {
            console.error("Customer save failed:", requestError);

            error.textContent = requestError.message;
            error.classList.add("visible");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = editingCustomerId
                ? "Save changes"
                : "Create customer";
        }
    }

    /* ============================================================
       CUSTOMER DETAILS
       ============================================================ */

    function viewCustomer(customerId) {
        const customer = customers.find(
            (item) => Number(item.id) === Number(customerId)
        );

        if (!customer) {
            showToast("Customer unavailable", "The customer could not be found.");
            return;
        }

        ensureCustomerDetailModal(customer);
    }

    function ensureCustomerDetailModal(customer) {
        const existing = document.getElementById("customerDetailBackdrop");

        if (existing) {
            existing.remove();
        }

        const modal = document.createElement("div");

        modal.className = "customer-modal-backdrop open";
        modal.id = "customerDetailBackdrop";

        modal.innerHTML = `
            <div class="customer-modal" role="dialog" aria-modal="true">
                <div class="customer-modal-header">
                    <div>
                        <h2>Customer profile</h2>
                        <p>Account details and relationship information.</p>
                    </div>

                    <button
                        class="customer-close"
                        type="button"
                        id="customerDetailClose"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div class="customer-detail">
                    <div class="customer-detail-hero">
                        <div class="customer-detail-avatar">
                            ${escapeHtml(getInitials(customer.name))}
                        </div>

                        <div>
                            <h3>${escapeHtml(customer.name)}</h3>
                            <p>${escapeHtml(customer.company || "Individual account")}</p>
                        </div>
                    </div>

                    <div class="customer-detail-grid">
                        <div class="customer-detail-item">
                            <small>Email</small>
                            <strong>${escapeHtml(customer.email)}</strong>
                        </div>

                        <div class="customer-detail-item">
                            <small>Phone</small>
                            <strong>${escapeHtml(customer.phone || "Not provided")}</strong>
                        </div>

                        <div class="customer-detail-item">
                            <small>Status</small>
                            <strong>${escapeHtml(customer.status)}</strong>
                        </div>

                        <div class="customer-detail-item">
                            <small>Customer ID</small>
                            <strong>#${customer.id}</strong>
                        </div>

                        <div class="customer-detail-item">
                            <small>Created</small>
                            <strong>${formatDate(customer.created_at)}</strong>
                        </div>

                        <div class="customer-detail-item">
                            <small>Updated</small>
                            <strong>${formatDate(customer.updated_at)}</strong>
                        </div>

                        <div class="customer-detail-item" style="grid-column: 1 / -1;">
                            <small>Notes</small>
                            <strong>${escapeHtml(customer.notes || "No notes added.")}</strong>
                        </div>
                    </div>

                    <div class="customer-form-footer">
                        <button
                            class="customer-button"
                            id="customerDetailEdit"
                            type="button"
                        >
                            Edit customer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("customerDetailClose")
            ?.addEventListener("click", () => modal.remove());

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });

        document
            .getElementById("customerDetailEdit")
            ?.addEventListener("click", () => {
                modal.remove();
                openCustomerModal(customer);
            });
    }

    function editCustomer(customerId) {
        const customer = customers.find(
            (item) => Number(item.id) === Number(customerId)
        );

        if (!customer) {
            showToast("Customer unavailable", "The customer could not be found.");
            return;
        }

        openCustomerModal(customer);
    }

    /* ============================================================
       CUSTOMER DELETE
       ============================================================ */

    async function deleteCustomer(customerId) {
        const customer = customers.find(
            (item) => Number(item.id) === Number(customerId)
        );

        if (!customer) {
            showToast("Customer unavailable", "The customer could not be found.");
            return;
        }

        const confirmed = window.confirm(
            `Delete ${customer.name}? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `/api/v1/customers/${customer.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                throw new Error(
                    getApiErrorMessage(data, response.status)
                );
            }

            await loadCustomers();

            showToast(
                "Customer deleted",
                `${customer.name} was removed from the customer workspace.`
            );
        } catch (error) {
            console.error("Customer deletion failed:", error);

            showToast(
                "Delete failed",
                error.message || "The customer could not be deleted."
            );
        }
    }

    /* ============================================================
       CUSTOMER HELPERS
       ============================================================ */

    function getInitials(name) {
        const parts = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "?";
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    }

    function getApiErrorMessage(data, statusCode) {
        if (data?.detail) {
            if (Array.isArray(data.detail)) {
                return data.detail
                    .map((item) => item.msg || "Validation error")
                    .join(" ");
            }

            return String(data.detail);
        }

        return `Request failed with HTTP ${statusCode}.`;
    }

    /* ============================================================
       KEYBOARD ACCESS
       ============================================================ */

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        const customerModal = document.getElementById(
            "customerModalBackdrop"
        );

        if (customerModal?.classList.contains("open")) {
            closeCustomerModal();
        }

        const detailModal = document.getElementById(
            "customerDetailBackdrop"
        );

        detailModal?.remove();
    });

    verifyBackend();
});