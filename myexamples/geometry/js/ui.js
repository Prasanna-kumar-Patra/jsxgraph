class GeometryUI {
    constructor(board) {
        this.board = board;
        this.setupSidebar();
        this.setupToolbar();
        this.setupMenuToggle();
    }

    setupSidebar() {
        // Setup collapse button
        const collapseButton = document.getElementById('collapseTools');
        const sidebar = document.getElementById('sidebar');
        
        collapseButton.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const img = collapseButton.querySelector('img');
            if (sidebar.classList.contains('collapsed')) {
                img.style.transform = 'rotate(180deg)';
            } else {
                img.style.transform = 'rotate(0deg)';
            }
        });

        // Setup algebra view toggle
        const menuToggle = document.getElementById('menuToggle');
        const algebraWrapper = document.querySelector('.algebra-wrapper');
        const toolsWrapper = document.querySelector('.tools-wrapper');
        
        menuToggle.addEventListener('click', () => {
            algebraWrapper.classList.toggle('hidden');
            toolsWrapper.classList.toggle('hidden');
        });
    }

    setupToolbar() {
        const toolsContainer = document.querySelector('.tools-container');
        
        // Create tool buttons for each category
        Object.entries(CONFIG.tools).forEach(([key, category]) => {
            // Skip non-category entries like 'status'
            if (!category.tools) return;
            
            // Create category section
            const section = document.createElement('div');
            section.className = 'tool-category';
            
            // Create category header
            const header = document.createElement('div');
            header.className = 'tool-category-header';
            header.textContent = category.name;
            section.appendChild(header);
            
            // Create tools grid
            const grid = document.createElement('div');
            grid.className = 'tool-grid';
            
            // Create tools for this category
            category.tools.forEach(tool => {
                const button = this.createToolButton(tool);
                grid.appendChild(button);
            });
            
            section.appendChild(grid);
            toolsContainer.appendChild(section);
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
