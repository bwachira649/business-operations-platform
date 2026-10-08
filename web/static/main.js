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

    const currentDashboardDate =
        document.getElementById("currentDashboardDate");

    if (currentDashboardDate) {
        currentDashboardDate.textContent = new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            },
        ).format(new Date());
    }

    function escapeHtml(value) {
        const element = document.createElement("div");
        element.textContent = value ?? "";
        return element.innerHTML;
    }

    function showToast(title, message) {
        if (!toast || !toastTitle || !toastMessage) {
            return;
        }

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        toast.classList.add("visible");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("visible");
        }, 3000);
    }
    /* ============================================================`r`n       CUSTOMER MODULE STYLES
       ============================================================ */

    function installCustomerStyles() {
        if (document.getElementById("customerModuleStyles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "customerModuleStyles";
        style.textContent = `
            #customersView {
                display: none;
            }

            #customersView.visible {
                display: block;
            }

            #customersView .workspace-header {
                margin-bottom: 24px;
            }

            #customersView .workspace-header,
            #customersView .workspace-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
            }

            #customersView .workspace-actions {
                justify-content: flex-end;
            }

            #customersView .workspace-title h1 {
                margin: 0;
            }

            #customersView .workspace-title p {
                margin: 7px 0 0;
                color: var(--text-muted);
                font-size: 13px;
            }

            #customersView .customer-toolbar {
                display: flex;
                align-items: center;
                gap: 9px;
                margin-bottom: 16px;
            }

            #customersView .customer-search,
            #customersView .customer-filter {
                height: 38px;
                padding: 0 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--surface-soft);
                color: var(--text);
                font-size: 12px;
            }

            #customersView .customer-search {
                flex: 1;
                min-width: 220px;
            }

            #customersView .customer-search:focus,
            #customersView .customer-filter:focus {
                border-color: rgba(99, 91, 255, .45);
                box-shadow: 0 0 0 3px rgba(99, 91, 255, .08);
                outline: 0;
            }

            #customersView .customer-table-wrap {
                overflow-x: auto;
            }

            #customersView .customer-table {
                width: 100%;
                min-width: 760px;
                border-collapse: collapse;
            }

            #customersView .customer-table th {
                padding: 12px 16px;
                border-bottom: 1px solid var(--border);
                background: var(--surface-soft);
                color: var(--text-muted);
                font-size: 9px;
                font-weight: 800;
                letter-spacing: .08em;
                text-align: left;
                text-transform: uppercase;
            }

            #customersView .customer-table td {
                padding: 15px 16px;
                border-bottom: 1px solid var(--border);
                color: var(--text-secondary);
                font-size: 12px;
            }

            #customersView .customer-table tbody tr:hover {
                background: var(--surface-soft);
            }

            #customersView .customer-primary {
                color: var(--text);
                font-weight: 750;
            }

            #customersView .customer-secondary {
                margin-top: 4px;
                color: var(--text-muted);
                font-size: 11px;
            }

            #customersView .customer-actions {
                display: flex;
                gap: 8px;
            }

            #customersView .customer-action {
                border: 0;
                background: transparent;
                color: var(--accent);
                cursor: pointer;
                font: inherit;
                font-weight: 650;
            }

            #customersView .customer-action.danger {
                color: #c0392b;
            }

            #customersView .customer-empty {
                padding: 42px 20px;
                text-align: center;
                color: var(--text-muted);
            }

            .customer-modal {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: grid;
                place-items: center;
                padding: 20px;
                background: rgba(15, 23, 42, .45);
            }

            .customer-modal-card {
                width: min(620px, 100%);
                max-height: 90vh;
                overflow-y: auto;
                padding: 26px;
                border-radius: 18px;
                background: var(--surface);
                box-shadow: 0 24px 70px rgba(15, 23, 42, .2);
            }

            .customer-modal-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 22px;
            }

            .customer-modal-close {
                border: 0;
                background: transparent;
                color: var(--text);
                cursor: pointer;
                font-size: 28px;
                line-height: 1;
            }

            .customer-form-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 15px;
            }

            .customer-field {
                display: grid;
                gap: 7px;
            }

            .customer-field.full {
                grid-column: 1 / -1;
            }

            .customer-field label {
                color: var(--text-secondary);
                font-size: 11px;
                font-weight: 700;
            }

            .customer-field input,
            .customer-field select,
            .customer-field textarea {
                width: 100%;
                min-height: 40px;
                padding: 9px 11px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--surface-soft);
                color: var(--text);
                font-size: 12px;
            }

            .customer-field textarea {
                min-height: 100px;
                resize: vertical;
            }

            .customer-modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }

            @media (max-width: 700px) {
                #customersView .workspace-header {
                    align-items: flex-start;
                    flex-direction: column;
                }

                #customersView .customer-toolbar {
                    align-items: stretch;
                    flex-direction: column;
                }

                #customersView .customer-search {
                    width: 100%;
                    min-width: 0;
                }

                .customer-form-grid {
                    grid-template-columns: 1fr;
                }

                .customer-field.full {
                    grid-column: auto;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ============================================================
       CUSTOMER MODULE
       ============================================================ */

    function createCustomersView() {
        if (document.getElementById("customersView")) {
            return document.getElementById("customersView");
        }

        installCustomerStyles();

        const container = document.createElement("section");
        container.id = "customersView";
        container.className = "workspace-view";

        const dashboard = document.getElementById("dashboard");

        if (dashboard) {
            dashboard.insertAdjacentElement("afterend", container);
        }

        container.innerHTML = `
            <div class="workspace-header">
                <div class="workspace-title">
                    <span class="eyebrow">Relationship management</span>
                    <h1>Customers</h1>
                    <p>Manage customer profiles and account relationships.</p>
                </div>

                <div class="workspace-actions">
                    <button class="button button-primary" id="newCustomerButton">
                        + New customer
                    </button>
                </div>
            </div>

            <section class="panel">
                <div class="customer-toolbar">
                    <input
                        class="customer-search"
                        id="customerSearch"
                        type="search"
                        placeholder="Search customers..."
                        autocomplete="off"
                    />

                    <select class="customer-filter" id="customerStatusFilter">
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="prospect">Prospect</option>
                    </select>
                </div>

                <div class="customer-table-wrap">
                    <table class="customer-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Company</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="customersTableBody"></tbody>
                    </table>
                </div>
            </section>
        `;

        document
            .getElementById("newCustomerButton")
            ?.addEventListener("click", () => {
                openCustomerModal();
            });

        document
            .getElementById("customerSearch")
            ?.addEventListener("input", () => {
                window.clearTimeout(customerSearchTimer);

                customerSearchTimer = window.setTimeout(() => {
                    loadCustomers();
                }, 250);
            });

        document
            .getElementById("customerStatusFilter")
            ?.addEventListener("change", loadCustomers);

        container.addEventListener("click", (event) => {
            const button = event.target.closest("[data-customer-action]");

            if (!button) {
                return;
            }

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

        return container;
    }

    async function loadCustomers() {
        const container = createCustomersView();
        const tableBody = container.querySelector("#customersTableBody");

        if (!tableBody) {
            return;
        }

        const search = container.querySelector("#customerSearch")?.value.trim();
        const status = container.querySelector("#customerStatusFilter")?.value;

        const params = new URLSearchParams({
            limit: "100",
            offset: "0",
        });

        if (search) {
            params.set("search", search);
        }

        if (status) {
            params.set("status", status);
        }

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="customer-empty">Loading customers...</td>
            </tr>
        `;

        try {
            const response = await fetch(`/api/v1/customers?${params}`, {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Customer request failed: ${response.status}`);
            }

            const data = await response.json();
            customers = data.items || [];

            renderCustomers(customers);
            updateCustomerKpi(data.total);
        } catch (error) {
            console.error("Failed to load customers:", error);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="customer-empty">
                        Unable to load customers.
                    </td>
                </tr>
            `;
        }
    }

    function renderCustomers(items) {
        const tableBody = document.getElementById("customersTableBody");

        if (!tableBody) {
            return;
        }

        if (!items.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="customer-empty">
                        No customers match the current filters.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = items
            .map((customer) => {
                const initials = customer.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                return `
                    <tr>
                        <td>
                            <div class="customer-primary">${escapeHtml(customer.name)}</div>
                            <div class="customer-secondary">${escapeHtml(customer.email)}</div>
                        </td>
                        <td>${escapeHtml(customer.company || "")}</td>
                        <td>${escapeHtml(customer.phone || "")}</td>
                        <td>
                            <span class="status-badge status-${escapeHtml(customer.status)}">
                                ${escapeHtml(customer.status)}
                            </span>
                        </td>
                        <td>
                            <div class="customer-actions">
                                <button
                                    class="customer-action"
                                    data-customer-action="view"
                                    data-customer-id="${customer.id}"
                                >View</button>

                                <button
                                    class="customer-action"
                                    data-customer-action="edit"
                                    data-customer-id="${customer.id}"
                                >Edit</button>

                                <button
                                    class="customer-action danger"
                                    data-customer-action="delete"
                                    data-customer-id="${customer.id}"
                                >Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    function openCustomerModal(customer = null) {
        closeCustomerModal();

        editingCustomerId = customer?.id ?? null;

        const modal = document.createElement("div");
        modal.className = "customer-modal";
        modal.id = "customerModal";

        modal.innerHTML = `
            <div class="customer-modal-card" role="dialog" aria-modal="true">
                <div class="customer-modal-header">
                    <div>
                        <span class="eyebrow">${customer ? "Customer profile" : "New customer"}</span>
                        <h2>${customer ? "Edit customer" : "Create customer"}</h2>
                    </div>

                    <button class="customer-modal-close" type="button" aria-label="Close">
                        
                    </button>
                </div>

                <form id="customerForm">
                    <div class="customer-form-grid">
                        <div class="customer-field">
                            <label for="customerName">Name</label>
                            <input id="customerName" name="name" required maxlength="150"
                                value="${escapeHtml(customer?.name || "")}">
                        </div>

                        <div class="customer-field">
                            <label for="customerEmail">Email</label>
                            <input id="customerEmail" name="email" type="email" required
                                maxlength="254" value="${escapeHtml(customer?.email || "")}">
                        </div>

                        <div class="customer-field">
                            <label for="customerPhone">Phone</label>
                            <input id="customerPhone" name="phone" maxlength="50"
                                value="${escapeHtml(customer?.phone || "")}">
                        </div>

                        <div class="customer-field">
                            <label for="customerCompany">Company</label>
                            <input id="customerCompany" name="company" maxlength="150"
                                value="${escapeHtml(customer?.company || "")}">
                        </div>

                        <div class="customer-field">
                            <label for="customerStatus">Status</label>
                            <select id="customerStatus" name="status">
                                <option value="active" ${customer?.status === "active" ? "selected" : ""}>Active</option>
                                <option value="inactive" ${customer?.status === "inactive" ? "selected" : ""}>Inactive</option>
                                <option value="prospect" ${customer?.status === "prospect" ? "selected" : ""}>Prospect</option>
                            </select>
                        </div>

                        <div class="customer-field full">
                            <label for="customerNotes">Notes</label>
                            <textarea id="customerNotes" name="notes">${escapeHtml(customer?.notes || "")}</textarea>
                        </div>
                    </div>

                    <div class="customer-modal-actions">
                        <button class="button button-secondary" type="button" id="customerCancel">
                            Cancel
                        </button>
                        <button class="button button-primary" type="submit">
                            ${customer ? "Save changes" : "Create customer"}
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal
            .querySelector(".customer-modal-close")
            ?.addEventListener("click", closeCustomerModal);

        modal
            .querySelector("#customerCancel")
            ?.addEventListener("click", closeCustomerModal);

        modal
            .querySelector("#customerForm")
            ?.addEventListener("submit", saveCustomer);

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeCustomerModal();
            }
        });

        modal.querySelector("#customerName")?.focus();
    }

    function closeCustomerModal() {
        document.getElementById("customerModal")?.remove();
        editingCustomerId = null;
    }

    async function saveCustomer(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone") || null,
            company: formData.get("company") || null,
            status: formData.get("status"),
            notes: formData.get("notes") || null,
        };

        const wasEditing = Boolean(editingCustomerId);
        const url = wasEditing
            ? `/api/v1/customers/${editingCustomerId}`
            : "/api/v1/customers";

        try {
            const response = await fetch(url, {
                method: wasEditing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || `Customer request failed: ${response.status}`,
                );
            }

            closeCustomerModal();
            await loadCustomers();

            showToast(
                "Customers",
                wasEditing ? "Customer updated." : "Customer created.",
            );
        } catch (error) {
            console.error("Failed to save customer:", error);
            showToast("Customer error", error.message);
        }
    }

    function viewCustomer(id) {
        const customer = customers.find((item) => item.id === id);

        if (!customer) {
            return;
        }

        openCustomerModal(customer);
    }

    function editCustomer(id) {
        const customer = customers.find((item) => item.id === id);

        if (!customer) {
            return;
        }

        openCustomerModal(customer);
    }

    async function deleteCustomer(id) {
        const customer = customers.find((item) => item.id === id);

        if (!customer) {
            return;
        }

        if (
            !window.confirm(
                `Delete customer "${customer.name}"? This cannot be undone.`,
            )
        ) {
            return;
        }

        try {
            const response = await fetch(`/api/v1/customers/${id}`, {
                method: "DELETE",
            });

            const data =
                response.status === 204 ? null : await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                        `Customer deletion failed: ${response.status}`,
                );
            }

            await loadCustomers();

            showToast("Customers", "Customer deleted.");
        } catch (error) {
            console.error("Failed to delete customer:", error);
            showToast("Customer error", error.message);
        }
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
       INTEGRATIONS & SETTINGS WORKSPACES
       ============================================================ */

    function installUtilityViewStyles() {
        if (document.getElementById("utilityViewStyles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "utilityViewStyles";
        style.textContent = `
            .utility-view {
                display: none;
            }

            .utility-view.visible {
                display: block;
            }

            .utility-hero {
                margin-bottom: 24px;
            }

            .utility-hero h1 {
                margin: 0;
            }

            .utility-hero p {
                margin: 7px 0 0;
                color: var(--text-muted);
                font-size: 13px;
                max-width: 720px;
            }

            .utility-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
            }

            .utility-card {
                padding: 22px;
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                background: var(--surface);
                box-shadow: var(--shadow-sm);
            }

            .utility-card-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 16px;
            }

            .utility-card-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .utility-card-icon {
                width: 38px;
                height: 38px;
                display: grid;
                place-items: center;
                border-radius: 10px;
                background: var(--accent-soft);
                color: var(--accent);
                font-weight: 700;
            }

            .utility-card h2 {
                margin: 0;
                font-size: 15px;
            }

            .utility-card p {
                margin: 5px 0 0;
                color: var(--text-secondary);
                font-size: 12px;
                line-height: 1.55;
            }

            .utility-status {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 5px 9px;
                border-radius: 999px;
                background: var(--surface-soft);
                color: var(--text-secondary);
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            }

            .utility-status::before {
                content: "";
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--text-muted);
            }

            .utility-detail {
                margin-top: 18px;
                padding-top: 16px;
                border-top: 1px solid var(--border);
            }

            .utility-label {
                display: block;
                margin-bottom: 7px;
                color: var(--text-secondary);
                font-size: 11px;
                font-weight: 600;
            }

            .utility-code {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .utility-code code {
                flex: 1;
                min-width: 0;
                padding: 10px 12px;
                overflow: hidden;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--surface-soft);
                color: var(--text);
                font-size: 11px;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .utility-note {
                padding: 14px 16px;
                border: 1px solid var(--border);
                border-radius: 10px;
                background: var(--surface-soft);
                color: var(--text-secondary);
                font-size: 12px;
                line-height: 1.55;
            }

            .settings-layout {
                display: grid;
                grid-template-columns: 190px minmax(0, 1fr);
                gap: 20px;
            }

            .settings-nav {
                align-self: start;
                display: grid;
                gap: 4px;
                padding: 8px;
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                background: var(--surface);
            }

            .settings-nav button {
                padding: 10px 12px;
                border: 0;
                border-radius: 8px;
                background: transparent;
                color: var(--text-secondary);
                cursor: pointer;
                text-align: left;
                font: inherit;
                font-size: 12px;
            }

            .settings-nav button.active {
                background: var(--accent-soft);
                color: var(--accent);
                font-weight: 600;
            }

            .settings-section {
                display: none;
            }

            .settings-section.active {
                display: block;
            }

            .settings-section + .settings-section {
                margin-top: 16px;
            }

            .settings-heading {
                margin-bottom: 18px;
            }

            .settings-heading h2 {
                margin: 0;
                font-size: 17px;
            }

            .settings-heading p {
                margin: 6px 0 0;
                color: var(--text-muted);
                font-size: 12px;
            }

            .settings-field {
                margin-bottom: 16px;
            }

            .settings-field:last-child {
                margin-bottom: 0;
            }

            .settings-field label {
                display: block;
                margin-bottom: 7px;
                color: var(--text-secondary);
                font-size: 11px;
                font-weight: 600;
            }

            .settings-field input,
            .settings-field select {
                width: 100%;
                height: 40px;
                padding: 0 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--surface);
                color: var(--text);
                font: inherit;
                font-size: 12px;
                outline: 0;
            }

            .settings-field input:focus,
            .settings-field select:focus {
                border-color: rgba(99, 91, 255, .45);
                box-shadow: 0 0 0 3px rgba(99, 91, 255, .08);
            }

            .settings-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                padding: 15px 0;
                border-bottom: 1px solid var(--border);
            }

            .settings-row:first-child {
                padding-top: 0;
            }

            .settings-row:last-child {
                padding-bottom: 0;
                border-bottom: 0;
            }

            .settings-row strong {
                display: block;
                margin-bottom: 4px;
                color: var(--text);
                font-size: 12px;
            }

            .settings-row span {
                color: var(--text-muted);
                font-size: 11px;
                line-height: 1.45;
            }

            .settings-toggle {
                position: relative;
                width: 42px;
                height: 24px;
                flex: 0 0 auto;
                border: 0;
                border-radius: 999px;
                background: var(--border-strong);
                cursor: pointer;
            }

            .settings-toggle::after {
                content: "";
                position: absolute;
                top: 3px;
                left: 3px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--surface);
                box-shadow: var(--shadow-sm);
                transition: transform .18s ease;
            }

            .settings-toggle.active {
                background: var(--accent);
            }

            .settings-toggle.active::after {
                transform: translateX(18px);
            }

            .settings-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }

            @media (max-width: 850px) {
                .utility-grid,
                .settings-layout {
                    grid-template-columns: 1fr;
                }

                .settings-nav {
                    display: flex;
                    overflow-x: auto;
                }

                .settings-nav button {
                    white-space: nowrap;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createUtilityViews() {
        if (
            document.getElementById("integrationsView") &&
            document.getElementById("settingsView")
        ) {
            return;
        }

        installUtilityViewStyles();

        const dashboard = document.getElementById("dashboard");

        if (!dashboard) {
            return;
        }

        if (!document.getElementById("integrationsView")) {
            const integrations = document.createElement("section");
            integrations.id = "integrationsView";
            integrations.className = "utility-view workspace-view";
            integrations.innerHTML = `
                <div class="utility-hero">
                    <span class="eyebrow">Connected services</span>
                    <h1>Integrations</h1>
                    <p>
                        Manage the services and automation endpoints that can
                        extend OpsFlow. Connections are configured explicitly;
                        nothing is presented as connected until it actually is.
                    </p>
                </div>

                <div class="utility-grid">
                    <article class="utility-card">
                        <div class="utility-card-header">
                            <div class="utility-card-title">
                                <div class="utility-card-icon">API</div>
                                <div>
                                    <h2>OpsFlow API</h2>
                                    <p>Programmatic access to workspace data.</p>
                                </div>
                            </div>
                            <span class="utility-status">Available</span>
                        </div>
                        <div class="utility-detail">
                            <span class="utility-label">Base endpoint</span>
                            <div class="utility-code">
                                <code id="integrationApiEndpoint"></code>
                                <button class="button button-secondary"
                                    type="button" data-copy-api>
                                    Copy
                                </button>
                            </div>
                        </div>
                    </article>

                    <article class="utility-card">
                        <div class="utility-card-header">
                            <div class="utility-card-title">
                                <div class="utility-card-icon"></div>
                                <div>
                                    <h2>Webhooks</h2>
                                    <p>Send workspace events to external systems.</p>
                                </div>
                            </div>
                            <span class="utility-status">Not connected</span>
                        </div>
                        <div class="utility-detail">
                            <div class="utility-note">
                                No webhook destination is configured. Add a
                                destination when an external automation workflow
                                is ready to consume OpsFlow events.
                            </div>
                        </div>
                    </article>

                    <article class="utility-card">
                        <div class="utility-card-header">
                            <div class="utility-card-title">
                                <div class="utility-card-icon"></div>
                                <div>
                                    <h2>Email</h2>
                                    <p>Operational notifications and reports.</p>
                                </div>
                            </div>
                            <span class="utility-status">Not connected</span>
                        </div>
                        <div class="utility-detail">
                            <div class="utility-note">
                                Email delivery is not configured in this
                                environment. No messages will be sent externally.
                            </div>
                        </div>
                    </article>

                    <article class="utility-card">
                        <div class="utility-card-header">
                            <div class="utility-card-title">
                                <div class="utility-card-icon"></div>
                                <div>
                                    <h2>Messaging</h2>
                                    <p>Prepare alerts for supported messaging channels.</p>
                                </div>
                            </div>
                            <span class="utility-status">Not connected</span>
                        </div>
                        <div class="utility-detail">
                            <div class="utility-note">
                                No messaging provider is connected. This workspace
                                does not claim an active WhatsApp, SMS, or social
                                messaging connection.
                            </div>
                        </div>
                    </article>
                </div>
            `;

            dashboard.insertAdjacentElement("afterend", integrations);
        }

        if (!document.getElementById("settingsView")) {
            const settings = document.createElement("section");
            settings.id = "settingsView";
            settings.className = "utility-view workspace-view";
            settings.innerHTML = `
                <div class="utility-hero">
                    <span class="eyebrow">Workspace configuration</span>
                    <h1>Settings</h1>
                    <p>
                        Configure local OpsFlow preferences and workspace details.
                        Changes here affect this browser environment only.
                    </p>
                </div>

                <div class="settings-layout">
                    <nav class="settings-nav" aria-label="Settings sections">
                        <button type="button" class="active" data-settings-tab="workspace">
                            Workspace
                        </button>
                        <button type="button" data-settings-tab="profile">
                            Profile
                        </button>
                        <button type="button" data-settings-tab="notifications">
                            Notifications
                        </button>
                        <button type="button" data-settings-tab="preferences">
                            Preferences
                        </button>
                    </nav>

                    <div>
                        <section class="panel settings-section active" data-settings-section="workspace">
                            <div class="settings-heading">
                                <h2>Workspace</h2>
                                <p>Basic information displayed across the application.</p>
                            </div>

                            <div class="settings-field">
                                <label for="workspaceName">Workspace name</label>
                                <input id="workspaceName" value="OpsFlow  Business OS" />
                            </div>

                            <div class="settings-field">
                                <label for="workspaceTimezone">Timezone</label>
                                <select id="workspaceTimezone">
                                    <option>Africa/Nairobi</option>
                                    <option>UTC</option>
                                    <option>Europe/London</option>
                                    <option>America/New_York</option>
                                </select>
                            </div>

                            <div class="settings-actions">
                                <button class="button button-primary" type="button" data-save-workspace>
                                    Save changes
                                </button>
                            </div>
                        </section>

                        <section class="panel settings-section" data-settings-section="profile">
                            <div class="settings-heading">
                                <h2>Profile</h2>
                                <p>Administrator profile used by this workspace.</p>
                            </div>

                            <div class="settings-field">
                                <label for="profileName">Name</label>
                                <input id="profileName" value="Brian Wachira" />
                            </div>

                            <div class="settings-field">
                                <label for="profileRole">Role</label>
                                <input id="profileRole" value="Administrator" />
                            </div>

                            <div class="settings-note utility-note">
                                Authentication and account management are not
                                configured as an external identity service in this
                                local portfolio environment.
                            </div>

                            <div class="settings-actions">
                                <button class="button button-primary" type="button" data-save-profile>
                                    Save profile
                                </button>
                            </div>
                        </section>

                        <section class="panel settings-section" data-settings-section="notifications">
                            <div class="settings-heading">
                                <h2>Notifications</h2>
                                <p>Control local workspace notification preferences.</p>
                            </div>

                            <div class="settings-row">
                                <div>
                                    <strong>Task reminders</strong>
                                    <span>Show reminders for outstanding operational tasks.</span>
                                </div>
                                <button class="settings-toggle active" type="button"
                                    data-setting-toggle="taskReminders"
                                    aria-label="Toggle task reminders"></button>
                            </div>

                            <div class="settings-row">
                                <div>
                                    <strong>Report updates</strong>
                                    <span>Show local notifications when reports are refreshed.</span>
                                </div>
                                <button class="settings-toggle active" type="button"
                                    data-setting-toggle="reportUpdates"
                                    aria-label="Toggle report updates"></button>
                            </div>
                        </section>

                        <section class="panel settings-section" data-settings-section="preferences">
                            <div class="settings-heading">
                                <h2>Preferences</h2>
                                <p>Adjust how OpsFlow behaves in this browser.</p>
                            </div>

                            <div class="settings-row">
                                <div>
                                    <strong>Live workspace updates</strong>
                                    <span>Allow dashboard modules to refresh data when opened.</span>
                                </div>
                                <button class="settings-toggle active" type="button"
                                    data-setting-toggle="liveUpdates"
                                    aria-label="Toggle live workspace updates"></button>
                            </div>

                            <div class="settings-row">
                                <div>
                                    <strong>Compact navigation</strong>
                                    <span>Keep the standard navigation layout for this workspace.</span>
                                </div>
                                <button class="settings-toggle" type="button"
                                    data-setting-toggle="compactNavigation"
                                    aria-label="Toggle compact navigation"></button>
                            </div>
                        </section>
                    </div>
                </div>
            `;

            const integrationsView = document.getElementById("integrationsView");
            integrationsView.insertAdjacentElement("afterend", settings);
        }

        const apiEndpoint = document.getElementById("integrationApiEndpoint");

        if (apiEndpoint) {
            apiEndpoint.textContent =
                `${window.location.origin}/api/v1`;
        }

        document.querySelectorAll("[data-copy-api]").forEach((button) => {
            button.addEventListener("click", async () => {
                const value = apiEndpoint?.textContent || "";

                try {
                    await navigator.clipboard.writeText(value);
                    showToast("Copied", "API endpoint copied to clipboard.");
                } catch (error) {
                    console.error("Failed to copy API endpoint:", error);
                    showToast("Copy unavailable", value);
                }
            });
        });

        document.querySelectorAll("[data-settings-tab]").forEach((button) => {
            button.addEventListener("click", () => {
                const tab = button.dataset.settingsTab;

                document.querySelectorAll("[data-settings-tab]").forEach((item) => {
                    item.classList.toggle("active", item === button);
                });

                document.querySelectorAll("[data-settings-section]").forEach((section) => {
                    section.classList.toggle(
                        "active",
                        section.dataset.settingsSection === tab,
                    );
                });
            });
        });

        document.querySelectorAll("[data-setting-toggle]").forEach((button) => {
            const key = `opsflow.setting.${button.dataset.settingToggle}`;
            const saved = localStorage.getItem(key);

            if (saved !== null) {
                button.classList.toggle("active", saved === "true");
            }

            button.addEventListener("click", () => {
                const active = !button.classList.contains("active");

                button.classList.toggle("active", active);
                localStorage.setItem(key, String(active));
            });
        });

        document
            .querySelector("[data-save-workspace]")
            ?.addEventListener("click", () => {
                const name = document.getElementById("workspaceName")?.value.trim();

                if (name) {
                    localStorage.setItem("opsflow.workspace.name", name);
                    showToast("Workspace saved", "Workspace preferences updated locally.");
                }
            });

        document
            .querySelector("[data-save-profile]")
            ?.addEventListener("click", () => {
                const name = document.getElementById("profileName")?.value.trim();

                if (name) {
                    localStorage.setItem("opsflow.profile.name", name);
                    showToast("Profile saved", "Profile preferences updated locally.");
                }
            });

        const savedWorkspaceName = localStorage.getItem("opsflow.workspace.name");
        const savedProfileName = localStorage.getItem("opsflow.profile.name");

        if (savedWorkspaceName) {
            const field = document.getElementById("workspaceName");
            if (field) {
                field.value = savedWorkspaceName;
            }
        }

        if (savedProfileName) {
            const field = document.getElementById("profileName");
            if (field) {
                field.value = savedProfileName;
            }
        }
    }
    /* ============================================================
       VIEW MANAGEMENT
       ============================================================ */

    async function verifyBackend() {
        try {
            const response = await fetch("/health", {
                headers: {
                    Accept: "application/json",
                },
            });

            const data = await response.json();

            const statusText = document.querySelector(
                ".system-status span:last-child",
            );

            if (statusText && data.status === "healthy") {
                statusText.textContent = "All systems operational";
            }
        } catch (error) {
            console.error("Backend health check failed:", error);

            const statusText = document.querySelector(
                ".system-status span:last-child",
            );

            if (statusText) {
                statusText.textContent = "API connection unavailable";
            }
        }
    }

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

        createCustomersView();
        createUtilityViews();

        const views = {
            overview: document.getElementById("dashboard"),
            customers: document.getElementById("customersView"),
            orders: document.getElementById("ordersView"),
            inventory: document.getElementById("inventoryView"),
            analytics: document.getElementById("analyticsView"),
            tasks: document.getElementById("tasksView"),
            reports: document.getElementById("reportsView"),
            integrations: document.getElementById("integrationsView"),
            settings: document.getElementById("settingsView"),
        };

        Object.entries(views).forEach(([name, element]) => {
            if (!element) {
                return;
            }

            if (name === "overview") {
                element.style.display = view === "overview" ? "" : "none";
            } else {
                element.classList.toggle("visible", view === name);
                element.style.display = view === name ? "" : "none";
            }
        });

        if (view === "customers") {
            loadCustomers();
        } else if (view === "inventory") {
            if (typeof window.loadInventory === "function") {
                window.loadInventory();
            }
        } else if (view === "orders") {
            if (typeof window.loadOrders === "function") {
                window.loadOrders();
            }
        } else if (view === "analytics") {
            if (typeof window.loadAnalytics === "function") {
                window.loadAnalytics();
            }
        } else if (view === "tasks") {
            if (typeof window.loadTasks === "function") {
                window.loadTasks();
            }
        } else if (view === "reports") {
            if (typeof window.loadReports === "function") {
                window.loadReports();
            }
        }

        if (window.innerWidth <= 760) {
            sidebar?.classList.remove("open");
        }
    }
    window.setActiveView = setActiveView;
    window.openCustomerModal = openCustomerModal;

    /* ============================================================
       NAVIGATION
       ============================================================ */

    document.querySelectorAll("[data-view]").forEach((item) => {
        item.addEventListener("click", () => {
            setActiveView(item.dataset.view);
        });
    });

    mobileMenu?.addEventListener("click", () => {
        sidebar?.classList.toggle("open");
    });

    /* ============================================================
       COMMAND PALETTE
       ============================================================ */

    function openCommandPalette() {
        commandOverlay?.classList.add("open");
        commandOverlay?.setAttribute("aria-hidden", "false");

        window.setTimeout(() => {
            commandInput?.focus();
        }, 80);
    }

    function closeCommandPalette() {
        commandOverlay?.classList.remove("open");
        commandOverlay?.setAttribute("aria-hidden", "true");

        if (commandInput) {
            commandInput.value = "";
        }

        filterCommands("");
    }

    searchTrigger?.addEventListener("click", openCommandPalette);

    commandOverlay?.addEventListener("click", (event) => {
        if (event.target === commandOverlay) {
            closeCommandPalette();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();
            openCommandPalette();
        }

        if (
            event.key === "Escape" &&
            commandOverlay?.classList.contains("open")
        ) {
            closeCommandPalette();
        }
    });

    commandInput?.addEventListener("input", () => {
        filterCommands(commandInput.value.trim().toLowerCase());
    });

    function filterCommands(query) {
        if (!commandResults) {
            return;
        }

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
            setActiveView("orders");

            window.setTimeout(() => {
                if (typeof window.openOrderModal === "function") {
                    window.openOrderModal();
                }
            }, 100);
        } else if (action === "customer") {
            setActiveView("customers");

            window.setTimeout(() => {
                openCustomerModal();
            }, 100);
        } else if (action === "report") {
            setActiveView("reports");
        }

        closeCommandPalette();
    });

    /* ============================================================
       QUICK ACTIONS
       ============================================================ */

    quickActionButton?.addEventListener("click", openCommandPalette);

    exportButton?.addEventListener("click", async () => {
        if (typeof window.exportBusinessReport === "function") {
            await window.exportBusinessReport();
        }
    });

    /* ============================================================
       KPI RAIL
       ============================================================ */

    kpiPrev?.addEventListener("click", () => {
        kpiRail?.scrollBy({
            left: -300,
            behavior: "smooth",
        });
    });

    kpiNext?.addEventListener("click", () => {
        kpiRail?.scrollBy({
            left: 300,
            behavior: "smooth",
        });
    });

    /* ============================================================
       REVENUE PERIOD
       ============================================================ */

    revenuePeriod?.addEventListener("change", () => {
        const value = revenuePeriod.value;

        const days = value.includes("7")
            ? 7
            : value.includes("30")
                ? 30
                : value.includes("90")
                    ? 90
                    : 365;

        loadRevenueChart(days);
    });

    /* ============================================================
       LIVE REVENUE CHART
       ============================================================ */

    async function loadRevenueChart(days = 30) {
        const chart = document.getElementById("revenueChart");
        const line = document.getElementById("revenueChartLine");
        const fill = document.getElementById("revenueChartFill");
        const totalElement = document.getElementById("revenueChartTotal");
        const changeElement = document.getElementById("revenueChartChange");

        if (!chart || !line || !fill) {
            return;
        }

        try {
            const response = await fetch(
                `/api/v1/analytics/revenue-trend?days=${days}`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Revenue request failed: ${response.status}`);
            }

            const data = await response.json();

            const values = data.map((item) => Number(item.revenue || 0));
            const max = Math.max(...values, 1);
            const width = 800;
            const height = 300;

            const points = values.map((value, index) => {
                const x =
                    values.length === 1
                        ? width
                        : (index / (values.length - 1)) * width;
                const y = height - (value / max) * (height * 0.82) - 20;

                return [x, y];
            });

            const path = points
                .map(
                    ([x, y], index) =>
                        `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`,
                )
                .join(" ");

            line.setAttribute("d", path);
            fill.setAttribute(
                "d",
                `${path} L ${width} ${height} L 0 ${height} Z`,
            );

            const total = values.reduce((sum, value) => sum + value, 0);

            if (totalElement) {
                totalElement.textContent = `$${total.toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    },
                )}`;
            }

            if (changeElement) {
                changeElement.textContent = "Live";
            }

            const axisValues = [
                max,
                max * 0.75,
                max * 0.5,
                max * 0.25,
            ];

            [
                "revenueAxisTop",
                "revenueAxisHigh",
                "revenueAxisMid",
                "revenueAxisLow",
            ].forEach((id, index) => {
                const element = document.getElementById(id);

                if (element) {
                    element.textContent = `$${axisValues[index].toFixed(0)}`;
                }
            });

            const xAxis = document.getElementById("revenueChartXAxis");

            if (xAxis && data.length) {
                const indices = [
                    0,
                    Math.floor(data.length / 4),
                    Math.floor(data.length / 2),
                    Math.floor((data.length * 3) / 4),
                    data.length - 1,
                ];

                xAxis.innerHTML = indices
                    .map((index) => {
                        const date = new Date(`${data[index].date}T00:00:00`);

                        return `<span>${date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}</span>`;
                    })
                    .join("");
            }
        } catch (error) {
            console.error("Failed to load revenue chart:", error);
        }
    }

    /* ============================================================
       OVERVIEW DATA
       ============================================================ */

    async function loadOverviewData() {
        const formatCurrency = (value) =>
            `$${Number(value || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
    
        const formatDate = (value) => {
            if (!value) {
                return "—";
            }
    
            const date = new Date(value);
    
            if (Number.isNaN(date.getTime())) {
                return value;
            }
    
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        };
    
        const escapeHtml = (value) =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    
        const getStatusLabel = (status) => {
            const labels = {
                pending: "Pending",
                confirmed: "Confirmed",
                processing: "Processing",
                shipped: "Shipped",
                completed: "Completed",
                cancelled: "Cancelled",
            };
    
            return labels[status] || status || "Unknown";
        };
    
        const getStatusClass = (status) => {
            const normalized = String(status || "").toLowerCase();
    
            if (normalized === "completed") {
                return "success";
            }
    
            if (
                normalized === "pending" ||
                normalized === "confirmed" ||
                normalized === "processing"
            ) {
                return "warning";
            }
    
            if (normalized === "cancelled") {
                return "danger";
            }
    
            return "";
        };
    
        const activityContainer = document.getElementById(
            "overviewRecentActivity",
        );
        const ordersContainer = document.getElementById(
            "overviewRecentOrders",
        );
        const healthScore = document.getElementById("businessHealthScore");
        const healthStatus = document.getElementById(
            "businessHealthStatusText",
        );
        const healthDescription = document.getElementById(
            "businessHealthDescription",
        );
        const healthSubdescription = document.getElementById(
            "businessHealthSubdescription",
        );
        const tickerOrders = document.getElementById("liveTickerOrders");
    
        try {
            const [
                analyticsResponse,
                ordersResponse,
                tasksResponse,
                taskSummaryResponse,
                inventoryResponse,
            ] = await Promise.all([
                fetch("/api/v1/analytics/summary", {
                    headers: {
                        Accept: "application/json",
                    },
                }),
                fetch("/api/v1/orders?limit=5", {
                    headers: {
                        Accept: "application/json",
                    },
                }),
                fetch("/api/v1/tasks?limit=5", {
                    headers: {
                        Accept: "application/json",
                    },
                }),
                fetch("/api/v1/tasks/summary", {
                    headers: {
                        Accept: "application/json",
                    },
                }),
                fetch("/api/v1/inventory/summary", {
                    headers: {
                        Accept: "application/json",
                    },
                }),
            ]);
    
            const responses = [
                analyticsResponse,
                ordersResponse,
                tasksResponse,
                taskSummaryResponse,
                inventoryResponse,
            ];
    
            const failedResponse = responses.find(
                (response) => !response.ok,
            );
    
            if (failedResponse) {
                throw new Error(
                    `Overview request failed: ${failedResponse.status}`,
                );
            }
    
            const [
                data,
                ordersData,
                tasksData,
                taskSummary,
                inventoryData,
            ] = await Promise.all(
                responses.map((response) => response.json()),
            );
    
            const revenue = document.getElementById("overviewRevenue");
            const orders = document.getElementById("overviewOrders");
            const customerCount =
                document.getElementById("overviewCustomers");
            const inventoryHealth = document.getElementById(
                "overviewInventoryHealth",
            );
            const inventoryStatus = document.getElementById(
                "overviewInventoryStatus",
            );
            const inventoryReview = document.getElementById(
                "overviewInventoryReview",
            );
    
            if (revenue) {
                revenue.textContent = formatCurrency(data.revenue);
            }
    
            if (orders) {
                orders.textContent = Number(
                    data.orders || 0,
                ).toLocaleString();
            }
    
            if (customerCount) {
                customerCount.textContent = Number(
                    data.customers || 0,
                ).toLocaleString();
            }
    
            const inventoryItems = Number(
                inventoryData.total_items || 0,
            );
            const activeInventoryItems = Number(
                inventoryData.active_items || 0,
            );
            const lowStockItems = Number(
                inventoryData.low_stock_items || 0,
            );
    
            const inventoryScore =
                inventoryItems > 0
                    ? Math.max(
                        0,
                        Math.round(
                            ((inventoryItems - lowStockItems) /
                                inventoryItems) *
                                100,
                        ),
                    )
                    : 0;
    
            if (inventoryHealth) {
                inventoryHealth.textContent =
                    inventoryItems > 0
                        ? `${inventoryScore}%`
                        : "0%";
            }
    
            if (inventoryStatus) {
                inventoryStatus.textContent =
                    inventoryItems === 0
                        ? "No inventory"
                        : inventoryScore >= 90
                            ? "Healthy"
                            : inventoryScore >= 70
                                ? "Attention"
                                : "Degraded";
            }
    
            if (inventoryReview) {
                inventoryReview.textContent =
                    inventoryItems === 0
                        ? "No inventory tracked"
                        : `${lowStockItems} items need review`;
            }
    
            if (tickerOrders) {
                tickerOrders.textContent =
                    `${Number(data.orders || 0).toLocaleString()} orders in workspace`;
            }
            const taskTotal = Number(taskSummary.total || 0);
            const taskCompleted = Number(taskSummary.completed || 0);

            const taskCompletion = taskTotal
                ? Math.round((taskCompleted / taskTotal) * 1000) / 10
                : 0;
    
            const taskValue = document.getElementById(
                "overviewTaskCompletion",
            );
            const taskBar = document.getElementById("overviewTaskBar");
    
            if (taskValue) {
                taskValue.textContent = `${taskCompletion}%`;
            }
    
            if (taskBar) {
                taskBar.style.width = `${Math.min(
                    100,
                    Math.max(0, taskCompletion),
                )}%`;
            }
    
            /*
             * Recent orders
             */
            const recentOrders = Array.isArray(ordersData.items)
                ? ordersData.items
                : [];
    
            if (ordersContainer) {
                if (!recentOrders.length) {
                    ordersContainer.innerHTML = `
                        <tr>
                            <td colspan="5" class="empty-state">
                                No orders found.
                            </td>
                        </tr>
                    `;
                } else {
                    ordersContainer.innerHTML = recentOrders
                        .map((order) => {
                            const customerName =
                                order.customer?.name ||
                                order.customer?.company ||
                                `Customer #${order.customer_id}`;
    
                            const statusClass =
                                getStatusClass(order.status);
    
                            return `
                                <tr>
                                    <td>
                                        <strong>${escapeHtml(
                                            order.order_number,
                                        )}</strong>
                                    </td>
                                    <td>${escapeHtml(customerName)}</td>
                                    <td>${escapeHtml(
                                        formatDate(order.created_at),
                                    )}</td>
                                    <td>${escapeHtml(
                                        formatCurrency(order.total_amount),
                                    )}</td>
                                    <td>
                                        <span class="status-badge ${statusClass}">
                                            ${escapeHtml(
                                                getStatusLabel(order.status),
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        })
                        .join("");
                }
            }
    
            /*
             * Recent activity
             */
            const recentTasks = Array.isArray(tasksData.items)
                ? tasksData.items
                : [];
    
            if (activityContainer) {
                if (!recentTasks.length) {
                    activityContainer.innerHTML = `
                        <div class="empty-state">
                            No recent activity.
                        </div>
                    `;
                } else {
                    activityContainer.innerHTML = recentTasks
                        .map((task) => {
                            const priority =
                                String(task.priority || "normal")
                                    .toLowerCase();
    
                            return `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        ${priority === "high" ? "!" : "✓"}
                                    </div>
                                    <div class="activity-content">
                                        <strong>${escapeHtml(
                                            task.title,
                                        )}</strong>
                                        <span>
                                            ${escapeHtml(
                                                task.status
                                                    ? task.status
                                                          .replace(
                                                              /_/g,
                                                              " ",
                                                          )
                                                    : "Task",
                                            )}
                                            ·
                                            ${escapeHtml(
                                                task.assignee ||
                                                    "Unassigned",
                                            )}
                                        </span>
                                    </div>
                                    <time>${escapeHtml(
                                        formatDate(task.created_at),
                                    )}</time>
                                </div>
                            `;
                        })
                        .join("");
                }
            }
    
            /*
             * Business health
             *
             * The score reflects the actual operational data available
             * rather than claiming external services are healthy.
             */
            const totalOrders = Number(
                ordersData.total ?? data.orders ?? 0,
            );
            const pendingOrders = recentOrders.filter(
                (order) =>
                    String(order.status || "").toLowerCase() ===
                    "pending",
            ).length;
    
            const totalTasks = Number(
                taskSummary.total ??
                    tasksData.total ??
                    data.tasks ??
                    0,
            );
            const overdueTasks = Number(
                taskSummary.overdue ??
                    taskSummary.overdue_tasks ??
                    0,
            );
    
            const orderCompletionRate =
                totalOrders > 0
                    ? Math.round(
                        (recentOrders.filter(
                            (order) =>
                                String(order.status || "")
                                    .toLowerCase() === "completed",
                        ).length /
                            totalOrders) *
                            100,
                    )
                    : 100;
    
            const taskScore =
                totalTasks > 0
                    ? Math.round(
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Number(
                                    taskSummary.completion_rate ??
                                        data.completion_rate ??
                                        0,
                                ),
                            ),
                        ),
                    )
                    : 100;
    
            const inventoryHealthScore =
                inventoryItems > 0 ? inventoryScore : 100;
    
            const orderScore =
                totalOrders > 0
                    ? Math.max(
                        0,
                        100 - Math.min(50, pendingOrders * 10),
                    )
                    : 100;
    
            const overduePenalty = Math.min(30, overdueTasks * 10);
    
            const businessScore = Math.round(
                Math.max(
                    0,
                    Math.min(
                        100,
                        (inventoryHealthScore +
                            orderScore +
                            taskScore +
                            (100 - overduePenalty)) /
                            4,
                    ),
                ),
            );
    
            let businessStatus = "Operational";
            let businessDescription =
                "Operations are running smoothly.";
            let businessSubdescription =
                "Live workspace metrics are responding normally.";
    
            if (businessScore < 90) {
                businessStatus = "Attention";
                businessDescription =
                    "Some operational areas need attention.";
                businessSubdescription =
                    "Review the live workspace metrics for potential follow-up.";
            }
    
            if (businessScore < 70) {
                businessStatus = "Degraded";
                businessDescription =
                    "Several operational signals need attention.";
                businessSubdescription =
                    "Review orders, inventory, and task workload.";
            }
    
            if (healthScore) {
                healthScore.textContent = businessScore;
            }
    
            if (healthStatus) {
                healthStatus.textContent = businessStatus;
            }
    
            if (healthDescription) {
                healthDescription.textContent = businessDescription;
            }
    
            if (healthSubdescription) {
                healthSubdescription.textContent =
                    businessSubdescription;
            }
    
            await loadRevenueChart();
        } catch (error) {
            console.error("Failed to load overview data:", error);
    
            if (activityContainer) {
                activityContainer.innerHTML = `
                    <div class="empty-state">
                        Unable to load recent activity.
                    </div>
                `;
            }
    
            if (ordersContainer) {
                ordersContainer.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            Unable to load recent orders.
                        </td>
                    </tr>
                `;
            }
    
            if (healthStatus) {
                healthStatus.textContent = "Unavailable";
            }
    
            if (healthScore) {
                healthScore.textContent = "—";
            }
    
            if (healthDescription) {
                healthDescription.textContent =
                    "Business health data is unavailable.";
            }
    
            if (healthSubdescription) {
                healthSubdescription.textContent =
                    "Check the API connection and refresh the workspace.";
            }
        }
    }

    async function verifyBackend() {
        try {
            const response = await fetch("/health", {
                headers: {
                    Accept: "application/json",
                },
            });

            const data = await response.json();

            const statusText = document.querySelector(
                ".system-status span:last-child",
            );

            if (statusText && data.status === "healthy") {
                statusText.textContent = "All systems operational";
            }
        } catch (error) {
            console.error("Backend health check failed:", error);

            const statusText = document.querySelector(
                ".system-status span:last-child",
            );

            if (statusText) {
                statusText.textContent = "API connection unavailable";
            }
        }
    }
    createCustomersView();
    loadOverviewData();
    verifyBackend();
});











