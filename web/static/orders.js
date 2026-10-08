(() => {
    "use strict";

    const API = "/api/v1/orders";
    let orders = [];
    let editingOrderId = null;

    const money = (value, currency = "USD") =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
        }).format(Number(value || 0));

    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const capitalize = (value) =>
        String(value || "").charAt(0).toUpperCase() +
        String(value || "").slice(1);

    function showMessage(message) {
        if (typeof window.showToast === "function") {
            window.showToast("Orders", message);
        }
    }

    function getCustomerName(order) {
        return order.customer?.name || `Customer #${order.customer_id}`;
    }

    function getCustomerEmail(order) {
        return order.customer?.email || "";
    }

    function createWorkspace() {
        if (document.getElementById("ordersView")) {
            return;
        }

        const main = document.querySelector(".main-content");

        if (!main) {
            return;
        }

        const view = document.createElement("section");
        view.id = "ordersView";
        view.className = "workspace-view";

        view.innerHTML = `
            <div class="orders-shell">
                <header class="orders-header">
                    <div class="orders-header-copy">
                        <span class="orders-eyebrow">Commerce operations</span>
                        <h1>Orders</h1>
                        <p>
                            Manage customer orders, payments and fulfillment
                            status from one workspace.
                        </p>
                    </div>

                    <div class="orders-actions">
                        <button
                            id="ordersRefresh"
                            class="text-button"
                            type="button"
                        >
                            Refresh
                        </button>

                        <button
                            id="ordersNew"
                            class="orders-primary"
                            type="button"
                        >
                            + New order
                        </button>
                    </div>
                </header>

                <section class="orders-kpis">
                    <article class="orders-kpi">
                        <span class="orders-kpi-label">Total orders</span>
                        <strong id="ordersTotal" class="orders-kpi-value">0</strong>
                    </article>

                    <article class="orders-kpi">
                        <span class="orders-kpi-label">Pending</span>
                        <strong id="ordersPending" class="orders-kpi-value">0</strong>
                    </article>

                    <article class="orders-kpi">
                        <span class="orders-kpi-label">Completed</span>
                        <strong id="ordersCompleted" class="orders-kpi-value">0</strong>
                    </article>

                    <article class="orders-kpi">
                        <span class="orders-kpi-label">Revenue</span>
                        <strong id="ordersRevenue" class="orders-kpi-value">$0.00</strong>
                    </article>
                </section>

                <div class="orders-toolbar">
                    <input
                        id="ordersSearch"
                        class="orders-search"
                        type="search"
                        placeholder="Search order number or description..."
                    >

                    <select id="ordersStatus" class="orders-filter">
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <section class="panel orders-table-panel">
                    <div class="orders-table-scroll">
                        <table class="orders-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>

                            <tbody id="ordersBody">
                                <tr>
                                    <td colspan="6" class="orders-empty">
                                        Loading orders...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        `;

        main.appendChild(view);

        document
            .getElementById("ordersRefresh")
            ?.addEventListener("click", loadOrders);

        document
            .getElementById("ordersNew")
            ?.addEventListener("click", () => openOrderForm());

        document
            .getElementById("ordersSearch")
            ?.addEventListener("input", debounce(loadOrders, 250));

        document
            .getElementById("ordersStatus")
            ?.addEventListener("change", loadOrders);
    }

    function debounce(fn, delay) {
        let timer;

        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    async function loadOrders() {
        createWorkspace();

        const search =
            document.getElementById("ordersSearch")?.value.trim();

        const status =
            document.getElementById("ordersStatus")?.value;

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

        const body = document.getElementById("ordersBody");

        try {
            const response = await fetch(`${API}?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            orders = data.items || [];

            renderOrders();
            updateMetrics();
        } catch (error) {
            console.error("Failed to load orders:", error);

            if (body) {
                body.innerHTML = `
                    <tr>
                        <td colspan="6" class="orders-empty">
                            Unable to load orders.
                        </td>
                    </tr>
                `;
            }

            showMessage("Unable to load orders.");
        }
    }

    function updateMetrics() {
        const total = orders.length;

        const pending = orders.filter(
            (order) => order.status === "pending",
        ).length;

        const completed = orders.filter(
            (order) => order.status === "completed",
        ).length;

        const revenue = orders
            .filter((order) => order.status !== "cancelled")
            .reduce(
                (sum, order) =>
                    sum + Number(order.total_amount || 0),
                0,
            );

        document.getElementById("ordersTotal").textContent = total;
        document.getElementById("ordersPending").textContent = pending;
        document.getElementById("ordersCompleted").textContent = completed;
        document.getElementById("ordersRevenue").textContent = money(revenue);
    }

    function renderOrders() {
        const body = document.getElementById("ordersBody");

        if (!body) {
            return;
        }

        if (!orders.length) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" class="orders-empty">
                        <strong>No orders found.</strong>
                        <span>
                            Create your first order to begin tracking
                            commerce activity.
                        </span>
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML = orders
            .map(
                (order) => `
                    <tr>
                        <td>
                            <strong class="order-number">
                                ${escapeHtml(order.order_number)}
                            </strong>

                            <div class="order-id">
                                #${escapeHtml(order.id)}
                            </div>
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(getCustomerName(order))}
                            </strong>

                            ${
                                getCustomerEmail(order)
                                    ? `
                                        <div class="order-id">
                                            ${escapeHtml(
                                                getCustomerEmail(order),
                                            )}
                                        </div>
                                    `
                                    : `
                                        <div class="order-id">
                                            Customer #${escapeHtml(
                                                order.customer_id,
                                            )}
                                        </div>
                                    `
                            }
                        </td>

                        <td>
                            <strong class="order-amount">
                                ${money(
                                    order.total_amount,
                                    order.currency,
                                )}
                            </strong>
                        </td>

                        <td>
                            <span class="order-status">
                                ${escapeHtml(capitalize(order.status))}
                            </span>
                        </td>

                        <td>
                            ${formatDate(order.created_at)}
                        </td>

                        <td>
                            <div class="order-actions">
                                <button
                                    class="order-action"
                                    type="button"
                                    data-order-view="${order.id}"
                                >
                                    View
                                </button>

                                <button
                                    class="order-action"
                                    type="button"
                                    data-order-edit="${order.id}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="order-action order-action-danger"
                                    type="button"
                                    data-order-delete="${order.id}"
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `,
            )
            .join("");

        body.querySelectorAll("[data-order-view]").forEach((button) => {
            button.addEventListener("click", () => {
                const order = orders.find(
                    (item) =>
                        item.id === Number(button.dataset.orderView),
                );

                if (order) {
                    openOrderDetails(order);
                }
            });
        });

        body.querySelectorAll("[data-order-edit]").forEach((button) => {
            button.addEventListener("click", () => {
                const order = orders.find(
                    (item) =>
                        item.id === Number(button.dataset.orderEdit),
                );

                if (order) {
                    openOrderForm(order);
                }
            });
        });

        body.querySelectorAll("[data-order-delete]").forEach((button) => {
            button.addEventListener("click", () => {
                deleteOrder(Number(button.dataset.orderDelete));
            });
        });
    }

    function formatDate(value) {
        if (!value) {
            return "";
        }

        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    }

    function createModal() {
        const modal = document.createElement("div");

        modal.id = "ordersModal";
        modal.className = "orders-modal";

        return modal;
    }

    function openOrderDetails(order) {
        document.getElementById("ordersModal")?.remove();

        const modal = createModal();

        modal.innerHTML = `
            <div class="orders-modal-panel">
                <div class="orders-modal-header">
                    <div>
                        <span class="orders-eyebrow">Order details</span>
                        <h2>${escapeHtml(order.order_number)}</h2>
                    </div>

                    <button
                        id="ordersClose"
                        type="button"
                        class="text-button"
                    >
                        Close
                    </button>
                </div>

                <div class="orders-modal-body">
                    <div class="orders-detail-grid">
                        <div class="orders-detail-card">
                            <span class="orders-detail-label">
                                Customer
                            </span>
                            <strong class="orders-detail-value">
                                ${escapeHtml(getCustomerName(order))}
                            </strong>
                            ${
                                getCustomerEmail(order)
                                    ? `
                                        <span class="orders-detail-label">
                                            ${escapeHtml(
                                                getCustomerEmail(order),
                                            )}
                                        </span>
                                    `
                                    : `
                                        <span class="orders-detail-label">
                                            Customer #${escapeHtml(
                                                order.customer_id,
                                            )}
                                        </span>
                                    `
                            }
                        </div>

                        <div class="orders-detail-card">
                            <span class="orders-detail-label">
                                Amount
                            </span>
                            <strong class="orders-detail-value">
                                ${money(
                                    order.total_amount,
                                    order.currency,
                                )}
                            </strong>
                        </div>
                    </div>

                    <div>
                        <span class="orders-detail-label">Status</span>
                        <div style="margin-top:8px;">
                            <span class="order-status">
                                ${escapeHtml(capitalize(order.status))}
                            </span>
                        </div>
                    </div>

                    <div>
                        <span class="orders-detail-label">
                            Description
                        </span>
                        <p style="
                            margin-top:8px;
                            color:var(--text-secondary);
                            font-size:12px;
                            line-height:1.7;
                        ">
                            ${escapeHtml(
                                order.description ||
                                "No description provided.",
                            )}
                        </p>
                    </div>

                    <div>
                        <span class="orders-detail-label">Created</span>
                        <p style="
                            margin-top:8px;
                            font-size:12px;
                        ">
                            ${formatDate(order.created_at)}
                        </p>
                    </div>
                </div>

                <div class="orders-modal-footer">
                    <button
                        id="ordersDetailsClose"
                        type="button"
                        class="orders-primary"
                    >
                        Done
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("ordersClose")
            ?.addEventListener("click", () => modal.remove());

        document
            .getElementById("ordersDetailsClose")
            ?.addEventListener("click", () => modal.remove());

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }

    function openOrderForm(order = null) {
        editingOrderId = order?.id ?? null;

        document.getElementById("ordersModal")?.remove();

        const modal = createModal();

        modal.innerHTML = `
            <form
                id="orderForm"
                class="orders-modal-panel"
            >
                <div class="orders-modal-header">
                    <div>
                        <span class="orders-eyebrow">
                            Commerce operations
                        </span>

                        <h2>
                            ${order ? "Edit order" : "New order"}
                        </h2>

                        <p style="
                            margin-top:7px;
                            color:var(--text-secondary);
                            font-size:12px;
                        ">
                            ${
                                order
                                    ? "Update order information and fulfillment status."
                                    : "Create a new customer order and begin tracking fulfillment."
                            }
                        </p>
                    </div>

                    <button
                        id="ordersClose"
                        type="button"
                        class="text-button"
                    >
                        Close
                    </button>
                </div>

                <div class="orders-modal-body">
                    <div class="orders-form-grid">
                        ${
                            order
                                ? `
                                    <div class="orders-field">
                                        <label>Order number</label>
                                        <input
                                            type="text"
                                            value="${escapeHtml(
                                                order.order_number,
                                            )}"
                                            readonly
                                        >
                                    </div>
                                `
                                : `
                                    <div class="orders-field">
                                        <label for="orderCustomerId">
                                            Customer ID
                                        </label>
                                        <input
                                            id="orderCustomerId"
                                            name="customer_id"
                                            type="number"
                                            min="1"
                                            required
                                            placeholder="e.g. 1"
                                        >
                                    </div>
                                `
                        }

                        <div class="orders-field">
                            <label for="orderAmount">
                                Total amount
                            </label>
                            <input
                                id="orderAmount"
                                name="total_amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                value="${escapeHtml(
                                    order?.total_amount ?? "",
                                )}"
                                placeholder="0.00"
                            >
                        </div>
                    </div>

                    <div class="orders-form-grid">
                        <div class="orders-field">
                            <label for="orderCurrency">
                                Currency
                            </label>
                            <input
                                id="orderCurrency"
                                name="currency"
                                maxlength="3"
                                value="${escapeHtml(
                                    order?.currency ?? "USD",
                                )}"
                                ${order ? "readonly" : ""}
                                required
                                placeholder="USD"
                            >
                        </div>

                        ${
                            order
                                ? `
                                    <div class="orders-field">
                                        <label for="orderStatus">
                                            Fulfillment status
                                        </label>

                                        <select
                                            id="orderStatus"
                                            name="status"
                                        >
                                            ${[
                                                "pending",
                                                "confirmed",
                                                "processing",
                                                "shipped",
                                                "completed",
                                                "cancelled",
                                            ]
                                                .map(
                                                    (status) => `
                                                        <option
                                                            value="${status}"
                                                            ${
                                                                order.status ===
                                                                status
                                                                    ? "selected"
                                                                    : ""
                                                            }
                                                        >
                                                            ${capitalize(status)}
                                                        </option>
                                                    `,
                                                )
                                                .join("")}
                                        </select>
                                    </div>
                                `
                                : `
                                    <div class="orders-field">
                                        <label>Initial status</label>
                                        <input
                                            type="text"
                                            value="Pending"
                                            readonly
                                        >
                                    </div>
                                `
                        }
                    </div>

                    <div class="orders-field">
                        <label for="orderDescription">
                            Description
                        </label>

                        <textarea
                            id="orderDescription"
                            name="description"
                            rows="5"
                            maxlength="5000"
                            placeholder="Add order notes, customer requirements or fulfillment details..."
                        >${escapeHtml(
                            order?.description ?? "",
                        )}</textarea>
                    </div>
                </div>

                <div class="orders-modal-footer">
                    <button
                        id="ordersCancel"
                        type="button"
                        class="text-button"
                    >
                        Cancel
                    </button>

                    <button
                        class="orders-primary"
                        type="submit"
                    >
                        ${order ? "Save changes" : "Create order"}
                    </button>
                </div>
            </form>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("ordersClose")
            ?.addEventListener("click", () => modal.remove());

        document
            .getElementById("ordersCancel")
            ?.addEventListener("click", () => modal.remove());

        document
            .getElementById("orderForm")
            ?.addEventListener(
                "submit",
                (event) => submitOrder(event, order),
            );

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }

    async function submitOrder(event, order) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = new FormData(form);

        let payload;

        if (order) {
            payload = {
                status: data.get("status"),
                total_amount: Number(data.get("total_amount")),
                description: data.get("description") || null,
            };
        } else {
            payload = {
                customer_id: Number(data.get("customer_id")),
                total_amount: Number(data.get("total_amount")),
                currency: String(data.get("currency")).toUpperCase(),
                description: data.get("description") || null,
            };
        }

        try {
            const response = await fetch(
                order ? `${API}/${order.id}` : API,
                {
                    method: order ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.detail || `HTTP ${response.status}`,
                );
            }

            document.getElementById("ordersModal")?.remove();

            showMessage(
                order
                    ? "Order updated successfully."
                    : "Order created successfully.",
            );

            await loadOrders();
        } catch (error) {
            console.error("Order save failed:", error);
            showMessage(error.message || "Unable to save order.");
        }
    }

    async function deleteOrder(orderId) {
        const order = orders.find(
            (item) => item.id === orderId,
        );

        if (!order) {
            return;
        }

        if (!window.confirm(`Delete ${order.order_number}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API}/${orderId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const result =
                    await response.json().catch(() => null);

                throw new Error(
                    result?.detail || `HTTP ${response.status}`,
                );
            }

            showMessage("Order deleted successfully.");

            await loadOrders();
        } catch (error) {
            console.error("Order deletion failed:", error);
            showMessage(
                error.message || "Unable to delete order.",
            );
        }
    }

    window.loadOrders = loadOrders;

    document.addEventListener("DOMContentLoaded", () => {
        createWorkspace();
        loadOrders();
    });

    window.addEventListener("opsflow:viewchange", (event) => {
        if (event.detail === "orders") {
            loadOrders();
        }
    });
})();
