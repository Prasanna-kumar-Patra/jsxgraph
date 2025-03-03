// Global board instance
let geometryBoard = null;

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    Logger.info('Initializing application');
    
    try {
        // Initialize the geometry board
        geometryBoard = new GeometryBoard();
        window.geometryBoard = geometryBoard; // Make it globally accessible
        
        Logger.info('Board initialized successfully');
        
        // Initialize the UI with the board reference
        const ui = new GeometryUI(geometryBoard);
        
        // Set the default tool to 'move'
        geometryBoard.setTool('move');
        
        // Mark the move tool as active in the UI
        const moveButton = document.querySelector('[data-tool="move"]');
        if (moveButton) {
            moveButton.classList.add('active');
        }
        
        // Add test button
        const testButton = document.createElement('button');
        testButton.textContent = 'Run Tool Tests';
        testButton.style.position = 'fixed';
        testButton.style.bottom = '10px';
        testButton.style.right = '10px';
        testButton.onclick = async () => {
            try {
                Logger.info('Starting tool tests');
                const tester = new ToolTester(geometryBoard);
                await tester.runAllTests();
                Logger.info('All tests completed successfully');
            } catch (error) {
                Logger.error('Error running tests:', error);
            }
        };
        document.body.appendChild(testButton);
        
        Logger.info('Application initialization complete');
    } catch (error) {
        Logger.error('Error initializing application:', error);
    }
});
