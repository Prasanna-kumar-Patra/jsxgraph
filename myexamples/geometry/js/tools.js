class GeometryTools {
    constructor(board) {
        this.board = board;
        this.currentTool = null;
        this.toolState = CONFIG.tools.status.PENDING;
        this.points = [];
        this.tempObjects = [];
        this.selectedObjects = [];
    }

    // Set the current tool
    setTool(toolId) {
        this.currentTool = toolId;
        this.toolState = CONFIG.tools.status.PENDING;
        this.points = [];
    }

    // Handle mouse/touch down event
    handleDown(e) {
        if (!this.currentTool) return;
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        const clickedObjects = this.board.getAllObjectsUnderMouse(e);
        
        switch (this.currentTool) {
            case 'move':
                // Handled by JSXGraph's default drag behavior
                break;
                
            case 'point':
                this.board.create('point', coords);
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
                    if (this.currentTool === 'line') {
                        this.board.create('line', this.points);
                    } else if (this.currentTool === 'segment') {
                        this.board.create('segment', this.points);
                    } else if (this.currentTool === 'ray') {
                        this.board.create('line', this.points, {
                            straightFirst: false,
                            straightLast: true
                        });
                    } else {
                        this.board.create('arrow', this.points);
                    }
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                }
                break;
                
            case 'circle_center_point':
            case 'circle_radius':
            case 'circle_three_points':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else if (this.currentTool === 'circle_three_points' && this.points.length < 2) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else {
                    this.points.push(this.board.create('point', coords));
                    if (this.currentTool === 'circle_center_point') {
                        this.board.create('circle', [this.points[0], this.points[1]]);
                    } else if (this.currentTool === 'circle_radius') {
                        const radius = this.points[0].Dist(this.points[1]);
                        this.board.create('circle', [this.points[0], radius]);
                    } else {
                        this.board.create('circumcircle', this.points);
                    }
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                }
                break;
                
            case 'polygon':
            case 'regular_polygon':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else if (this.currentTool === 'regular_polygon' && this.points.length === 1) {
                    this.points.push(this.board.create('point', coords));
                    const center = this.board.create('point', [(this.points[0].X() + this.points[1].X())/2, 
                                                              (this.points[0].Y() + this.points[1].Y())/2]);
                    const vertices = [];
                    const sides = 6; // Default to hexagon
                    const radius = this.points[0].Dist(this.points[1])/2;
                    for (let i = 0; i < sides; i++) {
                        const angle = 2 * Math.PI * i / sides;
                        vertices.push(this.board.create('point', [
                            center.X() + radius * Math.cos(angle),
                            center.Y() + radius * Math.sin(angle)
                        ]));
                    }
                    this.board.create('polygon', vertices);
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                } else {
                    this.points.push(this.board.create('point', coords));
                }
                break;
                
            case 'perpendicular':
            case 'parallel':
                if (clickedObjects.length > 0) {
                    const line = clickedObjects.find(obj => obj.elType === 'line');
                    if (line) {
                        const point = this.board.create('point', coords);
                        if (this.currentTool === 'perpendicular') {
                            this.board.create('perpendicular', [line, point]);
                        } else {
                            this.board.create('parallel', [line, point]);
                        }
                    }
                }
                break;
                
            case 'midpoint':
                if (clickedObjects.length > 0) {
                    const points = clickedObjects.filter(obj => obj.elType === 'point');
                    if (points.length === 2) {
                        this.board.create('midpoint', points);
                    }
                }
                break;
                
            case 'angle':
                if (this.points.length < 3) {
                    this.points.push(this.board.create('point', coords));
                    if (this.points.length === 3) {
                        this.board.create('angle', this.points);
                        this.points = [];
                    }
                }
                break;
                
            case 'distance':
                if (clickedObjects.length > 0) {
                    const obj = clickedObjects[0];
                    if (this.selectedObjects.length === 0) {
                        this.selectedObjects.push(obj);
                    } else {
                        const p1 = this.selectedObjects[0];
                        const p2 = obj;
                        if (p1.elType === 'point' && p2.elType === 'point') {
                            this.board.create('text', [
                                (p1.X() + p2.X())/2,
                                (p1.Y() + p2.Y())/2,
                                () => `Distance: ${p1.Dist(p2).toFixed(2)}`
                            ]);
                        }
                        this.selectedObjects = [];
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
        if (!this.currentTool || this.toolState !== CONFIG.tools.status.ACTIVE) return;
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        
        // Clear any temporary objects
        this.clearTemporary();
        
        switch (this.currentTool) {
            case 'line':
            case 'segment':
            case 'ray':
            case 'vector':
                // Show preview line
                this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                if (this.currentTool === 'line') {
                    this.tempObjects.push(this.board.create('line', [this.points[0], this.tempObjects[0]], {dash: 2}));
                } else if (this.currentTool === 'segment') {
                    this.tempObjects.push(this.board.create('segment', [this.points[0], this.tempObjects[0]], {dash: 2}));
                } else if (this.currentTool === 'ray') {
                    this.tempObjects.push(this.board.create('line', [this.points[0], this.tempObjects[0]], {
                        dash: 2,
                        straightFirst: false,
                        straightLast: true
                    }));
                } else {
                    this.tempObjects.push(this.board.create('arrow', [this.points[0], this.tempObjects[0]], {dash: 2}));
                }
                break;
                
            case 'circle_center_point':
            case 'circle_radius':
            case 'circle_three_points':
                this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                if (this.currentTool === 'circle_three_points' && this.points.length === 2) {
                    this.tempObjects.push(this.board.create('circumcircle', 
                        [this.points[0], this.points[1], this.tempObjects[0]], {dash: 2}));
                } else {
                    this.tempObjects.push(this.board.create('circle', 
                        [this.points[0], this.tempObjects[0]], {dash: 2}));
                }
                break;
                
            case 'polygon':
            case 'regular_polygon':
                this.tempObjects.push(this.board.create('point', coords, {visible: false}));
                if (this.currentTool === 'regular_polygon' && this.points.length === 1) {
                    const center = this.board.create('point', [(this.points[0].X() + coords[0])/2, 
                                                              (this.points[0].Y() + coords[1])/2],
                                                              {visible: false});
                    this.tempObjects.push(center);
                    const vertices = [];
                    const sides = 6;
                    const tempPoint = this.board.create('point', coords, {visible: false});
                    this.tempObjects.push(tempPoint);
                    const radius = this.points[0].Dist(tempPoint)/2;
                    for (let i = 0; i < sides; i++) {
                        const angle = 2 * Math.PI * i / sides;
                        vertices.push(this.board.create('point', [
                            center.X() + radius * Math.cos(angle),
                            center.Y() + radius * Math.sin(angle)
                        ], {visible: false}));
                        this.tempObjects.push(vertices[i]);
                    }
                    this.tempObjects.push(this.board.create('polygon', vertices, {dash: 2}));
                } else {
                    const vertices = [...this.points, this.tempObjects[0]];
                    this.tempObjects.push(this.board.create('polygon', vertices, {dash: 2}));
                }
                break;
        }
    }

    // Handle mouse/touch up event
    handleUp(e) {
        if (!this.currentTool) return;
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        
        switch (this.currentTool) {
            case 'polygon':
                // Check if click is near the first point to close the polygon
                if (this.points.length >= 3) {
                    const firstPoint = this.points[0];
                    const dx = coords[0] - firstPoint.X();
                    const dy = coords[1] - firstPoint.Y();
                    if (Math.sqrt(dx*dx + dy*dy) < 0.5) { // Within 0.5 units
                        this.board.create('polygon', this.points);
                        this.toolState = CONFIG.tools.status.PENDING;
                        this.points = [];
                    }
                }
                break;
        }
        
        // Clear any temporary objects
        this.clearTemporary();
    }

    // Clear temporary points and objects
    clearTemporary() {
        this.tempObjects.forEach(obj => {
            if (obj && obj.remove) obj.remove();
        });
        this.tempObjects = [];
    }
}
