const CONFIG = {
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
        basic: {
            name: "Basic Tools",
            tools: [
                { id: "move", name: "Move", icon: "move.svg" },
                { id: "point", name: "Point", icon: "point.svg" },
                { id: "segment", name: "Segment", icon: "segment.svg" },
                { id: "line", name: "Line", icon: "line.svg" },
                { id: "polygon", name: "Polygon", icon: "polygon.svg" },
                { id: "circle", name: "Circle", icon: "circle.svg" }
            ]
        },
        construct: {
            name: "Construct",
            tools: [
                { id: "midpoint", name: "Midpoint", icon: "midpoint.svg" },
                { id: "perpendicular", name: "Perpendicular", icon: "perpendicular.svg" },
                { id: "parallel", name: "Parallel", icon: "parallel.svg" },
                { id: "angle_bisector", name: "Angle Bisector", icon: "angle_bisector.svg" },
                { id: "tangent", name: "Tangent", icon: "tangent.svg" }
            ]
        },
        measure: {
            name: "Measure",
            tools: [
                { id: "angle", name: "Angle", icon: "angle.svg" },
                { id: "distance", name: "Distance", icon: "distance.svg" },
                { id: "area", name: "Area", icon: "area.svg" }
            ]
        },
        transform: {
            name: "Transform",
            tools: [
                { id: "translate", name: "Translate", icon: "translate.svg" },
                { id: "rotate", name: "Rotate", icon: "rotate.svg" },
                { id: "reflect_line", name: "Reflect Line", icon: "reflect_line.svg" },
                { id: "reflect_point", name: "Reflect Point", icon: "reflect_point.svg" },
                { id: "dilate", name: "Dilate", icon: "dilate.svg" }
            ]
        }
    }
};
