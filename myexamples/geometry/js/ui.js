class GeometryUI {
    constructor(board) {
        this.board = board;
        this.setupSidebar();
        this.setupToolbar();
        this.setupMenuToggle();
    }

    setupSidebar() {
        // Setup tab switching
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');

                // Hide all tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });

                // Show selected tab content
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId + 'View').classList.remove('hidden');
            });
        });
    }

    setupToolbar() {
        const toolsContainer = document.querySelector('.tools-container');
        
        // Create tool buttons for each category
        Object.values(CONFIG.tools).forEach(category => {
            category.tools.forEach(tool => {
                const button = this.createToolButton(tool);
                toolsContainer.appendChild(button);
            });
        });

        // Setup toggle button
        const toggleButton = document.getElementById('toggleTools');
        toggleButton.addEventListener('click', () => {
            const img = toggleButton.querySelector('img');
            if (img.src.includes('more')) {
                img.src = 'icons/less.svg';
                img.alt = 'Less tools';
                toolsContainer.style.maxHeight = 'none';
            } else {
                img.src = 'icons/more.svg';
                img.alt = 'More tools';
                toolsContainer.style.maxHeight = '72px';
            }
        });
    }

    createToolButton(tool) {
        const button = document.createElement('button');
        button.className = 'tool-button';
        button.setAttribute('data-tool', tool.id);
        
        const img = document.createElement('img');
        img.src = `icons/${tool.icon}`;
        img.alt = tool.name;
        
        const span = document.createElement('span');
        span.textContent = tool.name;
        
        button.appendChild(img);
        button.appendChild(span);
        
        button.addEventListener('click', () => {
            // Remove active class from all tools
            document.querySelectorAll('.tool-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked tool
            button.classList.add('active');
            
            // Set the current tool in the board
            this.board.setTool(tool.id);
        });
        
        return button;
    }

    setupMenuToggle() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    updateAlgebraView(objects) {
        const algebraView = document.getElementById('algebraView');
        algebraView.innerHTML = '';

        objects.forEach(obj => {
            const element = document.createElement('div');
            element.className = 'algebra-item';
            element.textContent = `${obj.type}: ${obj.equation || obj.coordinates}`;
            algebraView.appendChild(element);
        });
    }
}
