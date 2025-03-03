class GeometryToolTests {
    constructor() {
        this.board = JXG.JSXGraph.initBoard('jxgbox', {
            boundingbox: [-10, 10, 10, -10],
            axis: true,
            grid: true,
            showCopyright: false,
            showNavigation: false
        });
        this.tools = new GeometryTools(this.board);
    }

    // Helper function to simulate mouse events
    simulateMouseEvent(type, coords) {
        const event = {
            type: type,
            coords: { usrCoords: [1, coords[0], coords[1]] }
        };
        switch(type) {
            case 'down':
                this.tools.handleDown(event);
                break;
            case 'move':
                this.tools.handleMove(event);
                break;
            case 'up':
                this.tools.handleUp(event);
                break;
        }
    }

    // Test all tools
    async runTests() {
        console.log('Starting tool tests...');
        
        // Test point creation
        console.log('Testing point tool...');
        this.tools.setTool('point');
        this.simulateMouseEvent('down', [1, 1]);
        this.simulateMouseEvent('down', [2, 2]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test line creation
        console.log('Testing line tool...');
        this.tools.setTool('line');
        this.simulateMouseEvent('down', [0, 0]);
        this.simulateMouseEvent('move', [3, 3]);
        this.simulateMouseEvent('down', [3, 3]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test segment creation
        console.log('Testing segment tool...');
        this.tools.setTool('segment');
        this.simulateMouseEvent('down', [-2, 1]);
        this.simulateMouseEvent('move', [1, -2]);
        this.simulateMouseEvent('down', [1, -2]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test ray creation
        console.log('Testing ray tool...');
        this.tools.setTool('ray');
        this.simulateMouseEvent('down', [-3, -3]);
        this.simulateMouseEvent('move', [-1, -1]);
        this.simulateMouseEvent('down', [-1, -1]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test circle (center-point) creation
        console.log('Testing circle (center-point) tool...');
        this.tools.setTool('circle_center_point');
        this.simulateMouseEvent('down', [4, 0]);
        this.simulateMouseEvent('move', [4, 2]);
        this.simulateMouseEvent('down', [4, 2]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test circle (three points) creation
        console.log('Testing circle (three points) tool...');
        this.tools.setTool('circle_three_points');
        this.simulateMouseEvent('down', [-4, 0]);
        this.simulateMouseEvent('down', [-4, 2]);
        this.simulateMouseEvent('down', [-2, 1]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test polygon creation
        console.log('Testing polygon tool...');
        this.tools.setTool('polygon');
        this.simulateMouseEvent('down', [0, 4]);
        this.simulateMouseEvent('down', [2, 4]);
        this.simulateMouseEvent('down', [1, 6]);
        this.simulateMouseEvent('down', [0, 4]); // Close polygon
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test regular polygon creation
        console.log('Testing regular polygon tool...');
        this.tools.setTool('regular_polygon');
        this.simulateMouseEvent('down', [-2, 4]);
        this.simulateMouseEvent('move', [-4, 4]);
        this.simulateMouseEvent('down', [-4, 4]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test perpendicular line
        console.log('Testing perpendicular tool...');
        this.tools.setTool('perpendicular');
        // First create a line to test with
        this.tools.setTool('line');
        this.simulateMouseEvent('down', [-5, -4]);
        this.simulateMouseEvent('down', [-3, -4]);
        await new Promise(resolve => setTimeout(resolve, 500));
        // Now create perpendicular
        this.tools.setTool('perpendicular');
        this.simulateMouseEvent('down', [-4, -3]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test angle measurement
        console.log('Testing angle tool...');
        this.tools.setTool('angle');
        this.simulateMouseEvent('down', [3, -3]);
        this.simulateMouseEvent('down', [5, -3]);
        this.simulateMouseEvent('down', [5, -1]);
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('All tests completed!');
    }
}

// Run tests when page loads
window.addEventListener('load', () => {
    const tester = new GeometryToolTests();
    tester.runTests();
});
