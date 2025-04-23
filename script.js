document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newTaskBtn = document.getElementById('new-task-btn');
    const taskModal = document.getElementById('task-modal');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const taskForm = document.getElementById('task-form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const userAvatar = document.getElementById('user-avatar');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const todoColumn = document.getElementById('todo-column');
    const inProgressColumn = document.getElementById('in-progress-column');
    const doneColumn = document.getElementById('done-column');
    
    // User state
    let currentUser = null;
    
    // Project state
    let projects = JSON.parse(localStorage.getItem('projects') || '[]');
    let currentProject = 'inbox';
    
    // View state
    let currentView = 'inbox'; // 'inbox', 'today', 'upcoming', 'team'
    
    // View Switching
    const listViewBtn = document.getElementById('list-view-btn');
    const boardViewBtn = document.getElementById('board-view-btn');
    const boardView = document.querySelector('.board-view');
    const listView = document.querySelector('.list-view');
    const listItems = document.getElementById('list-items');
    
    // Sample tasks data
    let tasks = [
        {
            id: 1,
            title: 'Complete project proposal',
            description: 'Finish the draft for the client project proposal and send for review',
            dueDate: '2023-06-15',
            priority: 'high',
            assignee: 'me',
            project: 'work',
            status: 'todo'
        },
        {
            id: 2,
            title: 'Team meeting',
            description: 'Weekly team sync to discuss project progress',
            dueDate: '2023-06-10',
            priority: 'medium',
            assignee: 'team-member-1',
            project: 'work',
            status: 'in-progress'
        },
        {
            id: 3,
            title: 'Grocery shopping',
            description: 'Buy groceries for the week',
            dueDate: '2023-06-08',
            priority: 'low',
            assignee: 'me',
            project: 'personal',
            status: 'todo'
        }
    ];
    
    // Initialize the app
    function init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUIForLoggedInUser();
        } else {
            showLoginModal();
        }
        
        // Initialize default projects if none exist
        if (projects.length === 0) {
            projects = [
                { id: 'inbox', name: 'Inbox', color: '#4a90e2' },
                { id: 'work', name: 'Work', color: '#ff6b6b' },
                { id: 'personal', name: 'Personal', color: '#4ecdc4' }
            ];
            localStorage.setItem('projects', JSON.stringify(projects));
        }
        
        renderProjects();
        setupMenuListeners();
        renderTasks();
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Modal controls
        userAvatar.addEventListener('click', () => {
            if (currentUser) {
                showUserMenu();
            } else {
                showLoginModal();
            }
        });
        
        closeBtns.forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });
        
        window.addEventListener('click', outsideClick);
        
        // Form submissions
        taskForm.addEventListener('submit', handleFormSubmit);
        loginForm.addEventListener('submit', handleLogin);
        registerForm.addEventListener('submit', handleRegister);
        
        // Navigation between login and register
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            showRegisterModal();
        });
        
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            showLoginModal();
        });
        
        // Add task buttons in columns
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (currentUser) {
                    openModal();
                } else {
                    showLoginModal();
                }
            });
        });
        
        // Project click handlers
        document.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', function() {
                const projectId = this.dataset.projectId;
                if (projectId === 'add-project') {
                    showAddProjectModal();
                } else {
                    currentProject = projectId;
                    updateActiveProject();
                    renderTasks();
                }
            });
        });
    }
    
    // Set up menu listeners
    function setupMenuListeners() {
        const menuItems = document.querySelectorAll('.menu li');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                menuItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                this.classList.add('active');
                
                // Update current view
                const view = this.textContent.trim().toLowerCase();
                switch(view) {
                    case 'inbox':
                        currentView = 'inbox';
                        break;
                    case 'today':
                        currentView = 'today';
                        break;
                    case 'upcoming':
                        currentView = 'upcoming';
                        break;
                    case 'team tasks':
                        currentView = 'team';
                        break;
                }
                
                renderTasks();
            });
        });
    }
    
    // Authentication functions
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateUIForLoggedInUser();
            closeAllModals();
        } else {
            alert('Invalid email or password');
        }
    }
    
    function handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.some(u => u.email === email)) {
            alert('Email already registered');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            password
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Log in the new user
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        updateUIForLoggedInUser();
        closeAllModals();
    }
    
    function logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIForLoggedOutUser();
        showLoginModal();
    }
    
    function updateUIForLoggedInUser() {
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        document.querySelector('.app-container').classList.remove('logged-out');
        document.querySelector('.app-container').classList.add('logged-in');
    }
    
    function updateUIForLoggedOutUser() {
        userAvatar.textContent = '👤';
        document.querySelector('.app-container').classList.remove('logged-in');
        document.querySelector('.app-container').classList.add('logged-out');
    }
    
    function showUserMenu() {
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.innerHTML = `
            <div class="user-info">
                <span>${currentUser.name}</span>
                <span>${currentUser.email}</span>
            </div>
            <button class="logout-btn">Logout</button>
        `;
        
        menu.querySelector('.logout-btn').addEventListener('click', logout);
        document.body.appendChild(menu);
        
        // Position the menu
        const avatarRect = userAvatar.getBoundingClientRect();
        menu.style.top = `${avatarRect.bottom}px`;
        menu.style.right = `${window.innerWidth - avatarRect.right}px`;
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== userAvatar) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }
    
    // Modal functions
    function showLoginModal() {
        loginModal.style.display = 'block';
    }
    
    function showRegisterModal() {
        registerModal.style.display = 'block';
    }
    
    function openModal(task = null) {
        if (task) {
            // Edit existing task
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-assignee').value = task.assignee;
            document.getElementById('task-project').value = task.project;
            
            // Store task ID in form for reference
            taskForm.dataset.taskId = task.id;
        } else {
            // Create new task - reset form
            taskForm.reset();
            delete taskForm.dataset.taskId;
            
            // Set default project to current project
            document.getElementById('task-project').value = currentProject;
        }
        
        // Update project options
        const projectSelect = document.getElementById('task-project');
        projectSelect.innerHTML = '';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
        
        // Show modal with animation
        taskModal.style.display = 'block';
        taskModal.classList.add('active');
        setTimeout(() => {
            taskModal.querySelector('.modal-content').classList.add('active');
        }, 10);
        
        // Focus on the first input
        document.getElementById('task-title').focus();
    }
    
    function closeModal() {
        const modalContent = taskModal.querySelector('.modal-content');
        modalContent.classList.remove('active');
        
        setTimeout(() => {
            taskModal.classList.remove('active');
            taskModal.style.display = 'none';
        }, 300);
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            const modalContent = modal.querySelector('.modal-content');
            modalContent.classList.remove('active');
            
            setTimeout(() => {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }, 300);
        });
    }
    
    function outsideClick(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    }
    
    // Render all tasks
    function renderTasks() {
        // Clear existing tasks
        document.querySelectorAll('.tasks-container').forEach(container => {
            container.innerHTML = '';
        });
        
        // Get current date for filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter tasks based on current view and project
        let filteredTasks = tasks.filter(task => {
            // First filter by project
            if (currentProject !== 'inbox' && task.project !== currentProject) {
                return false;
            }
            
            // Then filter by view
            switch(currentView) {
                case 'today':
                    const taskDate = new Date(task.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() === today.getTime();
                
                case 'upcoming':
                    const upcomingDate = new Date(task.dueDate);
                    upcomingDate.setHours(0, 0, 0, 0);
                    return upcomingDate > today;
                
                case 'team':
                    return task.assignee !== 'me';
                
                default: // inbox
                    return true;
            }
        });
        
        // Sort tasks by due date
        filteredTasks.sort((a, b) => {
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Render each task
        filteredTasks.forEach(task => {
            createTaskCard(task);
        });
        
        // Update task counts
        updateTaskCounts();
        
        // Update view title
        updateViewTitle();
    }
    
    function updateViewTitle() {
        const viewTitle = document.querySelector('.board-header h2');
        switch(currentView) {
            case 'today':
                viewTitle.textContent = 'Today\'s Tasks';
                break;
            case 'upcoming':
                viewTitle.textContent = 'Upcoming Tasks';
                break;
            case 'team':
                viewTitle.textContent = 'Team Tasks';
                break;
            default:
                viewTitle.textContent = 'My Tasks';
        }
    }
    
    // Create a task card element
    function createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.priority}-priority`;
        taskCard.draggable = true;
        taskCard.dataset.taskId = task.id;
        taskCard.dataset.project = task.project;
        
        // Add drag event listeners
        taskCard.addEventListener('dragstart', dragStart);
        
        // Format due date
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today && task.status !== 'done';
        const isToday = dueDate.toDateString() === today.toDateString();
        
        // Task card content
        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox">
                    <input type="checkbox" id="task-${task.id}" ${task.status === 'done' ? 'checked' : ''}>
                    <label for="task-${task.id}"></label>
                </div>
                <div class="task-title">${task.title}</div>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-footer">
                <div class="task-due-date ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}">
                    <i class="far fa-calendar-alt"></i>
                    ${formatDate(task.dueDate)}
                    ${isToday ? '<span class="today-badge">Today</span>' : ''}
                </div>
                <div class="task-assignee">${getAssigneeIcon(task.assignee)}</div>
            </div>
        `;
        
        // Add checkbox event listener
        const checkbox = taskCard.querySelector(`#task-${task.id}`);
        checkbox.addEventListener('change', function() {
            const taskId = taskCard.dataset.taskId;
            const taskIndex = tasks.findIndex(t => t.id == taskId);
            
            if (taskIndex !== -1) {
                tasks[taskIndex].status = this.checked ? 'done' : 'todo';
                renderTasks();
            }
        });
        
        // Add click event to edit task (excluding checkbox clicks)
        taskCard.addEventListener('click', (e) => {
            if (!e.target.closest('.task-checkbox')) {
                openModal(task);
            }
        });
        
        // Append to the appropriate column
        const container = document.querySelector(`#${task.status}-column .tasks-container`);
        container.appendChild(taskCard);
    }
    
    // Format date for display
    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Get assignee icon
    function getAssigneeIcon(assignee) {
        if (assignee === 'me') return '👤';
        if (assignee === 'team-member-1') return '👩‍💻';
        if (assignee === 'team-member-2') return '👨‍💻';
        return '👥';
    }
    
    // Update task counts in column headers
    function updateTaskCounts() {
        const counts = {
            todo: 0,
            'in-progress': 0,
            done: 0
        };
        
        tasks.forEach(task => {
            counts[task.status]++;
        });
        
        document.querySelector('#todo-column .task-count').textContent = counts.todo;
        document.querySelector('#in-progress-column .task-count').textContent = counts['in-progress'];
        document.querySelector('#done-column .task-count').textContent = counts.done;
    }
    
    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            assignee: document.getElementById('task-assignee').value,
            project: document.getElementById('task-project').value,
            status: 'todo' // Default status
        };
        
        // Check if we're editing an existing task
        const taskId = taskForm.dataset.taskId;
        
        if (taskId) {
            // Update existing task
            const index = tasks.findIndex(task => task.id == taskId);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...taskData };
            }
        } else {
            // Create new task
            const newTask = {
                ...taskData,
                id: Date.now(), // Simple ID generation
                status: 'todo'
            };
            tasks.push(newTask);
        }
        
        // Re-render tasks and close modal
        renderTasks();
        closeModal();
    }
    
    // Drag and drop functions
    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
        e.target.classList.add('dragging');
        
        // Set a custom drag image (optional)
        const dragImage = e.target.cloneNode(true);
        dragImage.style.width = `${e.target.offsetWidth}px`;
        dragImage.style.opacity = '0.8';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-9999px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        
        setTimeout(() => document.body.removeChild(dragImage), 0);
    }
    
    function allowDrop(e) {
        e.preventDefault();
    }
    
    function drop(e) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        const newStatus = e.currentTarget.parentElement.id.replace('-column', '');
        
        // Update task status in the tasks array
        const taskIndex = tasks.findIndex(task => task.id == taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].status = newStatus;
        }
        
        // Re-render tasks to reflect the change
        renderTasks();
    }
    
    // Make the entire column a drop zone
    document.querySelectorAll('.tasks-container').forEach(container => {
        container.addEventListener('dragover', allowDrop);
        container.addEventListener('drop', drop);
    });
    
    // Project functions
    function renderProjects() {
        const projectsList = document.querySelector('.projects ul');
        projectsList.innerHTML = '';
        
        projects.forEach(project => {
            const li = document.createElement('li');
            li.className = 'project-item';
            li.dataset.projectId = project.id;
            li.innerHTML = `
                <i class="fas fa-circle" style="color: ${project.color}"></i>
                ${project.name}
            `;
            projectsList.appendChild(li);
        });
        
        // Add "Add Project" button
        const addProjectLi = document.createElement('li');
        addProjectLi.className = 'project-item';
        addProjectLi.dataset.projectId = 'add-project';
        addProjectLi.innerHTML = '<i class="fas fa-plus"></i> Add Project';
        projectsList.appendChild(addProjectLi);
        
        updateActiveProject();
    }
    
    function updateActiveProject() {
        document.querySelectorAll('.project-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.projectId === currentProject) {
                item.classList.add('active');
            }
        });
    }
    
    function showAddProjectModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>Add New Project</h2>
                <form id="add-project-form">
                    <div class="form-group">
                        <label for="project-name">Project Name</label>
                        <input type="text" id="project-name" required>
                    </div>
                    <div class="form-group">
                        <label for="project-color">Project Color</label>
                        <input type="color" id="project-color" value="#4a90e2">
                    </div>
                    <button type="submit" class="btn primary">Create Project</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        const closeBtn = modal.querySelector('.close-btn');
        const form = modal.querySelector('#add-project-form');
        
        closeBtn.onclick = () => modal.remove();
        window.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        form.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('project-name').value;
            const color = document.getElementById('project-color').value;
            
            const newProject = {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                color
            };
            
            projects.push(newProject);
            localStorage.setItem('projects', JSON.stringify(projects));
            renderProjects();
            modal.remove();
        };
    }
    
    // View Switching
    function switchToBoardView() {
        boardViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        boardView.classList.remove('hidden');
        boardView.classList.add('visible');
        listView.classList.remove('visible');
        listView.classList.add('hidden');
    }
    
    function switchToListView() {
        listViewBtn.classList.add('active');
        boardViewBtn.classList.remove('active');
        listView.classList.remove('hidden');
        listView.classList.add('visible');
        boardView.classList.remove('visible');
        boardView.classList.add('hidden');
        updateListView();
    }
    
    function updateListView() {
        listItems.innerHTML = '';
        const allTasks = [
            ...Array.from(document.querySelectorAll('#todo-column .task-card')),
            ...Array.from(document.querySelectorAll('#in-progress-column .task-card')),
            ...Array.from(document.querySelectorAll('#done-column .task-card'))
        ];

        allTasks.forEach(task => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            
            const title = task.querySelector('.task-title').textContent;
            const status = task.closest('.column').id.replace('-column', '');
            const dueDate = task.querySelector('.task-due-date')?.textContent || 'No due date';
            const priority = task.classList.contains('high-priority') ? 'high' : 
                            task.classList.contains('medium-priority') ? 'medium' : 'low';
            const project = task.getAttribute('data-project') || 'Inbox';

            listItem.innerHTML = `
                <div class="task-title">${title}</div>
                <div class="task-status">${status}</div>
                <div class="task-due-date">${dueDate}</div>
                <div class="task-priority ${priority}">${priority}</div>
                <div class="task-project">
                    <i class="fas fa-${project === 'work' ? 'briefcase' : project === 'personal' ? 'home' : 'inbox'}"></i>
                    ${project}
                </div>
            `;

            listItem.addEventListener('click', () => {
                // Open task details or edit modal
                openTaskModal(task);
            });

            listItems.appendChild(listItem);
        });
    }

    listViewBtn.addEventListener('click', switchToListView);
    boardViewBtn.addEventListener('click', switchToBoardView);

    // Update list view when tasks change
    function updateTaskViews() {
        if (listView.classList.contains('visible')) {
            updateListView();
        }
    }

    // Modify existing task-related functions to call updateTaskViews
    function addTask(taskData) {
        // ... existing addTask code ...
        updateTaskViews();
    }

    function deleteTask(taskElement) {
        // ... existing deleteTask code ...
        updateTaskViews();
    }

    function updateTask(taskElement, taskData) {
        // ... existing updateTask code ...
        updateTaskViews();
    }
    
    // Initialize the app
    init();
});