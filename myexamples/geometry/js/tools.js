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
                try {
                    if (this.toolState === CONFIG.tools.status.PENDING) {
                        const point = this.board.create('point', coords);
                        if (!point) throw new Error('Failed to create first point');
                        
                        this.points = [point]; // Reset points array with new point
                        this.toolState = CONFIG.tools.status.ACTIVE;
                        Logger.debug('Created first point for line-type tool', { coords });
                    } else {
                        const point = this.board.create('point', coords);
                        if (!point) throw new Error('Failed to create second point');
                        
                        if (!this.points[0]) throw new Error('First point is missing');
                        
                        const props = {
                            straightFirst: this.currentTool === 'line',
                            straightLast: this.currentTool !== 'segment',
                            lastArrow: this.currentTool === 'vector'
                        };
                        
                        const line = this.board.create('line', [this.points[0], point], props);
                        if (!line) throw new Error('Failed to create line');
                        
                        Logger.debug('Created line-type object', { type: this.currentTool });
                        this.toolState = CONFIG.tools.status.PENDING;
                        this.points = [];
                    }
                } catch (error) {
                    Logger.error('Error in line tool:', error);
                    this.clearTemporary();
                    this.points = [];
                    this.toolState = CONFIG.tools.status.PENDING;
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
            case 'semicircle':
            case 'circular_arc':
            case 'circular_sector':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    // Starting point for all circle types
                    const centerPoint = this.board.create('point', coords);
                    this.points.push(centerPoint);
                    
                    if (this.currentTool === 'circle_radius') {
                        const radius = parseFloat(prompt('Enter circle radius:', '5'));
                        if (!isNaN(radius)) {
                            this.board.create('circle', [centerPoint, radius]);
                            this.points = [];
                            this.toolState = CONFIG.tools.status.PENDING;
                        } else {
                            centerPoint.remove();
                            this.points = [];
                        }
                    } else {
                        this.toolState = CONFIG.tools.status.ACTIVE;
                    }
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
            case 'rectangle':
            case 'triangle':
                try {
                    if (this.toolState === CONFIG.tools.status.PENDING) {
                        if (this.currentTool === 'regular_polygon') {
                            const sides = parseInt(prompt('Enter number of sides (3-12):', '6'));
                            if (!isNaN(sides) && sides >= 3 && sides <= 12) {
                                this.polygonSides = sides;
                                const point = this.board.create('point', coords);
                                if (!point) throw new Error('Failed to create center point');
                                
                                this.points = [point];
                                this.toolState = CONFIG.tools.status.ACTIVE;
                                Logger.debug('Started regular polygon', { sides });
                            }
                        } else if (this.currentTool === 'rectangle' || this.currentTool === 'triangle') {
                            const point = this.board.create('point', coords);
                            if (!point) throw new Error('Failed to create first point');
                            
                            this.points = [point];
                            this.toolState = CONFIG.tools.status.ACTIVE;
                            Logger.debug(`Started ${this.currentTool}`);
                        } else {
                            // Check if we're closing the polygon
                            if (this.points.length >= 3) {
                                const clickedPoint = this.getClickedPoint(clickedObjects);
                                if (clickedPoint && this.isNearPoint(clickedPoint, this.points[0])) {
                                    Logger.debug('Closing polygon', { vertices: this.points.length });
                                    const polygon = this.board.create('polygon', this.points);
                                    if (!polygon) throw new Error('Failed to create polygon');
                                    
                                    this.points = [];
                                    this.toolState = CONFIG.tools.status.PENDING;
                                    break;
                                }
                            }
                            
                            // Add new vertex
                            const point = this.board.create('point', coords);
                            if (!point) throw new Error('Failed to create polygon vertex');
                            
                            this.points.push(point);
                            this.toolState = CONFIG.tools.status.ACTIVE;
                            Logger.debug('Added polygon vertex', { vertices: this.points.length });
                        }
                    } else if (this.currentTool === 'regular_polygon' && this.points.length === 1) {
                        const center = this.points[0];
                        if (!center) throw new Error('Missing center point');
                        
                        const vertex = this.board.create('point', coords);
                        if (!vertex) throw new Error('Failed to create vertex point');
                        
                        const radius = center.Dist(vertex);
                        const angle = Math.atan2(vertex.Y() - center.Y(), vertex.X() - center.X());
                        
                        const vertices = [vertex];
                        // Create vertices for regular polygon
                        for (let i = 1; i < this.polygonSides; i++) {
                            const newAngle = angle + (2 * Math.PI * i) / this.polygonSides;
                            const x = center.X() + radius * Math.cos(newAngle);
                            const y = center.Y() + radius * Math.sin(newAngle);
                            const point = this.board.create('point', [x, y]);
                            if (!point) throw new Error(`Failed to create vertex ${i}`);
                            vertices.push(point);
                        }
                        
                        // Create the polygon
                        const polygon = this.board.create('polygon', vertices);
                        if (!polygon) throw new Error('Failed to create regular polygon');
                        
                        Logger.debug('Created regular polygon', { 
                            sides: this.polygonSides,
                            radius,
                            center: [center.X(), center.Y()]
                        });
                        
                        // Cleanup
                        center.remove();
                        this.points = [];
                        this.polygonSides = null;
                        this.toolState = CONFIG.tools.status.PENDING;
                    } else if (this.currentTool === 'rectangle' && this.points.length === 1) {
                        const p1 = this.points[0];
                        const p2 = this.board.create('point', coords);
                        
                        // Calculate rectangle vertices
                        const dx = p2.X() - p1.X();
                        const dy = p2.Y() - p1.Y();
                        
                        const p3 = this.board.create('point', [p2.X(), p1.Y()]);
                        const p4 = this.board.create('point', [p1.X(), p2.Y()]);
                        
                        const polygon = this.board.create('polygon', [p1, p3, p2, p4]);
                        if (!polygon) throw new Error('Failed to create rectangle');
                        
                        Logger.debug('Created rectangle');
                        this.points = [];
                        this.toolState = CONFIG.tools.status.PENDING;
                    } else if (this.currentTool === 'triangle' && this.points.length === 1) {
                        const p1 = this.points[0];
                        const p2 = this.board.create('point', coords);
                        
                        // For triangle, let user specify second point and create an equilateral triangle
                        const dist = p1.Dist(p2);
                        const angle = Math.atan2(p2.Y() - p1.Y(), p2.X() - p1.X());
                        
                        // Calculate third point (60 degrees from base)
                        const x3 = p1.X() + dist * Math.cos(angle + Math.PI / 3);
                        const y3 = p1.Y() + dist * Math.sin(angle + Math.PI / 3);
                        const p3 = this.board.create('point', [x3, y3]);
                        
                        const polygon = this.board.create('polygon', [p1, p2, p3]);
                        if (!polygon) throw new Error('Failed to create triangle');
                        
                        Logger.debug('Created triangle');
                        this.points = [];
                        this.toolState = CONFIG.tools.status.PENDING;
                    }
                } catch (error) {
                    Logger.error('Error in polygon tool:', error);
                    this.clearTemporary();
                    this.points = [];
                    this.polygonSides = null;
                    this.toolState = CONFIG.tools.status.PENDING;
                }
                break;

            case 'perpendicular':
            case 'parallel':
            case 'midpoint':
            case 'intersection':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    // Find nearest line or point
                    const nearestObject = this.findNearestObject(coords, clickedObjects);
                    if (nearestObject) {
                        this.selectedObjects = [nearestObject];
                        this.toolState = CONFIG.tools.status.ACTIVE;
                        Logger.debug(`Selected first object for ${this.currentTool}`, nearestObject);
                    }
                } else if (this.toolState === CONFIG.tools.status.ACTIVE) {
                    const nearestObject = this.findNearestObject(coords, clickedObjects);
                    if (nearestObject) {
                        try {
                            let constructedObject;
                            const obj1 = this.selectedObjects[0];
                            const obj2 = nearestObject;
                            
                            if (this.currentTool === 'perpendicular') {
                                if ((obj1.elType === 'line' || obj1.elType === 'segment') && 
                                    obj2.elType === 'point') {
                                    // First object is line, second is point
                                    constructedObject = this.board.create('perpendicular', 
                                        [obj1, obj2], {
                                            strokeColor: '#0000ff',
                                            strokeWidth: 2
                                        });
                                } else if (obj1.elType === 'point' && 
                                         (obj2.elType === 'line' || obj2.elType === 'segment')) {
                                    // First object is point, second is line
                                    constructedObject = this.board.create('perpendicular', 
                                        [obj2, obj1], {
                                            strokeColor: '#0000ff',
                                            strokeWidth: 2
                                        });
                                }
                            } else if (this.currentTool === 'parallel') {
                                if ((obj1.elType === 'line' || obj1.elType === 'segment') && 
                                    obj2.elType === 'point') {
                                    // First object is line, second is point
                                    constructedObject = this.board.create('parallel', 
                                        [obj1, obj2], {
                                            strokeColor: '#0000ff',
                                            strokeWidth: 2
                                        });
                                } else if (obj1.elType === 'point' && 
                                         (obj2.elType === 'line' || obj2.elType === 'segment')) {
                                    // First object is point, second is line
                                    constructedObject = this.board.create('parallel', 
                                        [obj2, obj1], {
                                            strokeColor: '#0000ff',
                                            strokeWidth: 2
                                        });
                                }
                            } else if (this.currentTool === 'midpoint') {
                                if (obj1.elType === 'point' && obj2.elType === 'point') {
                                    // Create midpoint between two points
                                    const x = (obj1.X() + obj2.X()) / 2;
                                    const y = (obj1.Y() + obj2.Y()) / 2;
                                    
                                    constructedObject = this.board.create('point', [x, y], {
                                        name: 'M',
                                        fixed: true,
                                        strokeColor: '#0000ff',
                                        fillColor: '#0000ff',
                                        size: 4
                                    });
                                } else if ((obj1.elType === 'line' || obj1.elType === 'segment')) {
                                    // Create midpoint of a line/segment
                                    constructedObject = this.board.create('point', [
                                        (obj1.point1.X() + obj1.point2.X()) / 2,
                                        (obj1.point1.Y() + obj1.point2.Y()) / 2
                                    ], {
                                        name: 'M',
                                        fixed: true,
                                        strokeColor: '#0000ff',
                                        fillColor: '#0000ff',
                                        size: 4
                                    });
                                }
                            } else if (this.currentTool === 'intersection') {
                                if ((obj1.elType === 'line' || obj1.elType === 'segment') && 
                                    (obj2.elType === 'line' || obj2.elType === 'segment')) {
                                    constructedObject = this.board.create('intersection', 
                                        [obj1, obj2, 0], {
                                            strokeColor: '#0000ff',
                                            fillColor: '#0000ff',
                                            size: 4
                                        });
                                }
                            }
                            
                            if (!constructedObject) {
                                throw new Error('Invalid object types for construction');
                            }
                            
                            Logger.debug(`Created ${this.currentTool}`, constructedObject);
                        } catch (error) {
                            Logger.error(`Failed to create ${this.currentTool}:`, error);
                            alert(`Could not create ${this.currentTool}. Please check the selected objects.`);
                        }
                        
                        this.selectedObjects = [];
                        this.toolState = CONFIG.tools.status.PENDING;
                    }
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
        if (!this.currentTool) return;
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        
        // Handle move tool dragging
        if (this.currentTool === 'move' && this.isDragging) {
            // JSXGraph handles the actual movement
            return;
        }
        
        // Don't show previews unless we're in an active state
        if (this.toolState !== CONFIG.tools.status.ACTIVE) return;
        
        // Clear any temporary objects
        this.clearTemporary();
        
        switch (this.currentTool) {
            case 'line':
            case 'segment':
            case 'ray':
            case 'vector':
                if (this.points.length > 0 && this.points[0]) {
                    const tempPoint = this.board.create('point', coords, {visible: false});
                    this.tempObjects.push(tempPoint);
                    
                    const lineProps = {
                        dash: 2,
                        straightFirst: this.currentTool === 'line',
                        straightLast: this.currentTool !== 'segment',
                        lastArrow: this.currentTool === 'vector'
                    };
                    
                    try {
                        const line = this.board.create('line', [this.points[0], tempPoint], lineProps);
                        this.tempObjects.push(line);
                    } catch (error) {
                        Logger.error('Failed to create line preview:', error);
                        this.clearTemporary(); // Clean up on error
                    }
                }
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
            case 'semicircle':
            case 'circular_arc':
            case 'circular_sector':
                if (this.points.length === 1 && this.toolState === CONFIG.tools.status.ACTIVE) {
                    this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                    
                    if (this.currentTool === 'circle') {
                        // Show preview for regular circle
                        const radius = Math.sqrt(
                            Math.pow(coords[0] - this.points[0].X(), 2) + 
                            Math.pow(coords[1] - this.points[0].Y(), 2)
                        );
                        
                        // Show radius line
                        this.tempObjects.push(this.board.create('segment', 
                            [this.points[0], this.tempObjects[0]], {dash: 2}));
                        
                        // Show circle preview
                        this.tempObjects.push(this.board.create('circle', 
                            [this.points[0], radius], {dash: 2}));
                        
                        // Show radius value
                        this.tempObjects.push(this.board.create('text', [
                            (this.points[0].X() + coords[0])/2,
                            (this.points[0].Y() + coords[1])/2,
                            `r = ${radius.toFixed(1)}`
                        ], {fontSize: 12}));
                    } else if (this.currentTool === 'circle_three_points') {
                        // Show preview for three-point circle
                        const p3 = this.board.create('point', [
                            coords[0] + (coords[1] - this.points[0].Y()),
                            coords[1] - (coords[0] - this.points[0].X())
                        ], {visible: false});
                        this.tempObjects.push(p3);
                        
                        // Show guide lines
                        this.tempObjects.push(this.board.create('segment', 
                            [this.points[0], this.tempObjects[0]], {dash: 2}));
                        this.tempObjects.push(this.board.create('segment', 
                            [this.tempObjects[0], p3], {dash: 2}));
                        this.tempObjects.push(this.board.create('segment', 
                            [p3, this.points[0]], {dash: 2}));
                        
                        // Show circle preview
                        this.tempObjects.push(this.board.create('circumcircle', 
                            [this.points[0], this.tempObjects[0], p3], {dash: 2}));
                    } else if (this.currentTool === 'semicircle') {
                        // Show preview for semicircle
                        this.tempObjects.push(this.board.create('semicircle', 
                            [this.points[0], this.tempObjects[0]], {dash: 2}));
                            
                        // Show radius line
                        this.tempObjects.push(this.board.create('segment', 
                            [this.points[0], this.tempObjects[0]], {dash: 2}));
                    } else if (this.currentTool === 'circular_arc' || this.currentTool === 'circular_sector') {
                        // Calculate angles for preview
                        const center = this.points[0];
                        const startAngle = 0; // Fixed start angle at positive x-axis
                        const endAngle = Math.atan2(coords[1] - center.Y(), coords[0] - center.X());
                        const radius = Math.sqrt(
                            Math.pow(coords[0] - center.X(), 2) + 
                            Math.pow(coords[1] - center.Y(), 2)
                        );
                        
                        // Show radius lines
                        this.tempObjects.push(this.board.create('segment', 
                            [center, this.tempObjects[0]], {dash: 2}));
                        
                        // Show preview
                        if (this.currentTool === 'circular_arc') {
                            this.tempObjects.push(this.board.create('arc', 
                                [center, this.tempObjects[0], endAngle], {
                                    dash: 2,
                                    strokeColor: '#0000ff',
                                    strokeWidth: 2
                                }));
                        } else {
                            this.tempObjects.push(this.board.create('sector', 
                                [center, this.tempObjects[0], endAngle], {
                                    dash: 2,
                                    fillColor: '#0000ff',
                                    fillOpacity: 0.1,
                                    strokeColor: '#0000ff',
                                    strokeWidth: 2
                                }));
                        }
                        
                        // Show angle value
                        const angleDeg = Math.abs((endAngle * 180 / Math.PI)).toFixed(1);
                        this.tempObjects.push(this.board.create('text', [
                            center.X() + radius * Math.cos(endAngle/2) * 0.7,
                            center.Y() + radius * Math.sin(endAngle/2) * 0.7,
                            `${angleDeg}°`
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
            case 'rectangle':
            case 'triangle':
            case 'quadrilateral':
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
                } else if (this.currentTool === 'rectangle' && this.points.length === 1) {
                    const p1 = this.points[0];
                    const p2 = coords;
                    
                    // Calculate rectangle vertices
                    const vertices = [
                        p1,
                        this.board.create('point', [p2[0], p1.Y()], {visible: false}),
                        this.board.create('point', [p2[0], p2[1]], {visible: false}),
                        this.board.create('point', [p1.X(), p2[1]], {visible: false})
                    ];
                    
                    // Add vertices to temp objects
                    vertices.slice(1).forEach(v => this.tempObjects.push(v));
                    
                    // Create segments
                    for (let i = 0; i < 4; i++) {
                        this.tempObjects.push(this.board.create('segment', 
                            [vertices[i], vertices[(i + 1) % 4]], {dash: 2}));
                    }
                    
                    // Show dimensions
                    const width = Math.abs(p2[0] - p1.X());
                    const height = Math.abs(p2[1] - p1.Y());
                    this.tempObjects.push(this.board.create('text', [
                        (p1.X() + p2[0])/2, p1.Y() - 0.5,
                        `w = ${width.toFixed(1)}`
                    ], {fontSize: 12}));
                    this.tempObjects.push(this.board.create('text', [
                        p1.X() - 0.5, (p1.Y() + p2[1])/2,
                        `h = ${height.toFixed(1)}`
                    ], {fontSize: 12}));
                } else if (this.currentTool === 'triangle' && this.points.length === 1) {
                    const p1 = this.points[0];
                    const p2 = coords;
                    
                    // Calculate equilateral triangle vertices
                    const dist = Math.sqrt(
                        Math.pow(p2[0] - p1.X(), 2) +
                        Math.pow(p2[1] - p1.Y(), 2)
                    );
                    const angle = Math.atan2(p2[1] - p1.Y(), p2[0] - p1.X());
                    
                    // Calculate third point (60 degrees from base)
                    const x3 = p1.X() + dist * Math.cos(angle + Math.PI / 3);
                    const y3 = p1.Y() + dist * Math.sin(angle + Math.PI / 3);
                    
                    const vertices = [
                        p1,
                        this.board.create('point', [p2[0], p2[1]], {visible: false}),
                        this.board.create('point', [x3, y3], {visible: false})
                    ];
                    
                    // Add vertices to temp objects
                    vertices.slice(1).forEach(v => this.tempObjects.push(v));
                    
                    // Create segments
                    for (let i = 0; i < 3; i++) {
                        this.tempObjects.push(this.board.create('segment', 
                            [vertices[i], vertices[(i + 1) % 3]], {dash: 2}));
                    }
                    
                    // Show side length
                    this.tempObjects.push(this.board.create('text', [
                        (p1.X() + p2[0])/2, (p1.Y() + p2[1])/2,
                        `a = ${dist.toFixed(1)}`
                    ], {fontSize: 12}));
                } else if (this.currentTool === 'polygon') {
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
                    const obj1 = this.selectedObjects[0];
                    const tempPoint = this.board.create('point', coords, {visible: false});
                    this.tempObjects.push(tempPoint);
                    
                    try {
                        if (obj1.elType === 'point') {
                            // If first object is a point, create a temporary line
                            const tempLine = this.board.create('line', 
                                [tempPoint, [tempPoint.X() + 1, tempPoint.Y()]], 
                                {visible: false});
                            this.tempObjects.push(tempLine);
                            
                            // Create perpendicular/parallel through the point
                            const constructedLine = this.board.create(
                                this.currentTool === 'perpendicular' ? 'perpendicular' : 'parallel',
                                [tempLine, obj1],
                                {dash: 2, strokeColor: '#0000ff', strokeWidth: 2}
                            );
                            this.tempObjects.push(constructedLine);
                        } else if (obj1.elType === 'line' || obj1.elType === 'segment') {
                            // If first object is a line, create perpendicular/parallel through temp point
                            const constructedLine = this.board.create(
                                this.currentTool === 'perpendicular' ? 'perpendicular' : 'parallel',
                                [obj1, tempPoint],
                                {dash: 2, strokeColor: '#0000ff', strokeWidth: 2}
                            );
                            this.tempObjects.push(constructedLine);
                        }
                    } catch (error) {
                        Logger.error(`Error creating ${this.currentTool} preview:`, error);
                    }
                }
                break;
                
            case 'rotate':
            case 'translate':
            case 'reflect':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    // Select object to transform
                    const clickedObj = this.findNearestObject(coords, clickedObjects);
                    if (clickedObj) {
                        this.selectedObjects = [clickedObj];
                        this.toolState = CONFIG.tools.status.ACTIVE;
                        Logger.debug(`Selected object for ${this.currentTool}`, clickedObj);
                    }
                } else if (this.toolState === CONFIG.tools.status.ACTIVE) {
                    try {
                        const obj = this.selectedObjects[0];
                        let newObj;

                        // Create a copy of the original object
                        if (obj.elType === 'point') {
                            newObj = this.board.create('point', [obj.X(), obj.Y()], {
                                name: obj.name + '′',
                                strokeColor: '#0000ff',
                                fillColor: '#0000ff',
                                size: 4
                            });
                        } else if (obj.elType === 'line' || obj.elType === 'segment') {
                            const p1 = this.board.create('point', [obj.point1.X(), obj.point1.Y()], {
                                visible: false,
                                fixed: true
                            });
                            const p2 = this.board.create('point', [obj.point2.X(), obj.point2.Y()], {
                                visible: false,
                                fixed: true
                            });
                            newObj = this.board.create(obj.elType, [p1, p2], {
                                name: obj.name + '′',
                                strokeColor: '#0000ff',
                                strokeWidth: 2
                            });
                        }

                        if (newObj) {
                            if (this.currentTool === 'rotate') {
                                // Create rotation center and transform
                                const center = this.board.create('point', coords, {
                                    name: 'C',
                                    strokeColor: '#0000ff',
                                    fillColor: '#0000ff',
                                    size: 4
                                });
                                const angle = Math.PI / 2; // 90 degrees
                                const transform = this.board.create('transform', [angle, center], {type: 'rotate'});
                                transform.bindTo(newObj);
                            } else if (this.currentTool === 'translate') {
                                // Create translation vector and transform
                                const dx = coords[0] - obj.X();
                                const dy = coords[1] - obj.Y();
                                const transform = this.board.create('transform', [dx, dy], {type: 'translate'});
                                transform.bindTo(newObj);
                                
                                // Show translation vector
                                this.board.create('arrow', [obj, coords], {
                                    strokeColor: '#0000ff',
                                    strokeWidth: 2,
                                    dash: 2
                                });
                            } else if (this.currentTool === 'reflect') {
                                // Create reflection line and transform
                                const reflectLine = this.board.create('line', 
                                    [[coords[0] - 2, coords[1]], [coords[0] + 2, coords[1]]], {
                                        name: 'l',
                                        strokeColor: '#0000ff',
                                        strokeWidth: 2
                                    });
                                const transform = this.board.create('transform', [reflectLine], {type: 'reflect'});
                                transform.bindTo(newObj);
                            }
                        }
                        
                        this.selectedObjects = [];
                        this.toolState = CONFIG.tools.status.PENDING;
                    } catch (error) {
                        Logger.error(`Error applying ${this.currentTool} transform:`, error);
                        alert(`Could not apply ${this.currentTool} transform. Please try again.`);
                        this.selectedObjects = [];
                        this.toolState = CONFIG.tools.status.PENDING;
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
        
        // Handle shape completion on mouse up
        if ((this.currentTool === 'rectangle' || this.currentTool === 'triangle' || 
             this.currentTool === 'circle' || this.currentTool === 'circle_three_points' ||
             this.currentTool === 'semicircle' || this.currentTool === 'circular_arc' ||
             this.currentTool === 'circular_sector') && 
            this.points.length === 1 && this.toolState === CONFIG.tools.status.ACTIVE) {
            try {
                if (this.currentTool === 'rectangle') {
                    const p1 = this.points[0];
                    const p2 = this.board.create('point', coords);
                    const p3 = this.board.create('point', [p2.X(), p1.Y()]);
                    const p4 = this.board.create('point', [p1.X(), p2.Y()]);
                    
                    const polygon = this.board.create('polygon', [p1, p3, p2, p4]);
                    if (!polygon) throw new Error('Failed to create rectangle');
                    
                    // Show dimensions
                    const width = Math.abs(p2.X() - p1.X());
                    const height = Math.abs(p2.Y() - p1.Y());
                    this.board.create('text', [
                        (p1.X() + p2.X())/2, p1.Y() - 0.5,
                        `w = ${width.toFixed(1)}`
                    ], {fontSize: 12});
                    this.board.create('text', [
                        p1.X() - 0.5, (p1.Y() + p2.Y())/2,
                        `h = ${height.toFixed(1)}`
                    ], {fontSize: 12});
                    
                    Logger.debug('Created rectangle', { width, height });
                } else if (this.currentTool === 'triangle') {
                    const p1 = this.points[0];
                    const p2 = this.board.create('point', coords);
                    
                    const dist = Math.sqrt(
                        Math.pow(coords[0] - p1.X(), 2) +
                        Math.pow(coords[1] - p1.Y(), 2)
                    );
                    const angle = Math.atan2(coords[1] - p1.Y(), coords[0] - p1.X());
                    
                    // Calculate third point (60 degrees from base)
                    const x3 = p1.X() + dist * Math.cos(angle + Math.PI / 3);
                    const y3 = p1.Y() + dist * Math.sin(angle + Math.PI / 3);
                    const p3 = this.board.create('point', [x3, y3]);
                    
                    const polygon = this.board.create('polygon', [p1, p2, p3]);
                    if (!polygon) throw new Error('Failed to create triangle');
                    
                    // Show side length
                    this.board.create('text', [
                        (p1.X() + p2.X())/2, (p1.Y() + p2.Y())/2,
                        `a = ${dist.toFixed(1)}`
                    ], {fontSize: 12});
                    
                    Logger.debug('Created triangle', { sideLength: dist });
                } else if (this.currentTool === 'circle') {
                    const p1 = this.points[0];
                    const radius = Math.sqrt(
                        Math.pow(coords[0] - p1.X(), 2) +
                        Math.pow(coords[1] - p1.Y(), 2)
                    );
                    
                    const circle = this.board.create('circle', [p1, radius]);
                    if (!circle) throw new Error('Failed to create circle');
                    
                    // Show radius value
                    this.board.create('text', [
                        (p1.X() + coords[0])/2,
                        (p1.Y() + coords[1])/2,
                        `r = ${radius.toFixed(1)}`
                    ], {fontSize: 12});
                    
                    Logger.debug('Created circle', { radius });
                } else if (this.currentTool === 'circle_three_points') {
                    const p1 = this.points[0];
                    const p2 = this.board.create('point', coords);
                    const p3 = this.board.create('point', [
                        coords[0] + (coords[1] - p1.Y()),
                        coords[1] - (coords[0] - p1.X())
                    ]);
                    
                    const circle = this.board.create('circumcircle', [p1, p2, p3]);
                    if (!circle) throw new Error('Failed to create three-point circle');
                    
                    Logger.debug('Created three-point circle');
                } else if (this.currentTool === 'semicircle') {
                    const p1 = this.points[0];
                    const p2 = this.board.create('point', coords);
                    
                    const semicircle = this.board.create('semicircle', [p1, p2]);
                    if (!semicircle) throw new Error('Failed to create semicircle');
                    
                    Logger.debug('Created semicircle');
                } else if (this.currentTool === 'circular_arc' || this.currentTool === 'circular_sector') {
                    const center = this.points[0];
                    const p2 = this.board.create('point', coords);
                    
                    // Calculate radius and angles
                    const radius = Math.sqrt(
                        Math.pow(coords[0] - center.X(), 2) + 
                        Math.pow(coords[1] - center.Y(), 2)
                    );
                    
                    // Create points for the arc/sector
                    const startAngle = 0; // Fixed start angle at positive x-axis
                    const endAngle = Math.atan2(coords[1] - center.Y(), coords[0] - center.X());
                    
                    let shape;
                    if (this.currentTool === 'circular_arc') {
                        // Create arc from center through p2
                        shape = this.board.create('arc', [center, p2, endAngle], {
                            strokeColor: '#0000ff',
                            strokeWidth: 2
                        });
                        if (!shape) throw new Error('Failed to create circular arc');
                    } else {
                        // Create sector from center through p2
                        shape = this.board.create('sector', [center, p2, endAngle], {
                            fillColor: '#0000ff',
                            fillOpacity: 0.3,
                            strokeColor: '#0000ff',
                            strokeWidth: 2
                        });
                        if (!shape) throw new Error('Failed to create circular sector');
                    }
                    
                    // Show angle value
                    const angleDeg = Math.abs((endAngle * 180 / Math.PI)).toFixed(1);
                    this.board.create('text', [
                        center.X() + radius * Math.cos(endAngle/2) * 0.7,
                        center.Y() + radius * Math.sin(endAngle/2) * 0.7,
                        `${angleDeg}°`
                    ], {fontSize: 12});
                    
                    Logger.debug(`Created ${this.currentTool}`, { angle: angleDeg });
                }
                
                this.points = [];
                this.toolState = CONFIG.tools.status.PENDING;
                this.clearTemporary();
                return true;
            } catch (error) {
                Logger.error(`Error creating ${this.currentTool}:`, error);
                this.clearTemporary();
                this.points = [];
                this.toolState = CONFIG.tools.status.PENDING;
                return false;
            }
        }
        
        let objectCreated = false;
        
        switch (this.currentTool) {
            case 'polygon':
            case 'quadrilateral':
                // For quadrilateral, automatically close after 4 points
                if (this.currentTool === 'quadrilateral' && this.points.length === 3) {
                    const newPoint = this.board.create('point', coords);
                    this.points.push(newPoint);
                    Logger.debug('Creating quadrilateral', { points: this.points.length });
                    this.board.create('polygon', this.points);
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                    objectCreated = true;
                    break;
                }
                
                // For regular polygon, check if click is near first point to close
                if (this.currentTool === 'polygon' && this.points.length >= 3) {
                    const firstPoint = this.points[0];
                    const dx = coords[0] - firstPoint.X();
                    const dy = coords[1] - firstPoint.Y();
                    if (Math.sqrt(dx*dx + dy*dy) < 0.5) { // Within 0.5 units
                        Logger.debug('Closing polygon', { points: this.points.length });
                        this.board.create('polygon', this.points);
                        this.toolState = CONFIG.tools.status.PENDING;
                        this.points = [];
                        objectCreated = true;
                        break;
                    }
                }
                
                // Add new point if not closing
                const newPoint = this.board.create('point', coords);
                this.points.push(newPoint);
                this.toolState = CONFIG.tools.status.ACTIVE;
                objectCreated = true;
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
    
    // Helper function to get a clicked point from a list of objects
    getClickedPoint(objects) {
        if (!objects || !Array.isArray(objects)) return null;
        return objects.find(obj => obj.elType === 'point');
    }
    
    // Helper function to check if a point is near another point
    isNearPoint(point1, point2, threshold = 0.5) {
        if (!point1 || !point2) return false;
        const dx = point1.X() - point2.X();
        const dy = point1.Y() - point2.Y();
        return Math.sqrt(dx * dx + dy * dy) < threshold;
    }
    
    // Helper function to find nearest object of specified types
    findNearestObject(coords, objects) {
        if (!objects || !Array.isArray(objects)) return null;
        
        // First check for exact clicks on points or lines
        const clickedObject = objects.find(obj => 
            obj.elType === 'point' || 
            obj.elType === 'line' || 
            obj.elType === 'segment');
            
        if (clickedObject) {
            Logger.debug('Found clicked object:', clickedObject);
            return clickedObject;
        }
        
        return null;
    }
}
