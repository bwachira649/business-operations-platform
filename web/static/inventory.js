(() => {
    "use strict";

    let inventoryItems = [];
    let editingItemId = null;

    const main = document.querySelector(".main-content");

    if (!main) {
        return;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatCurrency(value) {
        const amount = Number(value || 0);

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(amount);
    }

    function showToast(title, message) {
        if (typeof window.showToast === "function") {
            window.showToast(title, message);
            return;
        }

        const toast = document.getElementById("toast");
        const toastTitle = document.getElementById("toastTitle");
        const toastMessage = document.getElementById("toastMessage");

        if (toast && toastTitle && toastMessage) {
            toastTitle.textContent = title;
            toastMessage.textContent = message;
            toast.classList.add("show");

            setTimeout(() => {
                toast.classList.remove("show");
            }, 3000);
        }
    }

    function createWorkspace() {
        if (document.getElementById("inventoryView")) {
            return;
        }

        const style = document.createElement("style");

        style.textContent = `
            .inventory-view {
                display: none;
                padding: 28px;
                animation: inventoryFade .3s ease;
            }

            .inventory-view.visible {
                display: block;
            }

            @keyframes inventoryFade {
                from {
                    opacity: 0;
                    transform: translateY(8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .inventory-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 20px;
                margin-bottom: 24px;
            }

            .inventory-eyebrow {
                display: block;
                margin-bottom: 6px;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: .12em;
                text-transform: uppercase;
                opacity: .65;
            }

            .inventory-header h1 {
                margin: 0;
                font-size: clamp(28px, 4vw, 42px);
            }

            .inventory-header p {
                margin: 8px 0 0;
                opacity: .68;
            }

            .inventory-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .inventory-btn {
                border: 0;
                border-radius: 12px;
                padding: 11px 16px;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }

            .inventory-btn-primary {
                background: #4c5bff;
                color: white;
            }

            .inventory-btn-secondary {
                background: rgba(127, 127, 127, .12);
                color: inherit;
            }

            .inventory-kpis {
                display: grid;
                grid-template-columns: repeat(4, minmax(180px, 1fr));
                gap: 14px;
                margin-bottom: 22px;
            }

            .inventory-kpi {
                padding: 20px;
                border: 1px solid rgba(127, 127, 127, .16);
                border-radius: 18px;
                background: rgba(127, 127, 127, .055);
            }

            .inventory-kpi-label {
                display: block;
                font-size: 13px;
                opacity: .62;
            }

            .inventory-kpi-value {
                display: block;
                margin-top: 8px;
                font-size: 30px;
                font-weight: 800;
            }

            .inventory-toolbar {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
                margin-bottom: 16px;
            }

            .inventory-search {
                flex: 1;
                min-width: 240px;
                padding: 13px 15px;
                border: 1px solid rgba(127, 127, 127, .2);
                border-radius: 12px;
                background: transparent;
                color: inherit;
                font: inherit;
            }

            .inventory-select {
                padding: 13px 15px;
                border: 1px solid rgba(127, 127, 127, .2);
                border-radius: 12px;
                background: transparent;
                color: inherit;
                font: inherit;
            }

            .inventory-check {
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
                font-size: 14px;
            }

            .inventory-card {
                overflow: hidden;
                border: 1px solid rgba(127, 127, 127, .16);
                border-radius: 18px;
                background: rgba(127, 127, 127, .04);
            }

            .inventory-table-wrap {
                overflow-x: auto;
            }

            .inventory-table {
                width: 100%;
                min-width: 850px;
                border-collapse: collapse;
            }

            .inventory-table th,
            .inventory-table td {
                padding: 16px 18px;
                text-align: left;
                border-bottom: 1px solid rgba(127, 127, 127, .12);
            }

            .inventory-table th {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: .08em;
                opacity: .58;
            }

            .inventory-table tbody tr:hover {
                background: rgba(127, 127, 127, .05);
            }

            .inventory-name {
                font-weight: 750;
            }

            .inventory-sku {
                font-size: 12px;
                opacity: .55;
                margin-top: 3px;
            }

            .inventory-status {
                display: inline-flex;
                padding: 5px 9px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                text-transform: capitalize;
                background: rgba(76, 91, 255, .12);
            }

            .inventory-status.low {
                background: rgba(255, 170, 0, .14);
            }

            .inventory-status.inactive {
                background: rgba(127, 127, 127, .14);
            }

            .inventory-row-actions {
                display: flex;
                gap: 7px;
            }

            .inventory-row-btn {
                border: 1px solid rgba(127, 127, 127, .18);
                border-radius: 9px;
                padding: 7px 10px;
                background: transparent;
                color: inherit;
                cursor: pointer;
                font: inherit;
                font-size: 12px;
            }

            .inventory-empty,
            .inventory-error {
                padding: 55px 20px;
                text-align: center;
                opacity: .68;
            }

            .inventory-modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(5, 10, 25, .72);
                backdrop-filter: blur(8px);
            }

            .inventory-modal-backdrop.open {
                display: flex;
            }

            .inventory-modal {
                width: min(680px, 100%);
                max-height: 90vh;
                overflow-y: auto;
                padding: 24px;
                border: 1px solid rgba(127, 127, 127, .2);
                border-radius: 20px;
                background: var(--surface, #fff);
                color: var(--text, #111);
                box-shadow: 0 30px 80px rgba(0, 0, 0, .3);
            }

            .inventory-modal-header {
                display: flex;
                justify-content: space-between;
                gap: 15px;
                margin-bottom: 22px;
            }

            .inventory-modal-header h2 {
                margin: 0;
            }

            .inventory-close {
                border: 0;
                background: transparent;
                color: inherit;
                font-size: 25px;
                cursor: pointer;
            }

            .inventory-form {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
            }

            .inventory-field {
                display: grid;
                gap: 7px;
            }

            .inventory-field.full {
                grid-column: 1 / -1;
            }

            .inventory-field label {
                font-size: 13px;
                font-weight: 700;
            }

            .inventory-field input,
            .inventory-field select,
            .inventory-field textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 11px 12px;
                border: 1px solid rgba(127, 127, 127, .22);
                border-radius: 10px;
                background: transparent;
                color: inherit;
                font: inherit;
            }

            .inventory-field textarea {
                min-height: 100px;
                resize: vertical;
            }

            .inventory-modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 22px;
            }

            .inventory-detail-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 14px;
            }

            .inventory-detail {
                padding: 15px;
                border-radius: 12px;
                background: rgba(127, 127, 127, .08);
            }

            .inventory-detail small {
                display: block;
                margin-bottom: 5px;
                opacity: .55;
            }

            @media (max-width: 900px) {
                .inventory-kpis {
                    grid-template-columns: repeat(2, minmax(160px, 1fr));
                }
            }

            @media (max-width: 650px) {
                .inventory-view {
                    padding: 18px;
                }

                .inventory-header {
                    flex-direction: column;
                }

                .inventory-actions {
                    width: 100%;
                }

                .inventory-actions .inventory-btn {
                    flex: 1;
                }

                .inventory-form,
                .inventory-detail-grid {
                    grid-template-columns: 1fr;
                }

                .inventory-field.full {
                    grid-column: auto;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .inventory-view {
                    animation: none;
                }
            }
        `;

        document.head.appendChild(style);

        const view = document.createElement("section");

        view.id = "inventoryView";
        view.className = "inventory-view";

        view.innerHTML = `
            <div class="inventory-header">
                <div>
                    <span class="inventory-eyebrow">Stock operations</span>
                    <h1>Inventory</h1>
                    <p>Track products, stock levels, pricing and reorder conditions.</p>
                </div>

                <div class="inventory-actions">
                    <button class="inventory-btn inventory-btn-secondary" id="refreshInventoryButton">
                         Refresh
                    </button>
                    <button class="inventory-btn inventory-btn-primary" id="addInventoryButton">
                        + New item
                    </button>
                </div>
            </div>

            <div class="inventory-kpis">
                <div class="inventory-kpi">
                    <span class="inventory-kpi-label">Inventory items</span>
                    <strong class="inventory-kpi-value" id="inventoryTotal"></strong>
                </div>

                <div class="inventory-kpi">
                    <span class="inventory-kpi-label">Active items</span>
                    <strong class="inventory-kpi-value" id="inventoryActive"></strong>
                </div>

                <div class="inventory-kpi">
                    <span class="inventory-kpi-label">Low stock</span>
                    <strong class="inventory-kpi-value" id="inventoryLowStock"></strong>
                </div>

                <div class="inventory-kpi">
                    <span class="inventory-kpi-label">Total units</span>
                    <strong class="inventory-kpi-value" id="inventoryUnits"></strong>
                </div>
            </div>

            <div class="inventory-toolbar">
                <input
                    id="inventorySearch"
                    class="inventory-search"
                    type="search"
                    placeholder="Search SKU, product or category..."
                >

                <select id="inventoryStatus" class="inventory-select">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                <label class="inventory-check">
                    <input id="inventoryLowStockOnly" type="checkbox">
                    Low stock only
                </label>
            </div>

            <div class="inventory-card">
                <div class="inventory-table-wrap">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Unit price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            <tr>
                                <td colspan="6">
                                    <div class="inventory-empty">Loading inventory...</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="inventory-modal-backdrop" id="inventoryFormBackdrop">
                <div class="inventory-modal">
                    <div class="inventory-modal-header">
                        <div>
                            <span class="inventory-eyebrow">Inventory record</span>
                            <h2 id="inventoryFormTitle">New inventory item</h2>
                        </div>
                        <button class="inventory-close" data-close-inventory-modal></button>
                    </div>

                    <form class="inventory-form" id="inventoryForm">
                        <div class="inventory-field">
                            <label for="inventorySku">SKU</label>
                            <input id="inventorySku" name="sku" required minlength="2" maxlength="50">
                        </div>

                        <div class="inventory-field">
                            <label for="inventoryName">Product name</label>
                            <input id="inventoryName" name="name" required minlength="2" maxlength="150">
                        </div>

                        <div class="inventory-field">
                            <label for="inventoryCategory">Category</label>
                            <input id="inventoryCategory" name="category" maxlength="100">
                        </div>

                        <div class="inventory-field">
                            <label for="inventoryQuantity">Quantity</label>
                            <input id="inventoryQuantity" name="quantity" type="number" min="0" value="0" required>
                        </div>

                        <div class="inventory-field">
                            <label for="inventoryReorder">Reorder level</label>
                            <input id="inventoryReorder" name="reorder_level" type="number" min="0" value="10" required>
                        </div>

                        <div class="inventory-field">
                            <label for="inventoryPrice">Unit price</label>
                            <input id="inventoryPrice" name="unit_price" type="number" min="0.01" step="0.01" required>
                        </div>

                        <div class="inventory-field">
                            <label for="inventoryItemStatus">Status</label>
                            <select id="inventoryItemStatus" name="status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div class="inventory-field full">
                            <label for="inventoryDescription">Description</label>
                            <textarea id="inventoryDescription" name="description" maxlength="5000"></textarea>
                        </div>

                        <div class="inventory-modal-actions">
                            <button type="button" class="inventory-btn inventory-btn-secondary" data-close-inventory-modal>
                                Cancel
                            </button>
                            <button type="submit" class="inventory-btn inventory-btn-primary">
                                Save item
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="inventory-modal-backdrop" id="inventoryDetailsBackdrop">
                <div class="inventory-modal">
                    <div class="inventory-modal-header">
                        <div>
                            <span class="inventory-eyebrow">Product details</span>
                            <h2 id="inventoryDetailsTitle">Inventory item</h2>
                        </div>
                        <button class="inventory-close" data-close-inventory-details></button>
                    </div>

                    <div class="inventory-detail-grid" id="inventoryDetailsGrid"></div>

                    <div class="inventory-modal-actions">
                        <button class="inventory-btn inventory-btn-secondary" data-close-inventory-details>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        main.appendChild(view);

        document
            .getElementById("refreshInventoryButton")
            .addEventListener("click", loadInventory);

        document
            .getElementById("addInventoryButton")
            .addEventListener("click", () => openInventoryForm());

        document
            .getElementById("inventoryForm")
            .addEventListener("submit", saveInventoryItem);

        document
            .getElementById("inventorySearch")
            .addEventListener("input", debounce(loadInventory, 300));

        document
            .getElementById("inventoryStatus")
            .addEventListener("change", loadInventory);

        document
            .getElementById("inventoryLowStockOnly")
            .addEventListener("change", loadInventory);

        document
            .querySelectorAll("[data-close-inventory-modal]")
            .forEach((button) => {
                button.addEventListener("click", closeInventoryModal);
            });

        document
            .querySelectorAll("[data-close-inventory-details]")
            .forEach((button) => {
                button.addEventListener("click", closeInventoryDetails);
            });
    }

    function debounce(callback, delay) {
        let timer;

        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => callback(...args), delay);
        };
    }

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });

        if (!response.ok) {
            let message = `Request failed with status ${response.status}.`;

            try {
                const data = await response.json();
                message = data.detail || message;
            } catch {
                // Keep default message.
            }

            throw new Error(message);
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    async function loadInventory() {
        createWorkspace();

        const search = document.getElementById("inventorySearch")?.value.trim();
        const status = document.getElementById("inventoryStatus")?.value;
        const lowStock = document.getElementById("inventoryLowStockOnly")?.checked;

        const params = new URLSearchParams();

        if (search) {
            params.set("search", search);
        }

        if (status) {
            params.set("status", status);
        }

        if (lowStock) {
            params.set("low_stock", "true");
        }

        params.set("limit", "100");

        const tableBody = document.getElementById("inventoryTableBody");

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="inventory-empty">Loading inventory...</div>
                    </td>
                </tr>
            `;
        }

        try {
            const [data, summary] = await Promise.all([
                apiRequest(`/api/v1/inventory?${params.toString()}`),
                apiRequest("/api/v1/inventory/summary"),
            ]);

            inventoryItems = data.items || [];

            renderSummary(summary);
            renderInventory();
        } catch (error) {
            console.error(error);

            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            <div class="inventory-error">
                                Unable to load inventory.<br>
                                ${escapeHtml(error.message)}
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    function renderSummary(summary) {
        document.getElementById("inventoryTotal").textContent =
            summary.total_items ?? 0;

        document.getElementById("inventoryActive").textContent =
            summary.active_items ?? 0;

        document.getElementById("inventoryLowStock").textContent =
            summary.low_stock_items ?? 0;

        document.getElementById("inventoryUnits").textContent =
            summary.total_units ?? 0;
    }

    function renderInventory() {
        const tableBody = document.getElementById("inventoryTableBody");

        if (!tableBody) {
            return;
        }

        if (!inventoryItems.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="inventory-empty">
                            No inventory items found.<br>
                            Create your first inventory item.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = inventoryItems
            .map((item) => {
                const lowStock =
                    Number(item.quantity) <= Number(item.reorder_level);

                const statusClass =
                    item.status === "inactive"
                        ? "inactive"
                        : lowStock
                            ? "low"
                            : "";

                return `
                    <tr>
                        <td>
                            <div class="inventory-name">
                                ${escapeHtml(item.name)}
                            </div>
                            <div class="inventory-sku">
                                ${escapeHtml(item.sku)}
                            </div>
                        </td>

                        <td>${escapeHtml(item.category || "")}</td>

                        <td>
                            <strong>${Number(item.quantity)}</strong>
                            <div class="inventory-sku">
                                Reorder at ${Number(item.reorder_level)}
                            </div>
                        </td>

                        <td>${formatCurrency(item.unit_price)}</td>

                        <td>
                            <span class="inventory-status ${statusClass}">
                                ${escapeHtml(
                                    lowStock && item.status === "active"
                                        ? "low stock"
                                        : item.status
                                )}
                            </span>
                        </td>

                        <td>
                            <div class="inventory-row-actions">
                                <button
                                    class="inventory-row-btn"
                                    data-action="view"
                                    data-id="${item.id}"
                                >
                                    View
                                </button>

                                <button
                                    class="inventory-row-btn"
                                    data-action="edit"
                                    data-id="${item.id}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="inventory-row-btn"
                                    data-action="delete"
                                    data-id="${item.id}"
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");

        tableBody.querySelectorAll("[data-action='view']").forEach((button) => {
            button.addEventListener("click", () => {
                openInventoryDetails(Number(button.dataset.id));
            });
        });

        tableBody.querySelectorAll("[data-action='edit']").forEach((button) => {
            button.addEventListener("click", () => {
                const item = inventoryItems.find(
                    (entry) => entry.id === Number(button.dataset.id)
                );

                if (item) {
                    openInventoryForm(item);
                }
            });
        });

        tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
            button.addEventListener("click", () => {
                deleteInventoryItem(Number(button.dataset.id));
            });
        });
    }

    function openInventoryForm(item = null) {
        createWorkspace();

        editingItemId = item?.id ?? null;

        document.getElementById("inventoryFormTitle").textContent =
            item ? "Edit inventory item" : "New inventory item";

        document.getElementById("inventorySku").value = item?.sku ?? "";
        document.getElementById("inventoryName").value = item?.name ?? "";
        document.getElementById("inventoryCategory").value = item?.category ?? "";
        document.getElementById("inventoryQuantity").value = item?.quantity ?? 0;
        document.getElementById("inventoryReorder").value =
            item?.reorder_level ?? 10;
        document.getElementById("inventoryPrice").value =
            item?.unit_price ?? "";
        document.getElementById("inventoryItemStatus").value =
            item?.status ?? "active";
        document.getElementById("inventoryDescription").value =
            item?.description ?? "";

        document
            .getElementById("inventoryFormBackdrop")
            .classList.add("open");
    }

    function closeInventoryModal() {
        document
            .getElementById("inventoryFormBackdrop")
            .classList.remove("open");

        editingItemId = null;
    }

    async function saveInventoryItem(event) {
        event.preventDefault();

        const wasEditing = Boolean(editingItemId);

        const payload = {
            sku: document.getElementById("inventorySku").value.trim(),
            name: document.getElementById("inventoryName").value.trim(),
            category:
                document.getElementById("inventoryCategory").value.trim() || null,
            quantity: Number(
                document.getElementById("inventoryQuantity").value
            ),
            reorder_level: Number(
                document.getElementById("inventoryReorder").value
            ),
            unit_price: Number(
                document.getElementById("inventoryPrice").value
            ),
            status: document.getElementById("inventoryItemStatus").value,
            description:
                document.getElementById("inventoryDescription").value.trim() ||
                null,
        };

        try {
            if (wasEditing) {
                await apiRequest(`/api/v1/inventory/${editingItemId}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });
            } else {
                await apiRequest("/api/v1/inventory", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }

            closeInventoryModal();
            await loadInventory();

            showToast(
                wasEditing ? "Inventory updated" : "Inventory created",
                wasEditing
                    ? "The inventory item was updated successfully."
                    : "The inventory item was created successfully."
            );
        } catch (error) {
            console.error(error);

            showToast(
                "Inventory error",
                error.message
            );
        }
    }

    function openInventoryDetails(itemId) {
        const item = inventoryItems.find(
            (entry) => entry.id === itemId
        );

        if (!item) {
            return;
        }

        document.getElementById("inventoryDetailsTitle").textContent =
            item.name;

        document.getElementById("inventoryDetailsGrid").innerHTML = `
            <div class="inventory-detail">
                <small>SKU</small>
                <strong>${escapeHtml(item.sku)}</strong>
            </div>

            <div class="inventory-detail">
                <small>Category</small>
                <strong>${escapeHtml(item.category || "")}</strong>
            </div>

            <div class="inventory-detail">
                <small>Quantity</small>
                <strong>${Number(item.quantity)}</strong>
            </div>

            <div class="inventory-detail">
                <small>Reorder level</small>
                <strong>${Number(item.reorder_level)}</strong>
            </div>

            <div class="inventory-detail">
                <small>Unit price</small>
                <strong>${formatCurrency(item.unit_price)}</strong>
            </div>

            <div class="inventory-detail">
                <small>Status</small>
                <strong>${escapeHtml(item.status)}</strong>
            </div>

            <div class="inventory-detail">
                <small>Description</small>
                <strong>${escapeHtml(item.description || "No description")}</strong>
            </div>

            <div class="inventory-detail">
                <small>Created</small>
                <strong>${new Date(item.created_at).toLocaleString()}</strong>
            </div>
        `;

        document
            .getElementById("inventoryDetailsBackdrop")
            .classList.add("open");
    }

    function closeInventoryDetails() {
        document
            .getElementById("inventoryDetailsBackdrop")
            .classList.remove("open");
    }

    async function deleteInventoryItem(itemId) {
        const item = inventoryItems.find(
            (entry) => entry.id === itemId
        );

        if (!item) {
            return;
        }

        if (!window.confirm(
            `Delete "${item.name}" (${item.sku})? This action cannot be undone.`
        )) {
            return;
        }

        try {
            await apiRequest(`/api/v1/inventory/${itemId}`, {
                method: "DELETE",
            });

            await loadInventory();

            showToast(
                "Inventory deleted",
                "The inventory item was removed successfully."
            );
        } catch (error) {
            console.error(error);

            showToast(
                "Delete failed",
                error.message
            );
        }
    }

    window.loadInventory = loadInventory;

    createWorkspace();
})();

