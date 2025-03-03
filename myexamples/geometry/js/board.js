class GeometryBoard {
    constructor() {
        this.board = JXG.JSXGraph.initBoard('jxgbox', CONFIG.board);
        
        // Initialize tools
        this.tools = new GeometryTools(this.board);
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50; // Maximum number of history states to keep
        
        this.touchStartTime = 0;
        this.lastTapTime = 0;
        
        this.setupEventHandlers();
        this.setupTouchHandlers();
        
        // Setup keyboard shortcuts for undo/redo
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (e.shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
                e.preventDefault();
            }
        });
    }

    setupEventHandlers() {
        // Mouse event handlers
        this.board.on('down', (e) => {
            const coords = this.board.getUsrCoordsOfMouse(e);
            this.tools.handleDown(e);
        });

        this.board.on('move', (e) => {
            const coords = this.board.getUsrCoordsOfMouse(e);
            this.tools.handleMove(e);
        });

        this.board.on('up', (e) => {
            const coords = this.board.getUsrCoordsOfMouse(e);
            if (this.tools.handleUp(e)) {
                this.addToHistory();
            }
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
        this.tools.setTool(toolId);
        this.board.update();
    }
    
    // History management
    addToHistory() {
        const state = this.board.renderer.dumpToString();
        
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        this.history.push(state);
        this.historyIndex++;
        
        // Remove oldest states if exceeding maxHistory
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.board.renderer.loadFromString(this.history[this.historyIndex]);
            this.board.update();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.board.renderer.loadFromString(this.history[this.historyIndex]);
            this.board.update();
        }
    }

    setupTouchHandlers() {
        const hammer = new Hammer(this.board.containerObj);
        
        hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        hammer.get('pinch').set({ enable: true });
        
        hammer.on('tap', (e) => {
            const now = Date.now();
            if (now - this.lastTapTime < CONFIG.touch.doubleTapTimeout) {
                this.handleDoubleTap(e);
            } else {
                this.handleTap(e);
            }
            this.lastTapTime = now;
        });
        
        hammer.on('panstart', (e) => this.handleTouchStart(e));
        hammer.on('panmove', (e) => this.handleTouchMove(e));
        hammer.on('panend', (e) => this.handleTouchEnd(e));
        
        hammer.on('pinchstart', (e) => this.handlePinchStart(e));
        hammer.on('pinchmove', (e) => this.handlePinchMove(e));
        hammer.on('pinchend', (e) => this.handlePinchEnd(e));
    }

    startToolAction(coords) {
        if (this.toolStatus !== CONFIG.tools.status.PENDING) return;
        
        this.toolStatus = CONFIG.tools.status.ACTIVE;
        this.clearTempObjects();
        
        switch (this.currentTool) {
            case 'point':
                this.startPointCreation(coords);
                break;
            case 'segment':
            case 'line':
            case 'ray':
                this.startLineCreation(coords);
                break;
            case 'circle':
                this.startCircleCreation(coords);
                break;
            case 'polygon':
                this.startPolygonCreation(coords);
                break;
            // Add other tools here
        }
    }

    updateToolAction(coords) {
        switch (this.currentTool) {
            case 'point':
                this.updatePointCreation(coords);
                break;
            case 'segment':
            case 'line':
            case 'ray':
                this.updateLineCreation(coords);
                break;
            case 'circle':
                this.updateCircleCreation(coords);
                break;
            case 'polygon':
                this.updatePolygonCreation(coords);
                break;
            // Add other tools here
        }
    }

    completeToolAction(coords) {
        if (this.toolStatus !== CONFIG.tools.status.ACTIVE) return;
        
        let created = false;
        
        switch (this.currentTool) {
            case 'point':
                created = this.completePointCreation(coords);
                break;
            case 'segment':
            case 'line':
            case 'ray':
                created = this.completeLineCreation(coords);
                break;
            case 'circle':
                created = this.completeCircleCreation(coords);
                break;
            case 'polygon':
                created = this.completePolygonCreation(coords);
                break;
            // Add other tools here
        }
        
        if (created) {
            this.addToHistory();
        }
        
        this.toolStatus = CONFIG.tools.status.PENDING;
        this.clearTempObjects();
    }

    // Point creation methods
    startPointCreation(coords) {
        this.dragPoint = this.board.create('point', [coords[0], coords[1]], {
            size: 4,
            name: '',
            showInfobox: false,
            fixed: false
        });
        this.tempObjects.push(this.dragPoint);
    }

    updatePointCreation(coords) {
        if (this.dragPoint) {
            this.dragPoint.moveTo(coords);
        }
    }

    completePointCreation(coords) {
        if (!this.dragPoint) return false;
        
        const point = this.board.create('point', [coords[0], coords[1]], {
            size: 4,
            name: '',
            showInfobox: false,
            fixed: false
        });
        
        return true;
    }

    // Line creation methods
    startLineCreation(coords) {
        const p1 = this.board.create('point', [coords[0], coords[1]], {
            size: 4,
            name: '',
            showInfobox: false,
            fixed: false
        });
        
        const p2 = this.board.create('point', [coords[0], coords[1]], {
            size: 4,
            name: '',
            showInfobox: false,
            fixed: false
        });
        
        let lineObj;
        switch (this.currentTool) {
            case 'segment':
                lineObj = this.board.create('segment', [p1, p2], {
                    strokeWidth: 2,
                    strokeColor: '#1a73e8'
                });
                break;
            case 'line':
                lineObj = this.board.create('line', [p1, p2], {
                    strokeWidth: 2,
                    strokeColor: '#1a73e8'
                });
                break;
            case 'ray':
                lineObj = this.board.create('ray', [p1, p2], {
                    strokeWidth: 2,
                    strokeColor: '#1a73e8'
                });
                break;
        }
        
        this.tempPoints = [p1, p2];
        this.tempObjects.push(p1, p2, lineObj);
    }

    updateLineCreation(coords) {
        if (this.tempPoints.length === 2) {
            this.tempPoints[1].moveTo(coords);
        }
    }

    completeLineCreation(coords) {
        if (this.tempPoints.length !== 2) return false;
        
        const [p1, p2] = this.tempPoints;
        let obj;
        
        switch (this.currentTool) {
            case 'segment':
                obj = this.board.create('segment', [p1, p2], {
                    strokeWidth: 2,
                    strokeColor: '#1a73e8'
                });
                break;
            case 'line':
                obj = this.board.create('line', [p1, p2], {
                    strokeWidth: 2,
                    strokeColor: '#1a73e8'
                });
                break;
            case 'ray':
                obj = this.board.create('ray', [p1, p2], {
                    strokeWidth: 2,
                    strokeColor: '#1a73e8'
                });
                break;
        }
        
        return true;
    }

    // Circle creation methods
    startCircleCreation(coords) {
        const center = this.board.create('point', [coords[0], coords[1]], {
            size: 4,
            name: '',
            showInfobox: false,
            fixed: false
        });
        
        const radius = this.board.create('point', [coords[0], coords[1]], {
            size: 4,
            name: '',
            showInfobox: false,
            fixed: false
        });
        
        const circle = this.board.create('circle', [center, radius], {
            strokeWidth: 2,
            strokeColor: '#1a73e8',
            fillColor: 'none'
        });
        
        this.tempPoints = [center, radius];
        this.tempObjects.push(center, radius, circle);
    }

    updateCircleCreation(coords) {
        if (this.tempPoints.length === 2) {
            this.tempPoints[1].moveTo(coords);
        }
    }

    completeCircleCreation(coords) {
        if (this.tempPoints.length !== 2) return false;
        
        const [center, radius] = this.tempPoints;
        const circle = this.board.create('circle', [center, radius], {
            strokeWidth: 2,
            strokeColor: '#1a73e8',
            fillColor: 'none'
        });
        
        return true;
    }

    // Polygon creation methods
    startPolygonCreation(coords) {
        const point = this.board.create('point', [coords[0], coords[1]], {
            size: 4,
            name: '',
            showInfobox: false,
            fixed: false
        });
        
        this.tempPoints.push(point);
        this.tempObjects.push(point);
        
        if (this.tempPoints.length > 1) {
            const segment = this.board.create('segment', 
                [this.tempPoints[this.tempPoints.length - 2], point], {
                strokeWidth: 2,
                strokeColor: '#1a73e8'
            });
            this.tempObjects.push(segment);
        }
    }

    updatePolygonCreation(coords) {
        if (this.tempPoints.length > 0) {
            const lastPoint = this.tempPoints[this.tempPoints.length - 1];
            lastPoint.moveTo(coords);
            
            // Show preview to first point if close enough
            if (this.tempPoints.length > 2) {
                const firstPoint = this.tempPoints[0];
                const distance = Math.sqrt(
                    Math.pow(coords[0] - firstPoint.X(), 2) + 
                    Math.pow(coords[1] - firstPoint.Y(), 2)
                );
                
                if (distance < 0.5) {
                    if (!this.tempObjects.find(obj => obj.elType === 'segment' && 
                        obj.point1 === lastPoint && obj.point2 === firstPoint)) {
                        const closingSegment = this.board.create('segment', 
                            [lastPoint, firstPoint], {
                            strokeWidth: 2,
                            strokeColor: '#1a73e8',
                            dash: 2
                        });
                        this.tempObjects.push(closingSegment);
                    }
                }
            }
        }
    }

    completePolygonCreation(coords) {
        if (this.tempPoints.length < 3) return false;
        
        const firstPoint = this.tempPoints[0];
        const lastPoint = this.tempPoints[this.tempPoints.length - 1];
        const distance = Math.sqrt(
            Math.pow(coords[0] - firstPoint.X(), 2) + 
            Math.pow(coords[1] - firstPoint.Y(), 2)
        );
        
        if (distance < 0.5) {
            // Complete the polygon
            this.board.create('polygon', this.tempPoints, {
                borders: {
                    strokeWidth: 2,
                    strokeColor: '#1a73e8'
                },
                fillColor: '#1a73e8',
                fillOpacity: 0.1
            });
            return true;
        }
        
        return false;
    }

    // Touch event handlers
    handleTap(e) {
        const coords = this.board.getUsrCoordsOfMouse(e.center);
        this.startToolAction(coords);
        this.completeToolAction(coords);
    }

    handleDoubleTap(e) {
        const coords = this.board.getUsrCoordsOfMouse(e.center);
        if (this.currentTool === 'polygon') {
            this.completePolygonCreation(coords);
        }
    }

    handleTouchStart(e) {
        const coords = this.board.getUsrCoordsOfMouse(e.center);
        this.touchStartTime = Date.now();
        this.startToolAction(coords);
    }

    handleTouchMove(e) {
        const coords = this.board.getUsrCoordsOfMouse(e.center);
        if (Date.now() - this.touchStartTime > CONFIG.touch.dragThreshold) {
            this.updateToolAction(coords);
        }
    }

    handleTouchEnd(e) {
        const coords = this.board.getUsrCoordsOfMouse(e.center);
        this.completeToolAction(coords);
    }

    handlePinchStart(e) {
        this.lastScale = 1;
    }

    handlePinchMove(e) {
        const factor = e.scale / this.lastScale;
        this.zoom(factor);
        this.lastScale = e.scale;
    }

    handlePinchEnd(e) {
        // Nothing special to do here
    }

    // Utility methods
    clearTempObjects() {
        this.tempObjects.forEach(obj => {
            this.board.removeObject(obj);
        });
        this.tempObjects = [];
        this.tempPoints = [];
        this.board.update();
    }

    addToHistory() {
        // Remove any future states if we're in the middle of the history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add current state to history
        this.history.push(this.board.getBoundingBox());
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.board.setBoundingBox(this.history[this.historyIndex]);
            this.board.update();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.board.setBoundingBox(this.history[this.historyIndex]);
            this.board.update();
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
