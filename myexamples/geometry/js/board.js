class GeometryBoard {
    constructor() {
        this.board = JXG.JSXGraph.initBoard('jxgbox', CONFIG.board);
        this.currentTool = null;
        this.tempPoints = [];
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Board click handler
        this.board.on('down', (e) => {
            if (!this.currentTool) return;
            
            const coords = this.board.getUsrCoordsOfMouse(e);
            this.handleToolAction(coords);
        });

        // Setup zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.25));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        
        // Setup home view button
        document.getElementById('homeView').addEventListener('click', () => this.resetView());
        
        // Setup fullscreen button
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());
    }

    setTool(toolId) {
        this.currentTool = toolId;
        this.tempPoints = [];
        this.board.update();
    }

    handleToolAction(coords) {
        switch (this.currentTool) {
            case 'point':
                this.createPoint(coords[0], coords[1]);
                break;
            case 'segment':
                this.handleSegmentTool(coords);
                break;
            case 'line':
                this.handleLineTool(coords);
                break;
            case 'circle':
                this.handleCircleTool(coords);
                break;
            case 'polygon':
                this.handlePolygonTool(coords);
                break;
        }
    }

    createPoint(x, y) {
        return this.board.create('point', [x, y], {
            size: 4,
            name: '',
            showInfobox: false
        });
    }

    handleSegmentTool(coords) {
        if (this.tempPoints.length === 0) {
            this.tempPoints.push(this.createPoint(coords[0], coords[1]));
        } else {
            const p2 = this.createPoint(coords[0], coords[1]);
            this.board.create('segment', [this.tempPoints[0], p2], {
                strokeWidth: 2,
                strokeColor: '#1a73e8'
            });
            this.tempPoints = [];
        }
    }

    handleLineTool(coords) {
        if (this.tempPoints.length === 0) {
            this.tempPoints.push(this.createPoint(coords[0], coords[1]));
        } else {
            const p2 = this.createPoint(coords[0], coords[1]);
            this.board.create('line', [this.tempPoints[0], p2], {
                strokeWidth: 2,
                strokeColor: '#1a73e8'
            });
            this.tempPoints = [];
        }
    }

    handleCircleTool(coords) {
        if (this.tempPoints.length === 0) {
            this.tempPoints.push(this.createPoint(coords[0], coords[1]));
        } else {
            const p2 = this.createPoint(coords[0], coords[1]);
            this.board.create('circle', [this.tempPoints[0], p2], {
                strokeWidth: 2,
                strokeColor: '#1a73e8',
                fillColor: 'none'
            });
            this.tempPoints = [];
        }
    }

    handlePolygonTool(coords) {
        const point = this.createPoint(coords[0], coords[1]);
        this.tempPoints.push(point);

        // If we have at least 3 points and clicked near the first point, complete the polygon
        if (this.tempPoints.length >= 3) {
            const firstPoint = this.tempPoints[0];
            const distance = Math.sqrt(
                Math.pow(coords[0] - firstPoint.X(), 2) + 
                Math.pow(coords[1] - firstPoint.Y(), 2)
            );

            if (distance < 0.5) {
                this.tempPoints.pop(); // Remove the last point
                this.board.create('polygon', this.tempPoints, {
                    borders: {
                        strokeWidth: 2,
                        strokeColor: '#1a73e8'
                    },
                    fillColor: '#1a73e8',
                    fillOpacity: 0.1
                });
                this.tempPoints = [];
            }
        }
    }

    zoom(factor) {
        const bb = this.board.getBoundingBox();
        const dx = (bb[2] - bb[0]) * (1 - 1/factor) / 2;
        const dy = (bb[1] - bb[3]) * (1 - 1/factor) / 2;
        this.board.setBoundingBox([bb[0]+dx, bb[1]-dy, bb[2]-dx, bb[3]+dy], false);
        this.board.update();
    }

    resetView() {
        this.board.setBoundingBox(CONFIG.board.boundingBox, false);
        this.board.update();
    }

    toggleFullscreen() {
        const jxgbox = document.getElementById('jxgbox');
        if (!document.fullscreenElement) {
            jxgbox.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}
