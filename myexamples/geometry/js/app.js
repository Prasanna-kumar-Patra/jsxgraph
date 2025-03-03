// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the geometry board
    const geometryBoard = new GeometryBoard();
    
    // Initialize the UI with the board reference
    const ui = new GeometryUI(geometryBoard);
    
    // Set the default tool to 'move'
    geometryBoard.setTool('move');
    
    // Mark the move tool as active in the UI
    const moveButton = document.querySelector('[data-tool="move"]');
    if (moveButton) {
        moveButton.classList.add('active');
    }
});
