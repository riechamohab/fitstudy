// Global variables
let currentUser = null;
let authToken = null;
let currentPage = 'login';
let timerInterval = null;
let selectedExercise = null;
let currentWeekOffset = 0;

// TEACHER DASHBOARD CACHE TEST - NEW VERSION 202603220300
console.log('=== SCRIPT.JS LOADED - NEW VERSION ===');
alert('NEW VERSION LOADED! If you see this, cache is cleared!');

// API Base URL
const API_BASE = 'http://localhost:3001/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    checkAuthStatus();
    loadMotivationMessage();
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Navigation - Use sidebar navigation
    const sidebarLinks = document.querySelectorAll('.nav-item[data-page]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUser) {
                navigateToPage(this.dataset.page);
            }
        });
    });

  // Sign Out button
const signOutBtn = document.getElementById('signOutBtn');

if (signOutBtn) {
    signOutBtn.addEventListener('click', signOut);
}
    // Tasks - Check if elements exist before adding listeners
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) addTaskBtn.addEventListener('click', openTaskModal);
    
    const taskForm = document.getElementById('taskForm');
    if (taskForm) taskForm.addEventListener('submit', handleTaskSubmit);
    
    const taskModalClose = document.querySelector('#taskModal .close');
    if (taskModalClose) taskModalClose.addEventListener('click', closeTaskModal);
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', loadTasks);
    
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) priorityFilter.addEventListener('change', loadTasks);

    // Calendar - Check if elements exist
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => changeWeek(1));

    // Exercises - Check if elements exist
    const startTimerBtn = document.getElementById('startTimerBtn');
    if (startTimerBtn) startTimerBtn.addEventListener('click', startTimer);
    
    const pauseTimerBtn = document.getElementById('pauseTimerBtn');
    if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pauseTimer);
    
    const stopTimerBtn = document.getElementById('stopTimerBtn');
    if (stopTimerBtn) stopTimerBtn.addEventListener('click', stopTimer);
    
    const getMotivationBtn = document.getElementById('getMotivationBtn');
    if (getMotivationBtn) getMotivationBtn.addEventListener('click', loadMotivationMessage);

    // Wellness - Emoji selectors
    const stressEmojiGrid = document.getElementById('stressEmojiGrid');
    if (stressEmojiGrid) {
        const stressOptions = stressEmojiGrid.querySelectorAll('.emoji-option');
        stressOptions.forEach(option => {
            option.addEventListener('click', function() {
                stressOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                const stressLevel = document.getElementById('stressLevel');
                if (stressLevel) stressLevel.value = this.dataset.value;
            });
        });
    }
    
    const focusEmojiGrid = document.getElementById('focusEmojiGrid');
    if (focusEmojiGrid) {
        const focusOptions = focusEmojiGrid.querySelectorAll('.emoji-option');
        focusOptions.forEach(option => {
            option.addEventListener('click', function() {
                focusOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                const focusLevel = document.getElementById('focusLevel');
                if (focusLevel) focusLevel.value = this.dataset.value;
            });
        });
    }
    
    const wellnessForm = document.getElementById('wellnessForm');
    if (wellnessForm) wellnessForm.addEventListener('submit', handleWellnessSubmit);

    // Profile forms
    const profileForm = document.getElementById('profileForm');
    if (profileForm) profileForm.addEventListener('submit', handleProfileSubmit);
    
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) passwordForm.addEventListener('submit', handlePasswordSubmit);

    // Modal close on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Page data loading for SPA
function loadPageData(page) {
    if (!currentUser || !authToken) return;
    
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'exercises':
            loadExercises();
            break;
        case 'wellness':
            loadWellness();
            break;
        case 'progress':
            loadProgress();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'teacher':
            if (currentUser.role === 'TEACHER' || currentUser.role === 'COUNSELOR') {
                loadTeacherData();
            }
            break;
    }
}

// Authentication
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateUIForAuthenticatedUser();
        navigateToPage('dashboard');
    }
}

function updateUIForAuthenticatedUser() {
    // Update user name if elements exist
    const userName = document.getElementById('userName');
    if (userName) userName.textContent = currentUser.name;
    
    const dashboardUserName = document.getElementById('dashboardUserName');
    if (dashboardUserName) dashboardUserName.textContent = currentUser.name;
    
    // Update sidebar user info
    updateSidebarUserInfo();
    
    // Show logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    // Show teacher-only elements if user is teacher/counselor
    if (currentUser.role === 'TEACHER' || currentUser.role === 'COUNSELOR') {
        const teacherOnlyElements = document.querySelectorAll('.teacher-only');
        teacherOnlyElements.forEach(el => el.style.display = 'block');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Attempting login with:', email);
    console.log('API_BASE:', API_BASE);
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForAuthenticatedUser();
            navigateToPage('dashboard');
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForAuthenticatedUser();
            navigateToPage('dashboard');
            showNotification('Registration successful!', 'success');
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    
    document.getElementById('userName').textContent = 'Guest';
    document.getElementById('logoutBtn').style.display = 'none';
    document.querySelector('.teacher-only').style.display = 'none';
    
    navigateToPage('login');
    showNotification('Logged out successfully', 'info');
}

// Navigation
function navigateToPage(pageName) {
    // Use the new SPA navigation
    if (typeof loadPageContent === 'function') {
        loadPageContent(pageName);
    } else {
        // Fallback to old method
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.getElementById(`${pageName}Page`).classList.add('active');
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    }
    
    currentPage = pageName;
    
    // Load page-specific data
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'exercises':
            loadExercises();
            break;
        case 'wellness':
            loadWellness();
            break;
        case 'progress':
            loadProgress();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'teacher':
            if (currentUser.role === 'TEACHER' || currentUser.role === 'COUNSELOR') {
                loadTeacherDashboard();
            }
            break;
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Form`).classList.add('active');
}

// Dashboard
async function loadDashboard() {
    try {
        // Get tasks for dashboard data
        const response = await fetch(`${API_BASE}/tasks`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const tasks = await response.json();
        
        // Calculate overview stats
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        const today = tasks.filter(t => {
            if (!t.deadline) return false;
            const deadline = new Date(t.deadline);
            const todayDate = new Date();
            return deadline.toDateString() === todayDate.toDateString();
        }).length;
        const total = tasks.length;
        const completionRate = total > 0 ? (completed / total * 100).toFixed(1) : 0;
        
        // Update dashboard stats
        const totalTasksEl = document.getElementById('totalTasks');
        if (totalTasksEl) totalTasksEl.textContent = total;
        
        const completedTasksEl = document.getElementById('completedTasks');
        if (completedTasksEl) completedTasksEl.textContent = completed;
        
        const todayTasksEl = document.getElementById('todayTasks');
        if (todayTasksEl) todayTasksEl.textContent = today;
        
        const completionRateEl = document.getElementById('completionRate');
        if (completionRateEl) completionRateEl.textContent = `${completionRate}%`;
        
        // Load recent tasks
        const recentTasksList = document.getElementById('recentTasksList');
        if (recentTasksList) {
            recentTasksList.innerHTML = '';
            
            tasks.slice(0, 5).forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = 'task-item';
                taskEl.innerHTML = `
                    <div class="task-info">
                        <h4>${task.title}</h4>
                        <div class="task-meta">
                            <span class="status">${task.status}</span>
                            <span class="priority">${task.priority}</span>
                        </div>
                    </div>
                `;
                recentTasksList.appendChild(taskEl);
            });
        }
        
        // Load motivation message
        loadMotivationMessage();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadMotivationMessage() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/progress/motivation`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        document.getElementById('motivationMessage').textContent = data.message;
    } catch (error) {
        console.error('Error loading motivation:', error);
        document.getElementById('motivationMessage').textContent = 'Stay positive and keep working towards your goals!';
    }
}

// Tasks
async function loadTasks() {
    try {
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        
        let url = `${API_BASE}/tasks`;
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const tasks = await response.json();
        
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            taskEl.innerHTML = `
                <div class="task-info">
                    <h4>${task.title}</h4>
                    <p>${task.description || ''}</p>
                    <div class="task-meta">
                        <span class="status ${task.status}">${task.status}</span>
                        <span class="priority ${task.priority}">${task.priority}</span>
                        ${task.deadline ? `<span>Due: ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-secondary" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            `;
            tasksList.appendChild(taskEl);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function openTaskModal() {
    console.log('openTaskModal called');
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    
    console.log('Modal element:', modal);
    console.log('Form element:', form);
    
    // Reset form and clear any edit data
    form.reset();
    delete form.dataset.taskId;
    delete form.dataset.isEdit;
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    
    modal.style.display = 'block';
    console.log('Modal display set to block, current display:', modal.style.display);
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    
    // Reset form and clear any edit data
    form.reset();
    delete form.dataset.taskId;
    delete form.dataset.isEdit;
    
    modal.style.display = 'none';
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    
    const taskForm = document.getElementById('taskForm');
    const taskId = taskForm.dataset.taskId;
    const isEdit = taskForm.dataset.isEdit === 'true';
    
    try {
        let response;
        
        if (isEdit && taskId) {
            // Update existing task
            response = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, description, deadline, priority, status })
            });
        } else {
            // Create new task
            response = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, description, deadline, priority, status })
            });
        }
        
        if (response.ok) {
            closeTaskModal();
            loadTasks();
            loadCalendar(); // Refresh calendar if open
            showNotification(isEdit ? 'Task updated successfully!' : 'Task created successfully!', 'success');
            
            // Reset form data
            delete taskForm.dataset.taskId;
            delete taskForm.dataset.isEdit;
        } else {
            const data = await response.json();
            showNotification(data.error || `Failed to ${isEdit ? 'update' : 'create'} task`, 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

async function editTask(taskId) {
    console.log('editTask called with ID:', taskId);
    try {
        // Fetch the task data
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            console.error('Failed to fetch task details');
            showNotification('Failed to fetch task details', 'error');
            return;
        }
        
        const task = await response.json();
        console.log('Task data received:', task);
        
        // Open the task modal
        console.log('Opening task modal...');
        openTaskModal();
        console.log('Task modal opened, display style:', document.getElementById('taskModal').style.display);
        
        // Populate the form with task data
        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskDeadline').value = task.deadline ? 
            new Date(task.deadline).toISOString().slice(0, 16) : '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        
        // Store task ID for update
        const taskForm = document.getElementById('taskForm');
        taskForm.dataset.taskId = taskId;
        taskForm.dataset.isEdit = 'true';
        
        console.log('Form populated and ready for editing');
        
    } catch (error) {
        console.error('Error editing task:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadTasks();
            showNotification('Task deleted successfully!', 'success');
        } else {
            showNotification('Failed to delete task', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

// Task details modal for calendar
function showTaskDetails(task) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('taskDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'taskDetailsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeTaskDetailsModal()">&times;</span>
                <h3 id="taskDetailsTitle"></h3>
                <div id="taskDetailsBody"></div>
                <div class="modal-actions">
                    <button id="editTaskBtn" class="btn btn-primary">Edit Task</button>
                    <button id="deleteTaskBtn" class="btn btn-danger">Delete Task</button>
                    <button id="closeTaskDetailsBtn" class="btn btn-secondary" onclick="closeTaskDetailsModal()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Populate modal with task details
    document.getElementById('taskDetailsTitle').textContent = task.title;
    
    const priorityColors = {
        'LOW': '#10b981',
        'MEDIUM': '#f59e0b', 
        'HIGH': '#ef4444',
        'URGENT': '#dc2626'
    };
    
    const statusColors = {
        'PENDING': '#6b7280',
        'IN_PROGRESS': '#3b82f6',
        'COMPLETED': '#10b981',
        'OVERDUE': '#ef4444'
    };
    
    document.getElementById('taskDetailsBody').innerHTML = `
        <div class="task-detail-item">
            <strong>Description:</strong>
            <p>${task.description || 'No description provided'}</p>
        </div>
        <div class="task-detail-item">
            <strong>Status:</strong>
            <span class="status-badge" style="background: ${statusColors[task.status]}; color: white;">
                ${task.status.replace('_', ' ')}
            </span>
        </div>
        <div class="task-detail-item">
            <strong>Priority:</strong>
            <span class="priority-badge" style="background: ${priorityColors[task.priority]}; color: white;">
                ${task.priority}
            </span>
        </div>
        <div class="task-detail-item">
            <strong>Deadline:</strong>
            <p>${task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline set'}</p>
        </div>
        <div class="task-detail-item">
            <strong>Created:</strong>
            <p>${new Date(task.createdAt).toLocaleString()}</p>
        </div>
        <div class="task-detail-item">
            <strong>Last Updated:</strong>
            <p>${new Date(task.updatedAt).toLocaleString()}</p>
        </div>
    `;
    
    // Add event listeners for action buttons
    document.getElementById('editTaskBtn').onclick = () => {
        console.log('Edit button clicked, task ID:', task.id);
        closeTaskDetailsModal();
        // Use the existing editTask function
        editTask(task.id);
    };
    
    document.getElementById('deleteTaskBtn').onclick = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(task.id);
            closeTaskDetailsModal();
        }
    };
    
    // Show modal
    modal.style.display = 'block';
}

function closeTaskDetailsModal() {
    const modal = document.getElementById('taskDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update deleteTask function to work with ID
async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            showNotification('Task deleted successfully', 'success');
            loadCalendar(); // Refresh calendar
            loadTasks();   // Refresh tasks page if open
        } else {
            showNotification('Failed to delete task', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

// Calendar
async function loadCalendar() {
    try {
        // Get tasks instead of calendar data
        const response = await fetch(`${API_BASE}/tasks`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const tasks = await response.json();
        
        // Generate month view
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth() + currentWeekOffset, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + currentWeekOffset + 1, 1);
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const currentWeekElement = document.getElementById('currentWeek');
        if (currentWeekElement) {
            currentWeekElement.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
        }
        
        // Render month view
        const weekView = document.getElementById('weekView');
        if (weekView) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            // Create calendar header
            let calendarHTML = '<div class="calendar-header">';
            dayNames.forEach((day, index) => {
                const isWeekend = index === 0 || index === 6;
                calendarHTML += `<div class="${isWeekend ? 'weekend' : ''}">${day}</div>`;
            });
            calendarHTML += '</div>';
            
            // Create month grid
            calendarHTML += '<div class="month-grid">';
            
            // Get the first day of the month
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            // Generate 6 weeks (42 days)
            for (let week = 0; week < 6; week++) {
                for (let day = 0; day < 7; day++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + (week * 7) + day);
                    
                    const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth();
                    const isToday = currentDate.toDateString() === today.toDateString();
                    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                    
                    // Find tasks for this day
                    const dayTasks = tasks.filter(task => {
                        if (!task.deadline) return false;
                        const taskDate = new Date(task.deadline);
                        return taskDate.toDateString() === currentDate.toDateString();
                    });
                    
                    // Generate task HTML
                    let tasksHTML = '';
                    let maxTasks = 3; // Show max 3 tasks
                    dayTasks.slice(0, maxTasks).forEach(task => {
                        let priorityClass = '';
                        if (task.priority === 'HIGH' || task.priority === 'URGENT') {
                            priorityClass = 'high-priority';
                        } else if (task.priority === 'MEDIUM') {
                            priorityClass = 'medium-priority';
                        } else if (task.priority === 'LOW') {
                            priorityClass = 'low-priority';
                        }
                        tasksHTML += `<div class="calendar-task ${priorityClass}" 
                            onclick="showTaskDetails(${JSON.stringify(task).replace(/"/g, '&quot;')})" 
                            title="${task.description || task.title}">${task.title}</div>`;
                    });
                    
                    // Add "more tasks" indicator if there are more tasks
                    if (dayTasks.length > maxTasks) {
                        tasksHTML += `<div class="more-tasks">+${dayTasks.length - maxTasks} more</div>`;
                    }
                    
                    // Create day HTML
                    const dayClasses = [
                        isCurrentMonth ? '' : 'other-month',
                        isToday ? 'today' : '',
                        isWeekend ? 'weekend' : ''
                    ].filter(Boolean).join(' ');
                    
                    const dayNumber = isToday ? 
                        `<div class="day-number"><span>${currentDate.getDate()}</span><div class="today-indicator">${currentDate.getDate()}</div></div>` :
                        `<div class="day-number"><span>${currentDate.getDate()}</span></div>`;
                    
                    calendarHTML += `
                        <div class="calendar-day ${dayClasses}">
                            ${dayNumber}
                            <div class="calendar-tasks">
                                ${tasksHTML}
                            </div>
                        </div>
                    `;
                }
            }
            
            calendarHTML += '</div>';
            weekView.innerHTML = calendarHTML;
        }
        
        // Load upcoming deadlines
        loadDeadlines(tasks);
    } catch (error) {
        console.error('Error loading calendar:', error);
        // Show empty calendar on error
        const weekView = document.getElementById('weekView');
        if (weekView) {
            weekView.innerHTML = '<p>No tasks to display</p>';
        }
    }
}

function changeWeek(direction) {
    currentWeekOffset += direction;
    loadCalendar();
}

async function loadDeadlines(tasks = null) {
    try {
        // Use tasks parameter or fetch tasks
        if (!tasks) {
            const response = await fetch(`${API_BASE}/tasks`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            tasks = await response.json();
        }
        
        // Filter tasks with deadlines and sort by deadline
        const tasksWithDeadlines = tasks
            .filter(task => task.deadline)
            .map(task => ({
                ...task,
                deadlineDate: new Date(task.deadline),
                daysUntil: Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24))
            }))
            .filter(task => task.daysUntil >= 0)
            .sort((a, b) => a.daysUntil - b.daysUntil);
        
        const deadlinesList = document.getElementById('deadlinesList');
        if (deadlinesList) {
            deadlinesList.innerHTML = '';
            
            if (tasksWithDeadlines.length === 0) {
                deadlinesList.innerHTML = '<p>No upcoming deadlines</p>';
                return;
            }
            
            tasksWithDeadlines.slice(0, 10).forEach(task => {
                const deadlineEl = document.createElement('div');
                const isUrgent = task.daysUntil <= 1;
                deadlineEl.className = `deadline-item ${isUrgent ? 'urgent' : ''}`;
                deadlineEl.innerHTML = `
                    <div>
                        <div class="deadline-title">${task.title}</div>
                        <div class="deadline-date">
                            ${task.daysUntil === 0 ? 'Due today' : 
                              task.daysUntil === 1 ? 'Due tomorrow' : 
                              `Due in ${task.daysUntil} days`}
                        </div>
                    </div>
                    <div class="deadline-date">
                        ${new Date(task.deadline).toLocaleDateString()}
                    </div>
                `;
                deadlinesList.appendChild(deadlineEl);
            });
        }
    } catch (error) {
        console.error('Error loading deadlines:', error);
        const deadlinesList = document.getElementById('deadlinesList');
        if (deadlinesList) {
            deadlinesList.innerHTML = '<p>Error loading deadlines</p>';
        }
    }
}

// Exercises
async function loadExercises() {
    try {
        // Load exercise types
        const typesResponse = await fetch(`${API_BASE}/exercises/types`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const exerciseTypes = await typesResponse.json();
        
        const typesList = document.getElementById('exerciseTypesList');
        typesList.innerHTML = '<div class="exercise-grid"></div>';
        const grid = typesList.querySelector('.exercise-grid');
        
        // Exercise data with icons and descriptions
        const exerciseData = [
            {
                type: 'Pomodoro Focus',
                icon: '🍅',
                description: 'Classic 25-minute focus session with 5-minute breaks',
                duration: 1500, // 25 minutes
                difficulty: 'easy'
            },
            {
                type: 'Deep Work',
                icon: '🧘',
                description: 'Extended 50-minute concentration session',
                duration: 3000, // 50 minutes
                difficulty: 'medium'
            },
            {
                type: 'Quick Sprint',
                icon: '⚡',
                description: 'Intense 15-minute productivity burst',
                duration: 900, // 15 minutes
                difficulty: 'easy'
            },
            {
                type: 'Meditation Break',
                icon: '🧘‍♀️',
                description: '10-minute mindful breathing exercise',
                duration: 600, // 10 minutes
                difficulty: 'easy'
            },
            {
                type: 'Power Focus',
                icon: '💪',
                description: 'Challenging 35-minute deep concentration',
                duration: 2100, // 35 minutes
                difficulty: 'hard'
            },
            {
                type: 'Creative Flow',
                icon: '🎨',
                description: '45-minute creative thinking session',
                duration: 2700, // 45 minutes
                difficulty: 'medium'
            }
        ];
        
        exerciseData.forEach(exercise => {
            const exerciseEl = document.createElement('div');
            exerciseEl.className = 'exercise-card';
            exerciseEl.innerHTML = `
                <div class="exercise-icon">${exercise.icon}</div>
                <div class="exercise-title">${exercise.type}</div>
                <div class="exercise-description">${exercise.description}</div>
                <div class="exercise-meta">
                    <div class="exercise-duration">
                        <span>⏱️</span>
                        <span>${Math.floor(exercise.duration / 60)} min</span>
                    </div>
                    <div class="exercise-difficulty difficulty-${exercise.difficulty}">
                        ${exercise.difficulty}
                    </div>
                </div>
            `;
            exerciseEl.addEventListener('click', () => selectExercise(exercise, exerciseEl));
            grid.appendChild(exerciseEl);
        });
        
        // Load exercise stats
        loadExerciseStats();
    } catch (error) {
        console.error('Error loading exercises:', error);
        // Fallback to static exercises if API fails
        const typesList = document.getElementById('exerciseTypesList');
        typesList.innerHTML = '<div class="exercise-grid"></div>';
        const grid = typesList.querySelector('.exercise-grid');
        
        const fallbackExercises = [
            { type: 'Pomodoro Focus', icon: '🍅', description: 'Classic 25-minute focus session', duration: 1500, difficulty: 'easy' },
            { type: 'Deep Work', icon: '🧘', description: 'Extended 50-minute session', duration: 3000, difficulty: 'medium' },
            { type: 'Quick Sprint', icon: '⚡', description: '15-minute productivity burst', duration: 900, difficulty: 'easy' }
        ];
        
        fallbackExercises.forEach(exercise => {
            const exerciseEl = document.createElement('div');
            exerciseEl.className = 'exercise-card';
            exerciseEl.innerHTML = `
                <div class="exercise-icon">${exercise.icon}</div>
                <div class="exercise-title">${exercise.type}</div>
                <div class="exercise-description">${exercise.description}</div>
                <div class="exercise-meta">
                    <div class="exercise-duration">
                        <span>⏱️</span>
                        <span>${Math.floor(exercise.duration / 60)} min</span>
                    </div>
                    <div class="exercise-difficulty difficulty-${exercise.difficulty}">
                        ${exercise.difficulty}
                    </div>
                </div>
            `;
            exerciseEl.addEventListener('click', () => selectExercise(exercise, exerciseEl));
            grid.appendChild(exerciseEl);
        });
    }
}

function selectExercise(exercise, element) {
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    element.classList.add('selected');
    selectedExercise = exercise;
    
    document.getElementById('timerStatus').textContent = `Ready to start: ${exercise.type}`;
    document.getElementById('startTimerBtn').disabled = false;
    
    const minutes = Math.floor(exercise.duration / 60);
    const seconds = exercise.duration % 60;
    document.getElementById('timerTime').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!selectedExercise) return;
    
    let timeLeft = selectedExercise.duration;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timerTime').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            stopTimer();
            completeExercise();
        }
    }, 1000);
    
    document.getElementById('timerStatus').textContent = `Doing: ${selectedExercise.type}`;
    document.getElementById('startTimerBtn').disabled = true;
    document.getElementById('pauseTimerBtn').disabled = false;
    document.getElementById('stopTimerBtn').disabled = false;
}

function pauseTimer() {
    clearInterval(timerInterval);
    document.getElementById('timerStatus').textContent = 'Paused';
    document.getElementById('startTimerBtn').disabled = false;
    document.getElementById('pauseTimerBtn').disabled = true;
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('timerStatus').textContent = 'Stopped';
    document.getElementById('startTimerBtn').disabled = false;
    document.getElementById('pauseTimerBtn').disabled = true;
    document.getElementById('stopTimerBtn').disabled = true;
}

async function completeExercise() {
    if (!selectedExercise) return;
    
    try {
        // Start exercise
        const startResponse = await fetch(`${API_BASE}/exercises/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                type: selectedExercise.type,
                duration: selectedExercise.duration
            })
        });
        
        const exercise = await startResponse.json();
        
        // Mark as complete
        await fetch(`${API_BASE}/exercises/${exercise.id}/complete`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        document.getElementById('timerStatus').textContent = `Completed: ${selectedExercise.type}`;
        showNotification('Exercise completed! Great job!', 'success');
        
        loadExerciseStats();
    } catch (error) {
        console.error('Error completing exercise:', error);
    }
}

async function loadExerciseStats() {
    try {
        const response = await fetch(`${API_BASE}/exercises/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const stats = await response.json();
        
        document.getElementById('totalExercises').textContent = stats.total;
        document.getElementById('completedExercises').textContent = stats.completed;
        document.getElementById('exerciseMinutes').textContent = stats.totalMinutes;
    } catch (error) {
        console.error('Error loading exercise stats:', error);
    }
}

// Wellness
async function loadWellness() {
    loadWellnessStats();
    loadRecommendations();
}

async function handleWellnessSubmit(e) {
    e.preventDefault();
    
    const level = document.getElementById('stressLevel').value;
    const focus = document.getElementById('focusLevel').value;
    const notes = document.getElementById('wellnessNotes').value;
    
    console.log('Submitting wellness entry:', { level, focus, notes });
    
    try {
        const response = await fetch(`${API_BASE}/stress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ level, focus, notes })
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            showNotification('Wellness entry saved! 💚', 'success');
            
            // Reset form
            document.getElementById('wellnessNotes').value = '';
            
            // Reset emoji selections to default
            document.querySelectorAll('.emoji-option').forEach(opt => opt.classList.remove('selected'));
            
            // Set stress to default (5 - Okay)
            const stressOptions = document.querySelectorAll('#stressEmojiGrid .emoji-option');
            stressOptions.forEach(opt => {
                if (opt.dataset.value === '5') {
                    opt.classList.add('selected');
                }
            });
            document.getElementById('stressLevel').value = '5';
            
            // Set focus to default (5 - Moderate)  
            const focusOptions = document.querySelectorAll('#focusEmojiGrid .emoji-option');
            focusOptions.forEach(opt => {
                if (opt.dataset.value === '5') {
                    opt.classList.add('selected');
                }
            });
            document.getElementById('focusLevel').value = '5';
            
            // Reload stats and recommendations
            loadWellnessStats();
            loadRecommendations();
        } else {
            const data = await response.json();
            console.log('Error response:', data);
            showNotification(data.error || 'Failed to save wellness entry', 'error');
        }
    } catch (error) {
        console.error('Error saving wellness entry:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function loadWellnessStats() {
    try {
        const response = await fetch(`${API_BASE}/stress/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const stats = await response.json();
        
        document.getElementById('avgStress').textContent = stats.avgStress;
        document.getElementById('avgFocus').textContent = stats.avgFocus;
        document.getElementById('wellnessEntries').textContent = stats.totalEntries;
    } catch (error) {
        console.error('Error loading wellness stats:', error);
    }
}

async function loadRecommendations() {
    try {
        const response = await fetch(`${API_BASE}/stress/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';
        
        data.recommendations.forEach(rec => {
            const recEl = document.createElement('div');
            recEl.className = 'recommendation-item';
            recEl.textContent = rec;
            recommendationsList.appendChild(recEl);
        });
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// Progress
async function loadProgress() {
    console.log('Loading progress data...');
    try {
        const response = await fetch(`${API_BASE}/progress/progress`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('Progress response status:', response.status);
        const data = await response.json();
        console.log('Progress data:', data);
        
        // Update stats
        document.getElementById('progressTotalTasks').textContent = data.stats.total;
        document.getElementById('progressCompletedTasks').textContent = data.stats.completed;
        document.getElementById('progressCompletionRate').textContent = `${data.stats.completionRate}%`;
        
        // Load achievements and streak
        loadAchievements();
        
        // Load recent progress
        loadRecentProgress();
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

async function loadAchievements() {
    console.log('Loading achievements...');
    try {
        const response = await fetch(`${API_BASE}/progress/achievements`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('Achievements response status:', response.status);
        const data = await response.json();
        console.log('Achievements data:', data);
        
        // Update streak
        document.getElementById('currentStreak').textContent = data.currentStreak;
        
        const achievementsList = document.getElementById('achievementsList');
        achievementsList.innerHTML = '';
        
        data.achievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement-item ${achievement.earned ? '' : 'locked'}`;
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.earned ? '🏆' : '🔒'}</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            `;
            achievementsList.appendChild(achievementEl);
        });
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

async function loadRecentProgress() {
    console.log('Loading recent progress...');
    try {
        const response = await fetch(`${API_BASE}/progress/progress`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('Recent progress response status:', response.status);
        const data = await response.json();
        console.log('Recent progress data:', data);
        
        const recentProgressList = document.getElementById('recentProgressList');
        recentProgressList.innerHTML = '';
        
        if (data.recentProgress && data.recentProgress.length > 0) {
            data.recentProgress.slice(0, 10).forEach(progress => {
                const progressEl = document.createElement('div');
                progressEl.className = 'progress-item';
                progressEl.innerHTML = `
                    <div>
                        <strong>${progress.task?.title || 'Task'}</strong>
                        <div>${new Date(progress.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span class="status ${progress.completed ? 'COMPLETED' : 'PENDING'}">
                        ${progress.completed ? 'Completed' : 'In Progress'}
                    </span>
                `;
                recentProgressList.appendChild(progressEl);
            });
        } else {
            recentProgressList.innerHTML = '<p>No recent activity yet. Start completing tasks to see your progress!</p>';
        }
    } catch (error) {
        console.error('Error loading recent progress:', error);
    }
}

// Teacher Dashboard
async function loadTeacherDashboard() {
    console.log('=== TEACHER DASHBOARD LOADING ===');
    alert('Teacher dashboard loading - check console');
    
    try {
        // Load overview
        const overviewResponse = await fetch(`${API_BASE}/teacher/overview`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const overview = await overviewResponse.json();
        console.log('Teacher overview:', overview);
        
        document.getElementById('totalStudents').textContent = overview.totalStudents;
        document.getElementById('activeStudents').textContent = overview.activeStudents;
        document.getElementById('classCompletionRate').textContent = `${overview.avgCompletionRate}%`;
        
        // Load all teacher data
        console.log('Loading deadlines overview...');
        loadDeadlinesOverview();
        
        console.log('Loading behavior reports...');
        loadBehaviorReports();
        
        console.log('Loading wellness reports...');
        loadWellnessReports();
        
        // Load existing data
        loadStudents();
        loadAtRiskStudents();
        
        // Add event listeners for filters
        addTeacherEventListeners();
        
        console.log('=== TEACHER DASHBOARD LOADED ===');
    } catch (error) {
        console.error('Error loading teacher dashboard:', error);
    }
}

function addTeacherEventListeners() {
    // Deadline filters
    const deadlineFilter = document.getElementById('deadlineFilter');
    const studentFilter = document.getElementById('studentFilter');
    if (deadlineFilter) deadlineFilter.addEventListener('change', loadDeadlinesOverview);
    if (studentFilter) studentFilter.addEventListener('change', loadDeadlinesOverview);
    
    // Behavior report filters
    const periodFilter = document.getElementById('periodFilter');
    const reportTypeFilter = document.getElementById('reportTypeFilter');
    if (periodFilter) periodFilter.addEventListener('change', loadBehaviorReports);
    if (reportTypeFilter) reportTypeFilter.addEventListener('change', loadBehaviorReports);
    
    // Wellness filters
    const wellnessPeriodFilter = document.getElementById('wellnessPeriodFilter');
    const wellnessTypeFilter = document.getElementById('wellnessTypeFilter');
    if (wellnessPeriodFilter) wellnessPeriodFilter.addEventListener('change', loadWellnessReports);
    if (wellnessTypeFilter) wellnessTypeFilter.addEventListener('change', loadWellnessReports);
    
    // Student search
    const studentSearch = document.getElementById('studentSearch');
    const statusFilter = document.getElementById('statusFilter');
    if (studentSearch) studentSearch.addEventListener('input', loadStudents);
    if (statusFilter) statusFilter.addEventListener('change', loadStudents);
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/teacher/students`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const students = await response.json();
        
        const studentsTable = document.getElementById('studentsTable');
        studentsTable.innerHTML = `
            <table class="student-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Tasks</th>
                        <th>Completed</th>
                        <th>Completion Rate</th>
                        <th>Overdue</th>
                        <th>Recent Stress</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>${student.name}</td>
                            <td>${student.email}</td>
                            <td>${student._count.tasks}</td>
                            <td>${student.completedTasks}</td>
                            <td>${student.completionRate}%</td>
                            <td>${student.overdueTasks}</td>
                            <td>${student.recentStressLevel || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function loadAtRiskStudents() {
    try {
        const response = await fetch(`${API_BASE}/teacher/analytics`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        document.getElementById('atRiskCount').textContent = data.atRiskStudents.length;
        
        const atRiskList = document.getElementById('atRiskList');
        atRiskList.innerHTML = '';
        
        data.atRiskStudents.slice(0, 5).forEach(student => {
            const studentEl = document.createElement('div');
            studentEl.className = 'at-risk-item';
            studentEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${student.student.name}</strong>
                        <div style="font-size: 0.875rem; color: #6b7280;">${student.student.email}</div>
                    </div>
                    <span style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        At Risk
                    </span>
                </div>
            `;
            atRiskList.appendChild(studentEl);
        });
    } catch (error) {
        console.error('Error loading at-risk students:', error);
    }
}

// New teacher functions for deadlines and behavior reports
async function loadDeadlinesOverview() {
    console.log('Loading deadlines overview...');
    alert('Loading deadlines from database...');
    
    try {
        const deadlineFilter = document.getElementById('deadlineFilter')?.value || 'all';
        const studentFilter = document.getElementById('studentFilter')?.value || 'all';
        
        console.log('Deadline filters:', { deadlineFilter, studentFilter });
        
        // Fetch real data from API
        const response = await fetch(`${API_BASE}/teacher/deadlines?filter=${deadlineFilter}&studentId=${studentFilter}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch deadlines:', response.status);
            return;
        }
        
        const deadlines = await response.json();
        console.log('Deadlines data:', deadlines);
        alert(`Found ${deadlines.length} deadlines in database`);
        
        const deadlinesTable = document.getElementById('deadlinesTable');
        if (!deadlinesTable) {
            console.error('Deadlines table element not found!');
            alert('ERROR: Deadlines table element not found!');
            return;
        }
        
        deadlinesTable.innerHTML = '';
        
        if (deadlines.length === 0) {
            deadlinesTable.innerHTML = '<p>No deadlines found for the selected filters.</p>';
            return;
        }
        
        deadlines.forEach(deadline => {
            const deadlineEl = document.createElement('div');
            const isOverdue = deadline.deadline && new Date(deadline.deadline) < new Date() && deadline.status !== 'COMPLETED';
            const isToday = deadline.deadline && new Date(deadline.deadline).toDateString() === new Date().toDateString();
            
            deadlineEl.className = `deadline-item ${isOverdue ? 'deadline-overdue' : isToday ? 'deadline-today' : ''}`;
            deadlineEl.innerHTML = `
                <h4>${deadline.title}</h4>
                <div class="deadline-info">
                    <span class="student-name">${deadline.user?.name || 'Unknown Student'}</span>
                    <span class="due-date">${deadline.deadline ? new Date(deadline.deadline).toLocaleDateString() + ' ' + new Date(deadline.deadline).toLocaleTimeString() : 'No deadline'}</span>
                </div>
                <div style="margin-top: 0.5rem;">
                    <span style="background: ${deadline.priority === 'HIGH' ? '#ef4444' : deadline.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        ${deadline.priority || 'MEDIUM'}
                    </span>
                    <span style="background: ${deadline.status === 'COMPLETED' ? '#10b981' : deadline.status === 'IN_PROGRESS' ? '#3b82f6' : '#6b7280'}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">
                        ${deadline.status}
                    </span>
                    ${isOverdue ? '<span style="background: #dc2626; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">OVERDUE</span>' : ''}
                </div>
            `;
            deadlinesTable.appendChild(deadlineEl);
        });
        
        console.log('Deadlines loaded successfully');
        alert('Deadlines loaded successfully!');
    } catch (error) {
        console.error('Error loading deadlines:', error);
        alert('ERROR loading deadlines: ' + error.message);
    }
}

async function loadBehaviorReports() {
    console.log('Loading behavior reports...');
    try {
        const periodFilter = document.getElementById('periodFilter')?.value || '30';
        const reportTypeFilter = document.getElementById('reportTypeFilter')?.value || 'overview';
        
        console.log('Behavior report filters:', { periodFilter, reportTypeFilter });
        
        // Fetch real data from API
        const response = await fetch(`${API_BASE}/teacher/behavior-reports?period=${periodFilter}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch behavior reports:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('Behavior reports data:', data);
        
        const behaviorReports = document.getElementById('behaviorReports');
        if (!behaviorReports) {
            console.error('Behavior reports element not found!');
            return;
        }
        
        behaviorReports.innerHTML = '';
        
        // Summary stats
        const summaryEl = document.createElement('div');
        summaryEl.className = 'report-summary';
        summaryEl.innerHTML = `
            <div class="summary-stat">
                <div class="value">${data.overview.avgCompletionRate}%</div>
                <div class="label">Avg Completion Rate</div>
            </div>
            <div class="summary-stat">
                <div class="value">${data.overview.totalTasks}</div>
                <div class="label">Total Tasks</div>
            </div>
            <div class="summary-stat">
                <div class="value">${data.overview.activeStudents}</div>
                <div class="label">Active Students</div>
            </div>
            <div class="summary-stat">
                <div class="value">${data.overview.avgStudyTime}h</div>
                <div class="label">Avg Study Time</div>
            </div>
        `;
        behaviorReports.appendChild(summaryEl);
        
        // Trend chart placeholder
        const chartEl = document.createElement('div');
        chartEl.className = 'trend-chart';
        chartEl.textContent = 'Trend chart would be displayed here (requires charting library)';
        behaviorReports.appendChild(chartEl);
        
        // Individual behavior trend items
        data.trends.forEach(trend => {
            const trendEl = document.createElement('div');
            trendEl.className = 'behavior-item';
            trendEl.innerHTML = `
                <h4>Study Behavior - ${trend.date}</h4>
                <div class="behavior-info">
                    <span class="student-name">Class Average</span>
                    <span class="date-range">Completion: ${trend.completionRate}% | Study Time: ${trend.studyTime}h</span>
                </div>
            `;
            behaviorReports.appendChild(trendEl);
        });
        
        console.log('Behavior reports loaded successfully');
    } catch (error) {
        console.error('Error loading behavior reports:', error);
    }
}

async function loadWellnessReports() {
    console.log('Loading wellness reports...');
    try {
        const wellnessPeriodFilter = document.getElementById('wellnessPeriodFilter')?.value || '30';
        const wellnessTypeFilter = document.getElementById('wellnessTypeFilter')?.value || 'all';
        
        console.log('Wellness report filters:', { wellnessPeriodFilter, wellnessTypeFilter });
        
        // Fetch real data from API
        const response = await fetch(`${API_BASE}/teacher/wellness-reports?period=${wellnessPeriodFilter}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch wellness reports:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('Wellness reports data:', data);
        
        const wellnessReports = document.getElementById('wellnessReports');
        if (!wellnessReports) {
            console.error('Wellness reports element not found!');
            return;
        }
        
        wellnessReports.innerHTML = '';
        
        // Summary stats
        const summaryEl = document.createElement('div');
        summaryEl.className = 'wellness-summary';
        summaryEl.innerHTML = `
            <div class="summary-stat">
                <div class="value">${data.summary.avgStress}</div>
                <div class="label">Avg Stress (1-10)</div>
            </div>
            <div class="summary-stat">
                <div class="value">${data.summary.avgFocus}</div>
                <div class="label">Avg Focus (1-10)</div>
            </div>
            <div class="summary-stat">
                <div class="value">${data.summary.totalEntries}</div>
                <div class="label">Total Entries</div>
            </div>
            <div class="summary-stat">
                <div class="value">${data.summary.studentsAtRisk}</div>
                <div class="label">Students At Risk</div>
            </div>
        `;
        wellnessReports.appendChild(summaryEl);
        
        // Wellness trend items
        data.trends.forEach(trend => {
            const wellnessEl = document.createElement('div');
            wellnessEl.className = 'wellness-item';
            const stressLevel = trend.avgStress > 6 ? 'high' : trend.avgStress > 3 ? 'moderate' : 'low';
            wellnessEl.innerHTML = `
                <h4>Class Wellness - ${trend.date}</h4>
                <div class="wellness-info">
                    <span class="student-name">Class Average</span>
                    <span class="date-range">Stress: ${trend.avgStress}/10 | Focus: ${trend.avgFocus}/10</span>
                </div>
            `;
            wellnessReports.appendChild(wellnessEl);
        });
        
        console.log('Wellness reports loaded successfully');
    } catch (error) {
        console.error('Error loading wellness reports:', error);
    }
}

// Utilities
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let toast = document.getElementById('notificationToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'notificationToast';
        toast.className = 'notification-toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `notification-toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Profile Settings
async function loadProfile() {
    try {
        // Load current user data
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Populate form fields
            document.getElementById('profileName').value = userData.name;
            document.getElementById('profileEmail').value = userData.email;
            document.getElementById('profileRole').value = userData.role;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, email })
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            
            // Update local storage
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // Update sidebar user info
            updateSidebarUserInfo();
            
            showNotification('Profile updated successfully!', 'success');
        } else {
            const data = await response.json();
            showNotification(data.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (response.ok) {
            // Clear form
            document.getElementById('passwordForm').reset();
            showNotification('Password changed successfully!', 'success');
        } else {
            const data = await response.json();
            showNotification(data.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

// Sign out function
function signOut() {
    console.log('Sign out function called');
    
    if (confirm('Are you sure you want to sign out?')) {
        console.log('User confirmed sign out');
        
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Clear global variables
        authToken = null;
        currentUser = null;
        
        // Show notification
        showNotification('Signed out successfully', 'success');
        
        // Redirect to login page
        setTimeout(() => {
            console.log('Redirecting to login page');
            loadPageContent('login');
        }, 1000);
    } else {
        console.log('User cancelled sign out');
    }
}

// Update sidebar user info
function updateSidebarUserInfo() {
    const userInfoElement = document.getElementById('sidebarUserInfo');
    if (userInfoElement && currentUser) {
        userInfoElement.textContent = currentUser.name || 'User';
    }
}
