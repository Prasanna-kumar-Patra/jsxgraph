class ToolTester {
    constructor(geometryBoard) {
        this.geometryBoard = geometryBoard;
        this.board = geometryBoard.board;
        this.tools = geometryBoard.tools;
        this.testCases = {
            'point': this.testPointTool.bind(this),
            'line': this.testLineTool.bind(this),
            'segment': this.testSegmentTool.bind(this),
            'ray': this.testRayTool.bind(this),
            'vector': this.testVectorTool.bind(this),
            'circle': this.testCircleTool.bind(this),
            'circle_radius': this.testCircleRadiusTool.bind(this),
            'circle_three_points': this.testCircleThreePointsTool.bind(this),
            'polygon': this.testPolygonTool.bind(this),
            'regular_polygon': this.testRegularPolygonTool.bind(this),
            'perpendicular': this.testPerpendicularTool.bind(this),
            'parallel': this.testParallelTool.bind(this),
            'angle': this.testAngleTool.bind(this),
            'distance': this.testDistanceTool.bind(this)
        };
    }

    simulateMouseEvent(type, coords) {
        Logger.debug(`Simulating ${type} event at coordinates:`, coords);
        
        // Convert user coordinates to screen coordinates
        const screenCoords = this.board.conversion(coords[0], coords[1], true);
        
        // Get board container position
        const rect = this.board.containerObj.getBoundingClientRect();
        
        // Create event with proper coordinates
        const event = new MouseEvent(type, {
            clientX: rect.left + screenCoords.scrCoords[1],
            clientY: rect.top + screenCoords.scrCoords[2],
            bubbles: true
        });
        
        Logger.debug('Screen coordinates:', {
            userCoords: coords,
            screenX: event.clientX,
            screenY: event.clientY
        });
        
        this.board.containerObj.dispatchEvent(event);
    }

    async runTest(toolId) {
        Logger.info(`Running test for tool: ${toolId}`);
        if (this.testCases[toolId]) {
            try {
                this.tools.setTool(toolId);
                await this.testCases[toolId]();
                Logger.info(`Test completed for tool: ${toolId}`);
            } catch (error) {
                Logger.error(`Test failed for tool: ${toolId}`, error);
                throw error; // Re-throw to mark test as failed
            }
        } else {
            Logger.warn(`No test case found for tool: ${toolId}`);
        }
    }

    async runAllTests() {
        Logger.info('Starting all tool tests');
        for (const toolId of Object.keys(this.testCases)) {
            await this.runTest(toolId);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
        }
        Logger.info('All tool tests completed');
    }

    // Test cases for each tool
    async testPointTool() {
        Logger.info('Testing Point Tool');
        try {
            // Create a point at (2, 2) in board coordinates
            this.simulateMouseEvent('mousedown', [2, 2]);
            await new Promise(resolve => setTimeout(resolve, 100));
            this.simulateMouseEvent('mouseup', [2, 2]);
            
            // Verify point was created
            const points = this.board.objectsList.filter(obj => obj.elType === 'point');
            Logger.debug('Points on board:', { count: points.length });
            
            if (points.length === 0) {
                throw new Error('No point was created');
            }
            
            // Create another point to test multiple point creation
            await new Promise(resolve => setTimeout(resolve, 500));
            this.simulateMouseEvent('mousedown', [3, 3]);
            await new Promise(resolve => setTimeout(resolve, 100));
            this.simulateMouseEvent('mouseup', [3, 3]);
        } catch (error) {
            Logger.error('Point tool test failed:', error);
            throw error;
        }
    }

    async testLineTool() {
        this.simulateMouseEvent('mousedown', [100, 100]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [100, 100]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mousedown', [200, 200]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [200, 200]);
    }

    async testSegmentTool() {
        this.simulateMouseEvent('mousedown', [100, 100]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [100, 100]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mousedown', [200, 100]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [200, 100]);
    }

    async testRayTool() {
        this.simulateMouseEvent('mousedown', [100, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [100, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mousedown', [200, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [200, 150]);
    }

    async testVectorTool() {
        this.simulateMouseEvent('mousedown', [100, 200]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [100, 200]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mousedown', [200, 200]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [200, 200]);
    }

    async testCircleTool() {
        this.simulateMouseEvent('mousedown', [150, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [150, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mousedown', [200, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [200, 150]);
    }

    async testCircleRadiusTool() {
        window.prompt = () => '5'; // Mock prompt
        this.simulateMouseEvent('mousedown', [150, 200]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [150, 200]);
    }

    async testCircleThreePointsTool() {
        const points = [[150, 250], [200, 250], [175, 200]];
        for (const point of points) {
            this.simulateMouseEvent('mousedown', point);
            await new Promise(resolve => setTimeout(resolve, 100));
            this.simulateMouseEvent('mouseup', point);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async testPolygonTool() {
        const points = [[100, 300], [200, 300], [200, 400], [100, 400], [100, 300]];
        for (const point of points) {
            this.simulateMouseEvent('mousedown', point);
            await new Promise(resolve => setTimeout(resolve, 100));
            this.simulateMouseEvent('mouseup', point);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async testRegularPolygonTool() {
        window.prompt = () => '6'; // Mock prompt for number of sides
        this.simulateMouseEvent('mousedown', [300, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [300, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mousedown', [350, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [350, 150]);
    }

    async testPerpendicularTool() {
        // First create a line
        this.tools.setTool('line');
        await this.testLineTool();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then create perpendicular
        this.tools.setTool('perpendicular');
        this.simulateMouseEvent('mousedown', [150, 150]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [150, 150]);
    }

    async testParallelTool() {
        // First create a line if not exists
        this.board.setTool('line');
        await this.testLineTool();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then create parallel
        this.board.setTool('parallel');
        this.simulateMouseEvent('mousedown', [150, 200]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [150, 200]);
    }

    async testAngleTool() {
        const points = [[300, 300], [350, 300], [350, 350]];
        for (const point of points) {
            this.simulateMouseEvent('mousedown', point);
            await new Promise(resolve => setTimeout(resolve, 100));
            this.simulateMouseEvent('mouseup', point);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async testDistanceTool() {
        this.simulateMouseEvent('mousedown', [400, 100]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [400, 100]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mousedown', [400, 200]);
        await new Promise(resolve => setTimeout(resolve, 100));
        this.simulateMouseEvent('mouseup', [400, 200]);
    }
}
