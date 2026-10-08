(() => {
    const API = "/api/v1/analytics/summary";

    function createWorkspace() {
        if (document.getElementById("analyticsView")) {
            return;
        }

        const workspace = document.createElement("section");
        workspace.id = "analyticsView";
        workspace.className = "workspace-view";
        workspace.style.display = "none";

        workspace.innerHTML = `
            <div class="workspace-header">
                <div>
                    <span class="workspace-eyebrow">Business intelligence</span>
                    <h1>Analytics</h1>
                    <p>Live operational metrics from your customers, orders and inventory.</p>
                </div>

                <button class="primary-button" id="analyticsRefreshButton" type="button">
                     Refresh data
                </button>
            </div>

            <div class="analytics-kpi-grid" id="analyticsKpiGrid">
                <article class="panel analytics-kpi-card">
                    <span>Revenue</span>
                    <strong id="analyticsRevenue"></strong>
                    <small>Non-cancelled orders</small>
                </article>

                <article class="panel analytics-kpi-card">
                    <span>Orders</span>
                    <strong id="analyticsOrders"></strong>
                    <small>Total orders</small>
                </article>

                <article class="panel analytics-kpi-card">
                    <span>Average order</span>
                    <strong id="analyticsAverage"></strong>
                    <small>Revenue per order</small>
                </article>

                <article class="panel analytics-kpi-card">
                    <span>Completion rate</span>
                    <strong id="analyticsCompletion"></strong>
                    <small>Orders completed</small>
                </article>
            </div>

            <div class="analytics-main-grid">
                <article class="panel analytics-overview-panel">
                    <div class="panel-heading">
                        <div>
                            <span class="workspace-eyebrow">Operational overview</span>
                            <h2>Business performance</h2>
                        </div>
                        <span class="live-indicator">
                            <span></span> Live data
                        </span>
                    </div>

                    <div class="analytics-metrics">
                        <div class="analytics-metric">
                            <span>Customers</span>
                            <strong id="analyticsCustomers"></strong>
                        </div>

                        <div class="analytics-metric">
                            <span>Active customers</span>
                            <strong id="analyticsActiveCustomers"></strong>
                        </div>

                        <div class="analytics-metric">
                            <span>Completed orders</span>
                            <strong id="analyticsCompletedOrders"></strong>
                        </div>

                        <div class="analytics-metric">
                            <span>Pending orders</span>
                            <strong id="analyticsPendingOrders"></strong>
                        </div>
                    </div>

                    <div class="analytics-progress">
                        <div class="progress-header">
                            <span>Order completion</span>
                            <strong id="analyticsProgressValue"></strong>
                        </div>

                        <div class="progress-track">
                            <div class="progress-fill" id="analyticsProgressFill"></div>
                        </div>
                    </div>
                </article>

                <article class="panel analytics-inventory-panel">
                    <div class="panel-heading">
                        <div>
                            <span class="workspace-eyebrow">Inventory health</span>
                            <h2>Stock position</h2>
                        </div>
                    </div>

                    <div class="inventory-health-value">
                        <strong id="analyticsInventoryItems"></strong>
                        <span>tracked items</span>
                    </div>

                    <div class="inventory-health-list">
                        <div>
                            <span>Total units</span>
                            <strong id="analyticsTotalUnits"></strong>
                        </div>

                        <div>
                            <span>Low stock</span>
                            <strong id="analyticsLowStock"></strong>
                        </div>
                    </div>

                    <div class="inventory-health-bar">
                        <div id="analyticsStockBar"></div>
                    </div>
                </article>
            </div>

            <div class="analytics-insight-grid">
                <article class="panel insight-card">
                    <div class="insight-icon"></div>
                    <div>
                        <span>Revenue signal</span>
                        <strong id="analyticsRevenueInsight"></strong>
                        <p>Recorded revenue excluding cancelled orders.</p>
                    </div>
                </article>

                <article class="panel insight-card">
                    <div class="insight-icon"></div>
                    <div>
                        <span>Order pipeline</span>
                        <strong id="analyticsOrderInsight"></strong>
                        <p>Orders currently waiting for completion.</p>
                    </div>
                </article>

                <article class="panel insight-card">
                    <div class="insight-icon"></div>
                    <div>
                        <span>Stock watch</span>
                        <strong id="analyticsStockInsight"></strong>
                        <p>Active inventory items at or below reorder level.</p>
                    </div>
                </article>
            </div>
        `;

        document.querySelector(".main-content").appendChild(workspace);

        document
            .getElementById("analyticsRefreshButton")
            .addEventListener("click", loadAnalytics);
    }

    function formatCurrency(value) {
        const amount = Number(value || 0);

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(amount);
    }

    function formatNumber(value) {
        return new Intl.NumberFormat("en-US").format(Number(value || 0));
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }

    async function loadAnalytics() {
        createWorkspace();

        try {
            const response = await fetch(API, {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Analytics request failed: ${response.status}`);
            }

            const data = await response.json();

            setText("analyticsRevenue", formatCurrency(data.revenue));
            setText("analyticsOrders", formatNumber(data.orders));
            setText("analyticsAverage", formatCurrency(data.average_order_value));
            setText(
                "analyticsCompletion",
                `${Number(data.completion_rate || 0).toFixed(1)}%`,
            );

            setText("analyticsCustomers", formatNumber(data.customers));
            setText(
                "analyticsActiveCustomers",
                formatNumber(data.active_customers),
            );
            setText(
                "analyticsCompletedOrders",
                formatNumber(data.completed_orders),
            );
            setText(
                "analyticsPendingOrders",
                formatNumber(data.pending_orders),
            );

            const completion = Math.max(
                0,
                Math.min(100, Number(data.completion_rate || 0)),
            );

            setText("analyticsProgressValue", `${completion.toFixed(1)}%`);

            const progressFill = document.getElementById(
                "analyticsProgressFill",
            );

            if (progressFill) {
                progressFill.style.width = `${completion}%`;
            }

            setText(
                "analyticsInventoryItems",
                formatNumber(data.inventory_items),
            );
            setText(
                "analyticsTotalUnits",
                formatNumber(data.total_units),
            );
            setText(
                "analyticsLowStock",
                formatNumber(data.low_stock_items),
            );

            const inventoryItems = Number(data.inventory_items || 0);
            const lowStock = Number(data.low_stock_items || 0);
            const stockHealth =
                inventoryItems > 0
                    ? Math.max(0, Math.min(100, ((inventoryItems - lowStock) / inventoryItems) * 100))
                    : 100;

            const stockBar = document.getElementById("analyticsStockBar");

            if (stockBar) {
                stockBar.style.width = `${stockHealth}%`;
            }

            setText(
                "analyticsRevenueInsight",
                formatCurrency(data.revenue),
            );

            setText(
                "analyticsOrderInsight",
                `${formatNumber(data.pending_orders)} pending`,
            );

            setText(
                "analyticsStockInsight",
                `${formatNumber(data.low_stock_items)} low stock`,
            );
        } catch (error) {
            console.error("Analytics error:", error);

            if (typeof window.showToast === "function") {
                window.showToast(
                    "Analytics unavailable",
                    "Unable to load live analytics data.",
                );
            }
        }
    }

    window.createAnalyticsWorkspace = createWorkspace;
    window.loadAnalytics = loadAnalytics;

    document.addEventListener("DOMContentLoaded", () => {
        createWorkspace();
    });
})();
