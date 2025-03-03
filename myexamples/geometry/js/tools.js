class GeometryTools {
    constructor(board) {
        this.board = board;
        this.currentTool = null;
        this.toolState = CONFIG.tools.status.PENDING;
        this.points = [];
        this.tempObjects = [];
        this.selectedObjects = [];
        this.lastPoint = null;
        this.isDragging = false;
        
        // Initialize event handling
        this.initEventHandling();
    }
    
    // Clear temporary objects from the board
    clearTempObjects() {
        if (this.tempObjects) {
            this.tempObjects.forEach(obj => {
                if (obj && typeof obj.remove === 'function') {
                    obj.remove();
                }
            });
            this.tempObjects = [];
        }
        this.board.update();
    }
    
    initEventHandling() {
        // Add mouse move listener for hover effects
        this.board.on('mousemove', (e) => {
            const objs = this.board.getAllObjectsUnderMouse(e);
            if (objs.length > 0) {
                const obj = objs[0];
                if (this.currentTool === 'move' || 
                    (this.currentTool === 'polygon' && obj === this.points[0])) {
                    this.board.containerObj.style.cursor = 'pointer';
                } else {
                    this.board.containerObj.style.cursor = 'default';
                }
            } else {
                this.board.containerObj.style.cursor = 'default';
            }
        });
    }

    // Set the current tool
    setTool(toolId) {
        Logger.info(`Setting tool: ${toolId}`);
        this.currentTool = toolId;
        this.toolState = CONFIG.tools.status.PENDING;
        this.points = [];
        this.selectedObjects = [];
        this.clearTempObjects();
        this.board.update();
        Logger.debug('Tool state reset', {
            tool: toolId,
            state: this.toolState,
            points: this.points.length,
            selectedObjects: this.selectedObjects.length
        });
    }

    // Handle mouse/touch down event
    handleDown(e) {
        if (!this.currentTool) {
            Logger.debug('No tool selected, ignoring down event');
            return;
        }
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        const clickedObjects = this.board.getAllObjectsUnderMouse(e);
        
        Logger.debug('Handle down event', {
            tool: this.currentTool,
            coords,
            clickedObjects: clickedObjects.map(obj => obj.elType),
            state: this.toolState
        });
        
        // Start dragging for move tool
        if (this.currentTool === 'move' && clickedObjects.length > 0) {
            this.isDragging = true;
            return;
        }
        
        switch (this.currentTool) {
            case 'move':
                // Handled above
                break;
                
            case 'point':
                Logger.debug('Creating point', { coords });
                const point = this.board.create('point', coords);
                this.lastPoint = point;
                this.toolState = CONFIG.tools.status.PENDING; // Reset state after creating point
                break;
                
            case 'line':
            case 'segment':
            case 'ray':
            case 'vector':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else {
                    this.points.push(this.board.create('point', coords));
                    const props = {
                        straightFirst: this.currentTool === 'line',
                        straightLast: this.currentTool !== 'segment',
                        lastArrow: this.currentTool === 'vector'
                    };
                    this.board.create('line', this.points, props);
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                }
                break;
                
            case 'segment_fixed':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    const length = parseFloat(prompt('Enter segment length:', '5'));
                    if (!isNaN(length)) {
                        this.fixedLength = length;
                        this.toolState = CONFIG.tools.status.ACTIVE;
                    } else {
                        this.points[0].remove();
                        this.points = [];
                    }
                } else {
                    const angle = Math.atan2(coords[1] - this.points[0].Y(), coords[0] - this.points[0].X());
                    const endX = this.points[0].X() + this.fixedLength * Math.cos(angle);
                    const endY = this.points[0].Y() + this.fixedLength * Math.sin(angle);
                    const endPoint = this.board.create('point', [endX, endY]);
                    this.board.create('segment', [this.points[0], endPoint]);
                    this.points = [];
                    this.fixedLength = null;
                    this.toolState = CONFIG.tools.status.PENDING;
                }
                break;
                
            case 'circle':
            case 'circle_radius':
            case 'circle_three_points':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    if (this.currentTool === 'circle_radius') {
                        const radius = parseFloat(prompt('Enter circle radius:', '5'));
                        if (!isNaN(radius)) {
                            this.points.push(this.board.create('point', coords));
                            this.board.create('circle', [this.points[0], radius]);
                            this.points = [];
                        }
                    } else {
                        this.points.push(this.board.create('point', coords));
                        this.toolState = CONFIG.tools.status.ACTIVE;
                    }
                } else if (this.currentTool === 'circle_three_points' && this.points.length < 2) {
                    this.points.push(this.board.create('point', coords));
                } else {
                    this.points.push(this.board.create('point', coords));
                    if (this.currentTool === 'circle') {
                        this.board.create('circle', this.points);
                    } else {
                        this.board.create('circumcircle', this.points);
                    }
                    this.points = [];
                    this.toolState = CONFIG.tools.status.PENDING;
                }
                break;
                
            case 'semicircle':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else {
                    this.points.push(this.board.create('point', coords));
                    this.board.create('semicircle', this.points);
                    this.points = [];
                    this.toolState = CONFIG.tools.status.PENDING;
                }
                break;
                
            case 'polygon':
            case 'regular_polygon':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    if (this.currentTool === 'regular_polygon') {
                        const sides = parseInt(prompt('Enter number of sides (3-12):', '6'));
                        if (!isNaN(sides) && sides >= 3 && sides <= 12) {
                            this.polygonSides = sides;
                            this.points.push(this.board.create('point', coords));
                            this.toolState = CONFIG.tools.status.ACTIVE;
                        }
                    } else {
                        this.points.push(this.board.create('point', coords));
                        this.toolState = CONFIG.tools.status.ACTIVE;
                    }
                } else if (this.currentTool === 'regular_polygon' && this.points.length === 1) {
                    const center = this.points[0];
                    const vertex = this.board.create('point', coords);
                    const radius = center.Dist(vertex);
                    const angle = Math.atan2(vertex.Y() - center.Y(), vertex.X() - center.X());
                    
                    const vertices = [vertex];
                    for (let i = 1; i < this.polygonSides; i++) {
                        const newAngle = angle + (2 * Math.PI * i) / this.polygonSides;
                        const x = center.X() + radius * Math.cos(newAngle);
                        const y = center.Y() + radius * Math.sin(newAngle);
                        vertices.push(this.board.create('point', [x, y]));
                    }
                    
                    this.board.create('polygon', vertices);
                    center.remove();
                    this.points = [];
                    this.polygonSides = null;
                    this.toolState = CONFIG.tools.status.PENDING;
                } else {
                    const clickedPoint = this.getClickedPoint(clickedObjects);
                    if (clickedPoint === this.points[0] && this.points.length > 2) {
                        this.board.create('polygon', this.points);
                        this.points = [];
                        this.toolState = CONFIG.tools.status.PENDING;
                    } else {
                        this.points.push(this.board.create('point', coords));
                    }
                }
                break;
                
            case 'perpendicular':
            case 'parallel':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    const line = clickedObjects.find(obj => obj.elType === 'line');
                    if (line) {
                        this.selectedObjects = [line];
                        this.toolState = CONFIG.tools.status.ACTIVE;
                    }
                } else {
                    const point = this.board.create('point', coords);
                    if (this.currentTool === 'perpendicular') {
                        this.board.create('perpendicular', [this.selectedObjects[0], point]);
                    } else {
                        this.board.create('parallel', [this.selectedObjects[0], point]);
                    }
                    this.selectedObjects = [];
                    this.toolState = CONFIG.tools.status.PENDING;
                }
                break;
                
            case 'angle':
            case 'angle_fixed':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    if (this.currentTool === 'angle_fixed') {
                        const degrees = parseFloat(prompt('Enter angle in degrees:', '60'));
                        if (!isNaN(degrees)) {
                            this.fixedAngle = degrees * Math.PI / 180;
                            this.points.push(this.board.create('point', coords));
                            this.toolState = CONFIG.tools.status.ACTIVE;
                        }
                    } else {
                        this.points.push(this.board.create('point', coords));
                        this.toolState = CONFIG.tools.status.ACTIVE;
                    }
                } else if (this.points.length === 1) {
                    this.points.push(this.board.create('point', coords));
                    if (this.currentTool === 'angle_fixed') {
                        const angle = this.fixedAngle;
                        const p1 = this.points[0];
                        const p2 = this.points[1];
                        const dist = p1.Dist(p2);
                        const baseAngle = Math.atan2(p2.Y() - p1.Y(), p2.X() - p1.X());
                        const newAngle = baseAngle + angle;
                        const x = p1.X() + dist * Math.cos(newAngle);
                        const y = p1.Y() + dist * Math.sin(newAngle);
                        const p3 = this.board.create('point', [x, y]);
                        this.board.create('angle', [p2, p1, p3], {name: angle.toFixed(0) + '°'});
                        this.points = [];
                        this.fixedAngle = null;
                        this.toolState = CONFIG.tools.status.PENDING;
                    }
                } else if (this.currentTool === 'angle') {
                    this.points.push(this.board.create('point', coords));
                    this.board.create('angle', this.points, {name: '?°'});
                    this.points = [];
                    this.toolState = CONFIG.tools.status.PENDING;
                }
                break;
                
            case 'distance':
            case 'area':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    const obj = clickedObjects[0];
                    if (obj) {
                        if (this.currentTool === 'distance' && obj.elType === 'point') {
                            this.selectedObjects.push(obj);
                            this.toolState = CONFIG.tools.status.ACTIVE;
                        } else if (this.currentTool === 'area' && obj.elType === 'polygon') {
                            const vertices = obj.vertices;
                            let area = 0;
                            for (let i = 0; i < vertices.length; i++) {
                                const j = (i + 1) % vertices.length;
                                area += vertices[i].X() * vertices[j].Y();
                                area -= vertices[j].X() * vertices[i].Y();
                            }
                            area = Math.abs(area) / 2;
                            this.board.create('text', [
                                obj.vertices[0].X(),
                                obj.vertices[0].Y(),
                                `Area: ${area.toFixed(2)}`
                            ]);
                        }
                    }
                } else if (this.currentTool === 'distance') {
                    const obj = clickedObjects[0];
                    if (obj && obj.elType === 'point') {
                        const p1 = this.selectedObjects[0];
                        const p2 = obj;
                        const dist = p1.Dist(p2);
                        this.board.create('text', [
                            (p1.X() + p2.X())/2,
                            (p1.Y() + p2.Y())/2,
                            `Distance: ${dist.toFixed(2)}`
                        ]);
                        this.selectedObjects = [];
                        this.toolState = CONFIG.tools.status.PENDING;
                    }
                }
                break;
                
            case 'delete':
                if (clickedObjects.length > 0) {
                    clickedObjects[0].remove();
                }
                break;
        }
    }

    // Handle mouse/touch move event
    handleMove(e) {
        if (!this.currentTool) {
            Logger.debug('No tool selected, ignoring move event');
            return;
        }
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        Logger.debug('Handle move event', {
            tool: this.currentTool,
            coords,
            isDragging: this.isDragging,
            state: this.toolState
        });
        
        // Handle move tool dragging
        if (this.currentTool === 'move' && this.isDragging) {
            Logger.debug('Moving object');
            // JSXGraph handles the actual movement
            return;
        }
        
        // Don't show previews unless we're in an active state
        if (this.toolState !== CONFIG.tools.status.ACTIVE) {
            Logger.debug('Tool not active, skipping preview');
            return;
        }
        
        // Clear any temporary objects
        this.clearTemporary();
        
        switch (this.currentTool) {
            case 'line':
            case 'segment':
            case 'ray':
            case 'vector':
                this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                const lineProps = {
                    dash: 2,
                    straightFirst: this.currentTool === 'line',
                    straightLast: this.currentTool !== 'segment',
                    lastArrow: this.currentTool === 'vector'
                };
                this.tempObjects.push(this.board.create('line', [this.points[0], this.tempObjects[0]], lineProps));
                break;
                
            case 'segment_fixed':
                if (this.fixedLength) {
                    const angle = Math.atan2(coords[1] - this.points[0].Y(), coords[0] - this.points[0].X());
                    const endX = this.points[0].X() + this.fixedLength * Math.cos(angle);
                    const endY = this.points[0].Y() + this.fixedLength * Math.sin(angle);
                    this.tempObjects.push(this.board.create('point', [endX, endY], {visible: false}));
                    this.tempObjects.push(this.board.create('segment', [this.points[0], this.tempObjects[0]], {dash: 2}));
                }
                break;
                
            case 'circle':
            case 'circle_radius':
            case 'circle_three_points':
                this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                if (this.currentTool === 'circle_three_points' && this.points.length === 2) {
                    this.tempObjects.push(this.board.create('circumcircle', 
                        [this.points[0], this.points[1], this.tempObjects[0]], {dash: 2}));
                } else {
                    const radius = this.currentTool === 'circle_radius' ? this.fixedRadius :
                        Math.sqrt(Math.pow(coords[0] - this.points[0].X(), 2) + Math.pow(coords[1] - this.points[0].Y(), 2));
                    this.tempObjects.push(this.board.create('circle', [this.points[0], radius], {dash: 2}));
                    
                    // Show radius value
                    if (this.currentTool === 'circle') {
                        this.tempObjects.push(this.board.create('text', [
                            (this.points[0].X() + coords[0])/2,
                            (this.points[0].Y() + coords[1])/2,
                            `r = ${radius.toFixed(2)}`
                        ], {fontSize: 12}));
                    }
                }
                break;
                
            case 'semicircle':
                this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                this.tempObjects.push(this.board.create('semicircle', [this.points[0], this.tempObjects[0]], {dash: 2}));
                break;
                
            case 'polygon':
            case 'regular_polygon':
                this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                if (this.currentTool === 'regular_polygon' && this.points.length === 1) {
                    const center = this.points[0];
                    const radius = Math.sqrt(
                        Math.pow(coords[0] - center.X(), 2) +
                        Math.pow(coords[1] - center.Y(), 2)
                    );
                    const angle = Math.atan2(coords[1] - center.Y(), coords[0] - center.X());
                    
                    const vertices = [this.tempObjects[0]];
                    for (let i = 1; i < this.polygonSides; i++) {
                        const newAngle = angle + (2 * Math.PI * i) / this.polygonSides;
                        const x = center.X() + radius * Math.cos(newAngle);
                        const y = center.Y() + radius * Math.sin(newAngle);
                        vertices.push(this.board.create('point', [x, y], {visible: false}));
                        this.tempObjects.push(vertices[i]);
                    }
                    
                    for (let i = 0; i < this.polygonSides; i++) {
                        this.tempObjects.push(this.board.create('segment', 
                            [vertices[i], vertices[(i + 1) % this.polygonSides]], {dash: 2}));
                    }
                } else {
                    // Show preview of polygon being drawn
                    const vertices = [...this.points, this.tempObjects[0]];
                    for (let i = 0; i < vertices.length - 1; i++) {
                        this.tempObjects.push(this.board.create('segment', 
                            [vertices[i], vertices[i + 1]], {dash: 2}));
                    }
                    // Show closing segment if we have enough points
                    if (vertices.length > 2) {
                        this.tempObjects.push(this.board.create('segment', 
                            [vertices[vertices.length - 1], vertices[0]], {dash: 2}));
                    }
                }
                break;
                
            case 'perpendicular':
            case 'parallel':
                if (this.selectedObjects.length === 1) {
                    const line = this.selectedObjects[0];
                    const point = this.board.create('point', coords, {visible: false});
                    this.tempObjects.push(point);
                    if (this.currentTool === 'perpendicular') {
                        this.tempObjects.push(this.board.create('perpendicular', [line, point], {dash: 2}));
                    } else {
                        this.tempObjects.push(this.board.create('parallel', [line, point], {dash: 2}));
                    }
                }
                break;
                
            case 'angle':
            case 'angle_fixed':
                if (this.points.length === 1) {
                    this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                    this.tempObjects.push(this.board.create('segment', [this.points[0], this.tempObjects[0]], {dash: 2}));
                } else if (this.points.length === 2) {
                    this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                    const angle = this.board.create('angle', [this.tempObjects[0], this.points[0], this.points[1]], 
                        {radius: 1, name: '', withLabel: false});
                    this.tempObjects.push(angle);
                    this.tempObjects.push(this.board.create('segment', [this.points[0], this.tempObjects[0]], {dash: 2}));
                    
                    // Show angle value
                    const angleValue = angle.Value() * 180 / Math.PI;
                    this.tempObjects.push(this.board.create('text', [
                        this.points[0].X() + 1,
                        this.points[0].Y() + 1,
                        `${angleValue.toFixed(1)}°`
                    ], {fontSize: 12}));
                }
                break;
                
            case 'distance':
                if (this.points.length === 1) {
                    this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                    const dist = this.board.create('segment', [this.points[0], this.tempObjects[0]], {dash: 2});
                    this.tempObjects.push(dist);
                    const length = dist.L();
                    const midX = (this.points[0].X() + coords[0]) / 2;
                    const midY = (this.points[0].Y() + coords[1]) / 2;
                    this.tempObjects.push(this.board.create('text', [midX, midY, length.toFixed(2)], 
                        {fontSize: 12, anchorX: 'middle', anchorY: 'middle'}));
                }
                break;
        }
    }

    // Handle mouse/touch up event
    handleUp(e) {
        if (!this.currentTool) {
            Logger.debug('No tool selected, ignoring up event');
            return false;
        }
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        Logger.debug('Handle up event', {
            tool: this.currentTool,
            coords,
            state: this.toolState,
            points: this.points.length
        });
        
        // End dragging for move tool
        if (this.currentTool === 'move') {
            Logger.debug('Ending move drag');
            this.isDragging = false;
            return false;
        }
        
        let objectCreated = false;
        
        switch (this.currentTool) {
            case 'polygon':
                // Check if click is near the first point to close the polygon
                if (this.points.length >= 3) {
                    const firstPoint = this.points[0];
                    const dx = coords[0] - firstPoint.X();
                    const dy = coords[1] - firstPoint.Y();
                    if (Math.sqrt(dx*dx + dy*dy) < 0.5) { // Within 0.5 units
                        Logger.debug('Closing polygon', { points: this.points.length });
                        this.board.create('polygon', this.points);
                        this.toolState = CONFIG.tools.status.PENDING;
                        this.points = [];
                        objectCreated = true;
                    }
                }
                break;
                
            case 'point':
                Logger.debug('Creating point', { coords });
                this.board.create('point', coords);
                objectCreated = true;
                break;
                
            case 'line':
            case 'segment':
            case 'ray':
            case 'vector':
                if (this.points.length === 1) {
                    Logger.debug('Creating line-type object', { type: this.currentTool });
                    const point = this.board.create('point', coords);
                    this.points.push(point);
                    const props = {
                        straightFirst: this.currentTool === 'line',
                        straightLast: this.currentTool !== 'segment',
                        lastArrow: this.currentTool === 'vector'
                    };
                    this.board.create('line', this.points, props);
                    this.points = [];
                    objectCreated = true;
                } else {
                    Logger.debug('Adding first point for line-type object');
                    this.points.push(this.board.create('point', coords));
                }
                break;
        }
        
        // Clear any temporary objects
        this.clearTemporary();
        
        Logger.debug('Tool operation complete', {
            tool: this.currentTool,
            objectCreated,
            remainingPoints: this.points.length
        });
        
        return objectCreated;
    }

    // Clear temporary points and objects
    clearTemporary() {
        this.tempObjects.forEach(obj => {
            if (obj && obj.remove) obj.remove();
        });
        this.tempObjects = [];
    }
}
