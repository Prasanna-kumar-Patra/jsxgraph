const CONFIG = {
    // Application version
    version: '1.0.0',
    
    // Touch configuration
    touch: {
        tapTimeout: 300,      // Maximum ms between tap start and end
        dragThreshold: 5,     // Minimum pixels moved to start drag
        doubleTapTimeout: 300 // Maximum ms between taps for double tap
    },
    // Board configuration
    board: {
        boundingBox: [-20, 20, 20, -20],
        axis: true,
        grid: true,
        showNavigation: false,
        showCopyright: false,
        defaultAxes: {
            x: { name: 'x', withLabel: true, label: { position: 'rt', offset: [-10, 15] } },
            y: { name: 'y', withLabel: true, label: { position: 'rt', offset: [15, -10] } }
        }
    },

    // Tool categories and their tools
    tools: {
        // Status tracking
        status: {
            PENDING: 'pending',   // Tool action not started
            ACTIVE: 'active',     // Tool action in progress
            COMPLETE: 'complete'  // Tool action completed
        },
        basic: {
            name: "Basic Tools",
            tools: [
                { id: "move", name: "Move", icon: "move.svg", cursor: "move" },
                { id: "point", name: "Point", icon: "point.svg", cursor: "crosshair" },
                { id: "delete", name: "Delete", icon: "delete.svg", cursor: "not-allowed" },
                { id: "undo", name: "Undo", icon: "undo.svg" },
                { id: "redo", name: "Redo", icon: "redo.svg" }
            ]
        },
        construct: {
            name: "Construct",
            tools: [
                { id: "midpoint", name: "Midpoint", icon: "midpoint.svg", cursor: "crosshair" },
                { id: "perpendicular", name: "Perpendicular", icon: "perpendicular.svg", cursor: "crosshair" },
                { id: "parallel", name: "Parallel", icon: "parallel.svg", cursor: "crosshair" },
                { id: "angle_bisector", name: "Angle Bisector", icon: "angle_bisector.svg", cursor: "crosshair" },
                { id: "tangent", name: "Tangent", icon: "tangent.svg", cursor: "crosshair" },
                { id: "perpendicular_bisector", name: "Perpendicular Bisector", icon: "perpendicular_bisector.svg", cursor: "crosshair" },
                { id: "locus", name: "Locus", icon: "locus.svg", cursor: "crosshair" }
            ]
        },
        measure: {
            name: "Measure",
            tools: [
                { id: "angle", name: "Angle", icon: "angle.svg", cursor: "crosshair" },
                { id: "angle_fixed", name: "Angle with Given Size", icon: "angle_fixed.svg", cursor: "crosshair" },
                { id: "distance", name: "Distance", icon: "distance.svg", cursor: "crosshair" },
                { id: "area", name: "Area", icon: "area.svg", cursor: "crosshair" },
                { id: "slope", name: "Slope", icon: "slope.svg", cursor: "crosshair" }
            ]
        },
        lines: {
            name: "Lines",
            tools: [
                { id: "segment", name: "Segment", icon: "segment.svg", cursor: "crosshair" },
                { id: "segment_fixed", name: "Segment with Given Length", icon: "segment_fixed.svg", cursor: "crosshair" },
                { id: "ray", name: "Ray", icon: "ray.svg", cursor: "crosshair" },
                { id: "line", name: "Line", icon: "line.svg", cursor: "crosshair" },
                { id: "vector", name: "Vector", icon: "vector.svg", cursor: "crosshair" },
                { id: "polyline", name: "Polyline", icon: "polyline.svg", cursor: "crosshair" }
            ]
        },

        circles: {
            name: "Circles",
            tools: [
                { id: "circle", name: "Circle with Center", icon: "circle.svg", cursor: "crosshair" },
                { id: "circle_radius", name: "Circle with Radius", icon: "circle_radius.svg", cursor: "crosshair" },
                { id: "circle_three_points", name: "Circle through 3 Points", icon: "circle_three_points.svg", cursor: "crosshair" },
                { id: "semicircle", name: "Semicircle", icon: "semicircle.svg", cursor: "crosshair" },
                { id: "arc_three_points", name: "Circular Arc", icon: "arc.svg", cursor: "crosshair" },
                { id: "sector_three_points", name: "Circular Sector", icon: "sector.svg", cursor: "crosshair" }
            ]
        },

        polygons: {
            name: "Polygons",
            tools: [
                { id: "polygon", name: "Polygon", icon: "polygon.svg", cursor: "crosshair" },
                { id: "regular_polygon", name: "Regular Polygon", icon: "regular_polygon.svg", cursor: "crosshair" },
                { id: "triangle", name: "Triangle", icon: "triangle.svg", cursor: "crosshair" },
                { id: "rectangle", name: "Rectangle", icon: "rectangle.svg", cursor: "crosshair" },
                { id: "quadrilateral", name: "Quadrilateral", icon: "quadrilateral.svg", cursor: "crosshair" }
            ]
        },

        transform: {
            name: "Transform",
            tools: [
                { id: "translate", name: "Translate by Vector", icon: "translate.svg", cursor: "move" },
                { id: "rotate", name: "Rotate around Point", icon: "rotate.svg", cursor: "move" },
                { id: "reflect_line", name: "Reflect about Line", icon: "reflect_line.svg", cursor: "move" },
                { id: "reflect_point", name: "Reflect about Point", icon: "reflect_point.svg", cursor: "move" },
                { id: "dilate", name: "Dilate from Point", icon: "dilate.svg", cursor: "move" }
            ]
        },

        media: {
            name: "Media",
            tools: [
                { id: "text", name: "Text", icon: "text.svg", cursor: "text" },
                { id: "image", name: "Image", icon: "image.svg", cursor: "copy" }
            ]
        }
    }
};
