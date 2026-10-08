const TASK_API = "/api/v1/tasks";

let editingTaskId = null;
let taskItems = [];
let taskSearchTerm = "";
let taskStatusFilter = "";
let taskPriorityFilter = "";

function taskEscapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function taskFormatDate(value) {
    if (!value) return "No date";
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function taskStatusLabel(status) {
    return String(status || "todo")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function taskPriorityLabel(priority) {
    return String(priority || "medium")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function taskNotify(message) {
    if (typeof window.showToast === "function") {
        window.showToast("Tasks", message);
    }
}

function renderTasksView() {
    if (document.getElementById("tasksView")) {
        return;
    }

    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    const view = document.createElement("section");
    view.id = "tasksView";
    view.className = "workspace-view";
    view.innerHTML = `
        <div class="workspace-header">
            <div>
                <span class="eyebrow">OPERATIONS</span>
                <h1>Tasks</h1>
                <p>Track and manage operational work across the business.</p>
            </div>
            <div class="workspace-header-actions">
                <button class="button secondary" type="button" id="refreshTasksButton">
                    Refresh
                </button>
                <button class="button primary" type="button" id="newTaskButton">
                    + New Task
                </button>
            </div>
        </div>

        <div class="kpi-grid">
            <article class="kpi-card">
                <div class="kpi-top">
                    <span>Total tasks</span>
                    <span class="kpi-icon"></span>
                </div>
                <strong class="kpi-value" id="tasksTotalKpi"></strong>
                <div class="kpi-meta">
                    <span>All operational work</span>
                </div>
            </article>

            <article class="kpi-card">
                <div class="kpi-top">
                    <span>To do</span>
                    <span class="kpi-icon"></span>
                </div>
                <strong class="kpi-value" id="tasksTodoKpi"></strong>
                <div class="kpi-meta">
                    <span>Awaiting action</span>
                </div>
            </article>

            <article class="kpi-card">
                <div class="kpi-top">
                    <span>In progress</span>
                    <span class="kpi-icon"></span>
                </div>
                <strong class="kpi-value" id="tasksProgressKpi"></strong>
                <div class="kpi-meta">
                    <span>Currently active</span>
                </div>
            </article>

            <article class="kpi-card">
                <div class="kpi-top">
                    <span>Completed</span>
                    <span class="kpi-icon"></span>
                </div>
                <strong class="kpi-value" id="tasksCompletedKpi"></strong>
                <div class="kpi-meta">
                    <span id="tasksCompletionMeta">Live completion</span>
                </div>
            </article>
        </div>

        <div class="workspace-panel">
            <div class="workspace-toolbar">
                <input
                    id="taskSearchInput"
                    class="search-input"
                    type="search"
                    placeholder="Search tasks..."
                    autocomplete="off"
                >

                <select id="taskStatusFilter" class="filter-select">
                    <option value="">All statuses</option>
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                </select>

                <select id="taskPriorityFilter" class="filter-select">
                    <option value="">All priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </div>

            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Priority</th>
                            <th>Assignee</th>
                            <th>Due date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tasksTableBody">
                        <tr>
                            <td colspan="6" class="empty-state">Loading tasks...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="modal-overlay" id="taskModal" hidden>
            <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="taskModalTitle">
                <div class="modal-header">
                    <div>
                        <span class="eyebrow">TASK MANAGEMENT</span>
                        <h2 id="taskModalTitle">New task</h2>
                    </div>
                    <button
                        class="modal-close"
                        type="button"
                        id="closeTaskModalButton"
                        aria-label="Close task form"
                    >&times;</button>
                </div>

                <form id="taskForm">
                    <label>
                        Title
                        <input
                            id="taskTitle"
                            type="text"
                            maxlength="200"
                            required
                            placeholder="Enter task title"
                        >
                    </label>

                    <label>
                        Description
                        <textarea
                            id="taskDescription"
                            maxlength="5000"
                            placeholder="Describe the operational work..."
                        ></textarea>
                    </label>

                    <div class="form-grid">
                        <label>
                            Priority
                            <select id="taskPriority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </label>

                        <label>
                            Assignee
                            <input
                                id="taskAssignee"
                                type="text"
                                maxlength="120"
                                placeholder="Team or person"
                            >
                        </label>
                    </div>

                    <label>
                        Due date
                        <input id="taskDueDate" type="date">
                    </label>

                    <div class="modal-actions">
                        <button class="button secondary" type="button" id="cancelTaskButton">
                            Cancel
                        </button>
                        <button class="button primary" type="submit">
                            Save Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    dashboard.insertAdjacentElement("afterend", view);

    document
        .getElementById("newTaskButton")
        .addEventListener("click", () => openTaskModal());

    document
        .getElementById("refreshTasksButton")
        .addEventListener("click", () => loadTasks());

    document
        .getElementById("closeTaskModalButton")
        .addEventListener("click", closeTaskModal);

    document
        .getElementById("cancelTaskButton")
        .addEventListener("click", closeTaskModal);

    document
        .getElementById("taskForm")
        .addEventListener("submit", saveTask);

    document
        .getElementById("taskSearchInput")
        .addEventListener("input", (event) => {
            taskSearchTerm = event.target.value.trim().toLowerCase();
            renderTaskRows();
        });

    document
        .getElementById("taskStatusFilter")
        .addEventListener("change", (event) => {
            taskStatusFilter = event.target.value;
            renderTaskRows();
        });

    document
        .getElementById("taskPriorityFilter")
        .addEventListener("change", (event) => {
            taskPriorityFilter = event.target.value;
            renderTaskRows();
        });

    view.addEventListener("click", (event) => {
        const action = event.target.closest("[data-task-action]");
        if (!action) return;

        const taskId = Number(action.dataset.taskId);
        const taskAction = action.dataset.taskAction;

        if (taskAction === "edit") {
            openTaskModal(taskId);
        } else if (taskAction === "delete") {
            deleteTask(taskId);
        }
    });

    view.addEventListener("change", async (event) => {
        const select = event.target.closest("[data-task-status]");
        if (!select) return;

        await updateTaskStatus(Number(select.dataset.taskId), select.value);
    });

    document.getElementById("taskModal").addEventListener("click", (event) => {
        if (event.target.id === "taskModal") {
            closeTaskModal();
        }
    });
}

async function loadTaskSummary() {
    try {
        const response = await fetch(`${TASK_API}/summary`, {
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Summary request failed: ${response.status}`);
        }

        const summary = await response.json();

        document.getElementById("tasksTotalKpi").textContent =
            Number(summary.total || 0).toLocaleString();

        document.getElementById("tasksTodoKpi").textContent =
            Number(summary.todo || 0).toLocaleString();

        document.getElementById("tasksProgressKpi").textContent =
            Number(summary.in_progress || 0).toLocaleString();

        document.getElementById("tasksCompletedKpi").textContent =
            Number(summary.completed || 0).toLocaleString();

        const completionRate = summary.total
            ? Math.round((Number(summary.completed || 0) / Number(summary.total)) * 100)
            : 0;

        document.getElementById("tasksCompletionMeta").textContent =
            `${completionRate}% completion`;
    } catch (error) {
        console.error("Task summary error:", error);
    }
}

async function loadTasks() {
    renderTasksView();

    const body = document.getElementById("tasksTableBody");
    if (!body) return;

    body.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">Loading tasks...</td>
        </tr>
    `;

    try {
        const params = new URLSearchParams({
            limit: "100",
            offset: "0",
        });

        if (taskSearchTerm) {
            params.set("search", taskSearchTerm);
        }

        if (taskStatusFilter) {
            params.set("status", taskStatusFilter);
        }

        if (taskPriorityFilter) {
            params.set("priority", taskPriorityFilter);
        }

        const response = await fetch(`${TASK_API}?${params.toString()}`, {
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Tasks request failed: ${response.status}`);
        }

        const data = await response.json();
        taskItems = Array.isArray(data.items) ? data.items : [];

        renderTaskRows();
        await loadTaskSummary();
    } catch (error) {
        console.error("Task load error:", error);
        body.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    Unable to load tasks. Check the API connection and try again.
                </td>
            </tr>
        `;
    }
}

function renderTaskRows() {
    const body = document.getElementById("tasksTableBody");
    if (!body) return;

    const filteredTasks = taskItems.filter((task) => {
        const searchText = [
            task.title,
            task.description,
            task.assignee,
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !taskSearchTerm || searchText.includes(taskSearchTerm);

        const matchesStatus =
            !taskStatusFilter || task.status === taskStatusFilter;

        const matchesPriority =
            !taskPriorityFilter || task.priority === taskPriorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (!filteredTasks.length) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No tasks match the current filters.
                </td>
            </tr>
        `;
        return;
    }

    body.innerHTML = filteredTasks
        .map((task) => {
            const priority = String(task.priority || "medium").toLowerCase();

            return `
                <tr>
                    <td>
                        <div class="table-primary">
                            ${taskEscapeHtml(task.title)}
                        </div>
                        ${
                            task.description
                                ? `<div class="table-secondary">${taskEscapeHtml(task.description)}</div>`
                                : ""
                        }
                    </td>

                    <td>
                        <span class="status-pill priority-${taskEscapeHtml(priority)}">
                            ${taskEscapeHtml(taskPriorityLabel(priority))}
                        </span>
                    </td>

                    <td>
                        ${taskEscapeHtml(task.assignee || "Unassigned")}
                    </td>

                    <td>
                        ${taskEscapeHtml(taskFormatDate(task.due_date))}
                    </td>

                    <td>
                        <select
                            class="inline-status"
                            data-task-status
                            data-task-id="${Number(task.id)}"
                            aria-label="Change task status"
                        >
                            <option value="todo" ${task.status === "todo" ? "selected" : ""}>
                                To do
                            </option>
                            <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>
                                In progress
                            </option>
                            <option value="blocked" ${task.status === "blocked" ? "selected" : ""}>
                                Blocked
                            </option>
                            <option value="completed" ${task.status === "completed" ? "selected" : ""}>
                                Completed
                            </option>
                        </select>
                    </td>

                    <td>
                        <div class="row-actions">
                            <button
                                class="table-action"
                                type="button"
                                data-task-action="edit"
                                data-task-id="${Number(task.id)}"
                            >
                                Edit
                            </button>
                            <button
                                class="table-action danger"
                                type="button"
                                data-task-action="delete"
                                data-task-id="${Number(task.id)}"
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById("taskModal");
    const form = document.getElementById("taskForm");

    if (!modal || !form) return;

    editingTaskId = taskId;
    form.reset();

    if (taskId) {
        const task = taskItems.find((item) => Number(item.id) === Number(taskId));

        if (!task) return;

        document.getElementById("taskModalTitle").textContent = "Edit task";
        document.getElementById("taskTitle").value = task.title || "";
        document.getElementById("taskDescription").value = task.description || "";
        document.getElementById("taskPriority").value = task.priority || "medium";
        document.getElementById("taskAssignee").value = task.assignee || "";
        document.getElementById("taskDueDate").value = task.due_date || "";
    } else {
        document.getElementById("taskModalTitle").textContent = "New task";
        document.getElementById("taskPriority").value = "medium";
    }

    modal.hidden = false;
    modal.style.display = "flex";
    document.getElementById("taskTitle").focus();
}

function closeTaskModal() {
    const modal = document.getElementById("taskModal");
    const form = document.getElementById("taskForm");

    if (!modal) return;

    modal.hidden = true;
    modal.style.display = "none";
    editingTaskId = null;

    if (form) {
        form.reset();
    }
}

async function saveTask(event) {
    event.preventDefault();

    const form = document.getElementById("taskForm");
    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton.disabled) {
        return;
    }

    const wasEditing = Boolean(editingTaskId);

    const payload = {
        title: document.getElementById("taskTitle").value.trim(),
        description:
            document.getElementById("taskDescription").value.trim() || null,
        priority: document.getElementById("taskPriority").value,
        assignee:
            document.getElementById("taskAssignee").value.trim() || null,
        due_date:
            document.getElementById("taskDueDate").value || null,
    };

    const url = editingTaskId
        ? `${TASK_API}/${editingTaskId}`
        : TASK_API;

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
        const response = await fetch(url, {
            method: wasEditing ? "PATCH" : "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Task save response:", errorBody);
            taskNotify("Unable to save task.");
            return;
        }

        closeTaskModal();
        await loadTasks();

        taskNotify(
            wasEditing ? "Task updated." : "Task created.",
        );
    } catch (error) {
        console.error("Task save error:", error);
        taskNotify("Unable to save task.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Save Task";
    }
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${TASK_API}/${taskId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                status: newStatus,
            }),
        });

        if (!response.ok) {
            throw new Error(`Status update failed: ${response.status}`);
        }

        const updatedTask = await response.json();

        const index = taskItems.findIndex(
            (task) => Number(task.id) === Number(taskId),
        );

        if (index !== -1) {
            taskItems[index] = updatedTask;
        }

        renderTaskRows();
        await loadTaskSummary();

        taskNotify(`Task moved to ${taskStatusLabel(newStatus)}.`);
    } catch (error) {
        console.error("Task status update error:", error);
        taskNotify("Unable to update task status.");
        await loadTasks();
    }
}

async function deleteTask(taskId) {
    const task = taskItems.find(
        (item) => Number(item.id) === Number(taskId),
    );

    const title = task?.title || "this task";

    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${TASK_API}/${taskId}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
        }

        await loadTasks();
        taskNotify("Task deleted.");
    } catch (error) {
        console.error("Task delete error:", error);
        taskNotify("Unable to delete task.");
    }
}

window.loadTasks = loadTasks;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.saveTask = saveTask;
window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;
