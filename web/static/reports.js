"use strict";

(() => {
    let currentDays = 30;
    let currentReport = null;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function money(value) {
        return `$${Number(value || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function showReportToast(title, message) {
        if (typeof window.showToast === "function") {
            window.showToast(title, message);
            return;
        }

        const toastTitle = document.getElementById("toastTitle");
        const toastMessage = document.getElementById("toastMessage");
        const toast = document.getElementById("toast");

        if (!toast || !toastTitle || !toastMessage) {
            return;
        }

        toastTitle.textContent = title;
        toastMessage.textContent = message;
        toast.classList.add("visible");

        window.clearTimeout(window.__opsflowReportToast);

        window.__opsflowReportToast = window.setTimeout(() => {
            toast.classList.remove("visible");
        }, 3200);
    }

    function renderReportView() {
        let container = document.getElementById("reportsView");

        if (!container) {
            container = document.createElement("section");
            container.id = "reportsView";
            container.className = "workspace-view";

            const dashboard = document.getElementById("dashboard");

            if (dashboard) {
                dashboard.insertAdjacentElement("afterend", container);
            }
        }

        container.innerHTML = `
            <div class="page-heading reports-heading">
                <div>
                    <span class="eyebrow">Business intelligence</span>
                    <h1>Reports</h1>
                    <p>Turn live operational data into a clear performance report.</p>
                </div>

                <div class="heading-actions">
                    <select class="reports-period" id="reportsPeriod" aria-label="Report period">
                        <option value="7">Last 7 days</option>
                        <option value="30" selected>Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last 365 days</option>
                    </select>

                    <button class="button button-secondary" id="reportsRefresh">
                        Refresh
                    </button>

                    <button class="button button-primary" id="reportsExport">
                        Export CSV
                    </button>
                </div>
            </div>

            <div id="reportsContent">
                <div class="reports-loading">
                    Loading live business report...
                </div>
            </div>
        `;

        document
            .getElementById("reportsPeriod")
            ?.addEventListener("change", (event) => {
                currentDays = Number(event.target.value);
                loadReports();
            });

        document
            .getElementById("reportsRefresh")
            ?.addEventListener("click", loadReports);

        document
            .getElementById("reportsExport")
            ?.addEventListener("click", exportReportCsv);
    }

    async function loadReports() {
        const content = document.getElementById("reportsContent");

        if (!content) {
            return;
        }

        content.innerHTML = `
            <div class="reports-loading">
                Refreshing live business report...
            </div>
        `;

        try {
            const response = await fetch(
                `/api/v1/reports/business-performance?days=${currentDays}`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Report request failed: ${response.status}`);
            }

            currentReport = await response.json();
            renderReport(currentReport);
        } catch (error) {
            console.error("Failed to load report:", error);

            content.innerHTML = `
                <div class="reports-error">
                    <strong>Unable to load report</strong>
                    <span>Check that the API is running and try again.</span>
                    <button class="button button-secondary" id="reportsRetry">
                        Retry
                    </button>
                </div>
            `;

            document
                .getElementById("reportsRetry")
                ?.addEventListener("click", loadReports);
        }
    }

    function renderReport(report) {
        const content = document.getElementById("reportsContent");

        if (!content) {
            return;
        }

        const financial = report.financial;
        const orders = report.orders;
        const customers = report.customers;
        const inventory = report.inventory;
        const tasks = report.tasks;

        content.innerHTML = `
            <div class="reports-meta">
                <div>
                    <span class="eyebrow">Reporting period</span>
                    <strong>${escapeHtml(report.period_start)}  ${escapeHtml(report.period_end)}</strong>
                </div>

                <span class="reports-live">
                    <span class="live-dot"></span>
                    Live database data
                </span>
            </div>

            <section class="reports-kpi-grid">
                <article class="analytics-kpi-card">
                    <span>Revenue</span>
                    <strong>${money(financial.revenue)}</strong>
                    <small>${report.period_days}-day reporting period</small>
                </article>

                <article class="analytics-kpi-card">
                    <span>Orders</span>
                    <strong>${Number(orders.total).toLocaleString()}</strong>
                    <small>${orders.completed} completed  ${orders.pending} pending</small>
                </article>

                <article class="analytics-kpi-card">
                    <span>Customers</span>
                    <strong>${Number(customers.total).toLocaleString()}</strong>
                    <small>${customers.active} active customers</small>
                </article>

                <article class="analytics-kpi-card">
                    <span>Tasks</span>
                    <strong>${Number(tasks.total).toLocaleString()}</strong>
                    <small>${tasks.completed} completed  ${tasks.overdue} overdue</small>
                </article>
            </section>

            <div class="reports-grid">
                <section class="panel reports-panel">
                    <div class="panel-heading">
                        <div>
                            <span class="eyebrow">Financial performance</span>
                            <h2>Revenue & order efficiency</h2>
                        </div>
                    </div>

                    <div class="reports-stat-list">
                        <div>
                            <span>Revenue</span>
                            <strong>${money(financial.revenue)}</strong>
                        </div>

                        <div>
                            <span>Average order value</span>
                            <strong>${money(financial.average_order_value)}</strong>
                        </div>

                        <div>
                            <span>Order completion</span>
                            <strong>${orders.completion_rate}%</strong>
                        </div>

                        <div>
                            <span>Pending orders</span>
                            <strong>${orders.pending}</strong>
                        </div>
                    </div>
                </section>

                <section class="panel reports-panel">
                    <div class="panel-heading">
                        <div>
                            <span class="eyebrow">Inventory health</span>
                            <h2>Stock position</h2>
                        </div>
                    </div>

                    <div class="reports-stat-list">
                        <div>
                            <span>Tracked items</span>
                            <strong>${Number(inventory.items || 0).toLocaleString()}</strong>
                        </div>

                        <div>
                            <span>Units in stock</span>
                            <strong>${Number(inventory.total_units || 0).toLocaleString()}</strong>
                        </div>

                        <div>
                            <span>Low stock items</span>
                            <strong>${Number(inventory.low_stock || 0).toLocaleString()}</strong>
                        </div>

                        <div>
                            <span>Stock value</span>
                            <strong>${money(inventory.stock_value)}</strong>
                        </div>
                    </div>
                </section>

                <section class="panel reports-panel">
                    <div class="panel-heading">
                        <div>
                            <span class="eyebrow">Operational workload</span>
                            <h2>Task performance</h2>
                        </div>
                    </div>

                    <div class="reports-stat-list">
                        <div>
                            <span>Total tasks</span>
                            <strong>${Number(tasks.total || 0).toLocaleString()}</strong>
                        </div>

                        <div>
                            <span>Completed</span>
                            <strong>${Number(tasks.completed || 0).toLocaleString()}</strong>
                        </div>

                        <div>
                            <span>Completion rate</span>
                            <strong>${tasks.completion_rate}%</strong>
                        </div>

                        <div>
                            <span>Overdue</span>
                            <strong>${Number(tasks.overdue || 0).toLocaleString()}</strong>
                        </div>
                    </div>
                </section>

                <section class="panel reports-panel">
                    <div class="panel-heading">
                        <div>
                            <span class="eyebrow">Executive signal</span>
                            <h2>Report summary</h2>
                        </div>
                    </div>

                    <div class="report-signal">
                        <div class="signal-row">
                            <span>Revenue signal</span>
                            <strong>${money(financial.revenue)}</strong>
                        </div>

                        <div class="signal-row">
                            <span>Customer base</span>
                            <strong>${customers.active} active</strong>
                        </div>

                        <div class="signal-row">
                            <span>Inventory watch</span>
                            <strong>${inventory.low_stock} low stock</strong>
                        </div>

                        <div class="signal-row">
                            <span>Workload watch</span>
                            <strong>${tasks.overdue} overdue</strong>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    function exportReportCsv() {
        if (!currentReport) {
            showReportToast(
                "Report unavailable",
                "Load the report before exporting it.",
            );
            return;
        }

        const report = currentReport;

        const rows = [
            ["OpsFlow Business Performance Report"],
            ["Period", `${report.period_start} to ${report.period_end}`],
            [],
            ["Category", "Metric", "Value"],
            ["Financial", "Revenue", report.financial.revenue],
            [
                "Financial",
                "Average order value",
                report.financial.average_order_value,
            ],
            ["Orders", "Total", report.orders.total],
            ["Orders", "Completed", report.orders.completed],
            ["Orders", "Pending", report.orders.pending],
            ["Orders", "Completion rate", `${report.orders.completion_rate}%`],
            ["Customers", "Total", report.customers.total],
            ["Customers", "Active", report.customers.active],
            ["Inventory", "Tracked items", report.inventory.items],
            ["Inventory", "Units in stock", report.inventory.total_units],
            ["Inventory", "Low stock", report.inventory.low_stock],
            ["Inventory", "Stock value", report.inventory.stock_value],
            ["Tasks", "Total", report.tasks.total],
            ["Tasks", "Completed", report.tasks.completed],
            ["Tasks", "Overdue", report.tasks.overdue],
            ["Tasks", "Completion rate", `${report.tasks.completion_rate}%`],
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((value) => {
                        const text = String(value ?? "");
                        return `"${text.replaceAll('"', '""')}"`;
                    })
                    .join(","),
            )
            .join("\r\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `opsflow-business-report-${report.period_end}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        showReportToast(
            "Report exported",
            "The live business performance report was exported as CSV.",
        );
    }

    window.loadReports = async () => {
        renderReportView();
        await loadReports();
    };

    window.generateReport = async () => {
        setTimeout(async () => {
            if (typeof window.setActiveView === "function") {
                window.setActiveView("reports");
            }

            await window.loadReports();
        }, 0);
    };

    window.exportBusinessReport = async () => {
        if (!document.getElementById("reportsView")) {
            renderReportView();
        }

        if (!currentReport) {
            await loadReports();
        }

        exportReportCsv();
    };
})();
