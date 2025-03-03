class GeometryTools {
    constructor(board) {
        this.board = board;
        this.currentTool = null;
        this.toolState = CONFIG.tools.status.PENDING;
        this.points = [];
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
        switch (this.currentTool) {
            case 'point':
                this.board.create('point', coords);
                break;
            case 'line':
            case 'segment':
            case 'ray':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else {
                    this.points.push(this.board.create('point', coords));
                    if (this.currentTool === 'line') {
                        this.board.create('line', this.points);
                    } else if (this.currentTool === 'segment') {
                        this.board.create('segment', this.points);
                    } else {
                        this.board.create('ray', this.points);
                    }
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                }
                break;
            case 'circle':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else {
                    this.points.push(this.board.create('point', coords));
                    this.board.create('circle', this.points);
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                }
                break;
            case 'polygon':
                if (this.toolState === CONFIG.tools.status.PENDING) {
                    this.points.push(this.board.create('point', coords));
                    this.toolState = CONFIG.tools.status.ACTIVE;
                } else {
                    this.points.push(this.board.create('point', coords));
                }
                break;
            // Add more tool handlers here
        }
    }

    // Handle mouse/touch move event
    handleMove(e) {
        if (!this.currentTool || this.toolState !== CONFIG.tools.status.ACTIVE) return;
        
        const coords = this.board.getUsrCoordsOfMouse(e);
        switch (this.currentTool) {
            case 'line':
            case 'segment':
            case 'ray':
            case 'circle':
                // Update preview
                break;
            case 'polygon':
                // Update polygon preview
                break;
        }
    }

    // Handle mouse/touch up event
    handleUp(e) {
        if (!this.currentTool) return;
        
        switch (this.currentTool) {
            case 'polygon':
                if (this.points.length >= 3) {
                    this.board.create('polygon', this.points);
                    this.toolState = CONFIG.tools.status.PENDING;
                    this.points = [];
                }
                break;
        }
    }

    // Clear temporary points and objects
    clearTemporary() {
        this.points.forEach(point => {
            if (point && point.remove) point.remove();
        });
        this.points = [];
        this.toolState = CONFIG.tools.status.PENDING;
    }
}
