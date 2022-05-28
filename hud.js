((w) => {
    // maybe ssr
    if (!w) return;

    // utils
    const isNumber = (v) => typeof v === 'number';

    const isLine = (param) => Object.values(param).every(isVector);

    const isRect = (v) => isNumber(v.x) && isNumber(v.y) && isNumber(v.width) && isNumber(v.height);

    const isEllipse = (v) => isNumber(v.r) || isNumber(v.rx);

    const isVector = (v) => Object.keys(v).length === 2 && isNumber(v.x) && isNumber(v.y);

    const isPath = (v) => Array.isArray(v) && v.every(isVector);

    const degToRad = (deg) => (deg * Math.PI) / 180;
    const radToDeg = (rad) => (rad * 180) / Math.PI;

    const vectorDistanceSquared = (a, b) => {
        const x = a.x - b.x;
        const y = a.y - b.y;
        return x * x + y * y;
    };

    const vectorDistance = (a, b) => Math.sqrt(vectorDistanceSquared(a, b));

    const vectorCornerAngle = (a, b, c) => {
        const AB = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
        const BC = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2));
        const AC = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));
        return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    };

    const vectorAngle = (v) => Math.atan2(v.y, v.x);

    const vectorAngleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

    const vectorNormalize = (v) => {
        const length = Math.sqrt(v.x * v.x + v.y * v.y);
        if (length === 0) return vectorCreateEmpty();
        v.x /= length;
        v.y /= length;
        return v;
    };

    const rotatePoint = (point, r, pivot) => {
        const cos = Math.cos(r);
        const sin = Math.sin(r);
        const tx = point.x - pivot.x;
        const ty = point.y - pivot.y;
        point.x = pivot.x + cos * tx - sin * ty;
        point.y = pivot.y + sin * tx + cos * ty;
        return point;
    };

    const pathCenter = (points) => {
        let x = 0;
        let y = 0;
        points.forEach((point) => {
            x += point.x;
            y += point.y;
        });
        return vectorCreate(x / points.length, y / points.length);
    };

    const vectorCreate = (...args) => {
        const [x, y] = args;
        if (isNumber(x) && isNumber(y)) return { x, y };
    };

    const vectorMultiply = (v, factor) => {
        v.x *= factor;
        v.y *= factor;
    };

    const rectToEdges = (rect) => {
        const [lt, rt, rb, lb] = rectToCorners(rect);
        return [
            [lt, rt],
            [rt, rb],
            [rb, lb],
            [lb, lt],
        ];
    };

    const rectToCorners = ({ x, y, width, height, rotation = 0 }) => {
        const w = width || height;
        const h = height || width;
        const points = [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
        ].map((point) =>
            rotatePoint(point, degToRad(rotation), {
                x: x + w * 0.5,
                y: y + h * 0.5,
            })
        );
        return points;
    };

    const pathToLines = (path) => {
        let lines = [];
        for (let i = 0; i < path.length - 1; i++) {
            lines.push([path[i], path[i + 1]]);
        }
        return lines;
    };

    const distance = (a, b) => {
        const x = a.x - b.x;
        const y = a.y - b.y;
        return Math.sqrt(x * x + y * y);
    };

    //#region canvas

    let pointerId = 0;
    let queuedFrame = undefined;
    let ctx = undefined;
    let canvas = undefined;
    let pixelRatio = window.devicePixelRatio;
    let scrollX = 0;
    let scrollY = 0;

    const createCanvas = () => {
        // create canvas overlay
        canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = 0;
        canvas.style.top = 0;
        canvas.style.zIndex = 2147483647;
        canvas.style.pointerEvents = 'none';

        // create default context
        ctx = canvas.getContext('2d');
        ctx.scale(pixelRatio, pixelRatio);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // if window resized, update canvas size
        window.addEventListener('resize', syncCanvas);

        // if window scrolled update scroll offset
        window.addEventListener('scroll', syncCanvas);

        // show x,y pointer location when down
        window.addEventListener('pointerdown', drawPointer);

        // scale and offset canvas
        syncCanvas();
    };

    const syncCanvas = () => {
        // update size
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // update scroll offset
        scrollX = -window.scrollX;
        scrollY = -window.scrollY;

        // draw new state on next frame
        requestRedraw();
    };

    const appendCanvas = () => {
        if (!canvas) createCanvas();
        if (canvas.parentNode) return;
        document.body.appendChild(canvas);
    };

    const drawPointer = (e) => {
        // if no meta key is pressed pointers can only be removed
        if (!e.metaKey) {
            // remove pointer at location
            const pointers = queue.filter(([id]) => /pointer/.test(id));

            pointers
                .filter(([, , shapes]) => {
                    const [position] = shapes[0];

                    return (
                        distance({ x: e.pageX, y: e.pageY }, { x: position[0], y: position[1] }) <
                        20
                    );
                })
                .map(([id]) => id)
                .forEach(removeAction);

            return;
        }

        // create new pointer
        pointerId++;

        const drawPointer = (e) => {
            const x = Math.round(e.pageX);
            const y = Math.round(e.pageY);

            // group objects
            updateAction(`pointer-${pointerId}`, draw, [
                [x, y],
                [x, y, 10],
                [`#${pointerId} ${x},${y}`, x + 16, y - 6],
            ]);
        };

        const pointerMove = (e) => {
            e.preventDefault();
            drawPointer(e);
        };

        const pointerEnd = (e) => {
            window.removeEventListener('pointermove', pointerMove);
            window.removeEventListener('pointerup', pointerEnd);

            drawPointer(e);

            // log to console
            console.log(`#${pointerId}`, { x: Math.round(e.pageX), y: Math.round(e.pageY) });
        };

        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerEnd);
        window.addEventListener('pointercancel', pointerEnd);

        drawPointer(e);
    };

    const drawRulers = () => {
        const step = 10;
        const lines = [];
        const offsets = [];
        for (let x = step; x < window.innerWidth; x += step) {
            let l = 5;
            if (x % 100 === 0) {
                l = 10;
                offsets.push({
                    x: x - 5,
                    y: l,
                    text: x,
                });
            }

            lines.push([
                { x, y: 0 },
                { x, y: l },
            ]);
        }

        // group objects
        updateAction(`ruler`, draw, [...lines, ...offsets]);
    };

    //#endregion

    const Color = {
        red: '#ef4444',
        orange: '#f97316',
        amber: '#f59e0b',
        yellow: '#eab308',
        lime: '#84cc16',
        green: '#22c55e',
        emerald: '#10b981',
        teal: '#14b8a6',
        cyan: '#06b6d4',
        sky: '#0ea5e9',
        blue: '#3b82f6',
        indigo: '#6366f1',
        violet: '#8b5cf6',
        purple: '#a855f7',
        fuchsia: '#d946ef',
        pink: '#ec4899',
        rose: '#f43f5e',
    };

    const Colors = Object.values(Color);

    const queue = [];

    let s;
    let tx;
    let ty;

    let colorIndex;

    let fontSize = 12;
    let selectedOpacity;
    let selectedColor;
    let selectedStrength;
    let selectedPrecision = undefined;

    function resetDrawState() {
        s = 1;
        tx = 0;
        ty = 0;

        colorIndex = 0;

        selectedOpacity = 1;
        selectedColor = undefined;
        selectedStrength = 2;
        selectedPrecision = undefined;
    }

    function getDrawColor() {
        // returns current Brush color if set
        if (selectedColor) return selectedColor;

        // return next color in colors list
        const currentColorIndex = colorIndex;

        // update color index, skips over colors so colors arent' too similar
        colorIndex = colorIndex + 2 < Colors.length ? colorIndex + 2 : colorIndex % 2 === 0 ? 1 : 0;

        return Colors[currentColorIndex];
    }

    function getDrawStrength() {
        return (selectedStrength / s) * pixelRatio;
    }

    //#region state changes

    function translateContext(...args) {
        if (typeof args[0] === 'number') {
            tx = args[0];
            ty = args[1];
            return;
        }
        tx = args[0].x;
        ty = args[0].y;
    }

    function scaleContext(s) {
        s = Math.max(1, s);
    }

    function clearContext() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = selectedOpacity;
        resetDrawState();
    }

    function setDrawStrength(strength) {
        selectedStrength = Math.max(1, strength);
    }

    function setDrawColor(color) {
        selectedColor = color;
    }

    function setDrawOpacity(opacity) {
        selectedOpacity = opacity;
        ctx.globalAlpha = selectedOpacity;
    }

    function setValueRounding(precision) {
        selectedPrecision = precision;
    }

    //#endregion

    //#region drawing

    const scale = (v) => v * s * pixelRatio;

    const getScaled = (...args) => args.map(scale);

    const getTranslated = (...args) => {
        let [x, y] = args;
        if (typeof args[0] === 'object') {
            x = args[0].x;
            y = args[0].y;
        }
        return [(scrollX + tx + x) * s * pixelRatio, (scrollY + ty + y) * s * pixelRatio];
    };

    const fill = (opacity = 0.05) => {
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = selectedOpacity;
    };

    const setPathFillStyle = (color) => {
        ctx.fillStyle = color;
    };

    const setPathDrawStyle = (color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = getDrawStrength();
        ctx.fillStyle = ctx.strokeStyle;
    };

    const drawEllipse = (x, y, rx, ry, { color }) => {
        ctx.beginPath();
        setPathDrawStyle(color);
        ctx.ellipse(...getTranslated(x, y), ...getScaled(rx || ry, ry || rx), 0, 0, 2 * Math.PI);
        ctx.closePath();
        fill();
        ctx.stroke();
    };

    const drawArc = (x, y, r, startAngle, endAngle, { color }) => {
        ctx.beginPath();
        setPathDrawStyle(color);
        ctx.arc(...getTranslated(x, y), ...getScaled(r), startAngle, endAngle);
        ctx.closePath();
        fill();
        ctx.stroke();
    };

    const drawDot = (x, y, { color }) => {
        ctx.beginPath();
        setPathFillStyle(color);
        ctx.arc(...getTranslated(x, y), 0.5 + getDrawStrength() * 1.5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    };

    const getFont = (options = {}) =>
        `${s < 2 ? 100 : 900} ${scale(options.fontSize || fontSize)}px ${
            options.fontFamily || 'courier'
        }`;

    const measureText = (text, options = {}) => {
        ctx.font = getFont(options);
        const metrics = ctx.measureText(text);
        return {
            width: (metrics.width * 0.595) / s / pixelRatio,
            height:
                (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) /
                s /
                pixelRatio,
        };
    };

    const drawText = (text, x, y, options = {}) => {
        const position = [...getTranslated(x, y)];

        setPathFillStyle(options.color);

        ctx.font = getFont(options);
        ctx.textBaseline = options.textBaseline || 'top';
        ctx.textAlign = options.textAlign || 'left';

        if (options.backgroundColor) {
            ctx.save();
            const chars = '█'.repeat(text.length);
            const padding = options.padding || 2;
            const borderWidth = options.borderWidth || 2;

            ctx.lineWidth = scale(padding + borderWidth + 2);
            ctx.strokeStyle = options.borderColor || color;
            ctx.strokeText(chars, ...position);

            ctx.lineWidth = scale(padding + borderWidth);
            ctx.strokeStyle = options.backgroundColor;
            ctx.strokeText(chars, ...position);

            ctx.fillStyle = options.backgroundColor;
            ctx.fillText(chars, ...position);
            ctx.restore();
        }

        ctx.font = getFont(options);
        ctx.fillText(text, ...position);
    };

    const drawRect = (x, y, width, height, rotation = 0, { color }) => {
        const points = rectToCorners({ x, y, width, height, rotation });
        drawPolygon(points, { color });
    };

    const drawPath = (points, { color, closePath }) => {
        // if more than two points and first and last point is the same, draw polygon
        if (points.length > 2 && closePath !== false) {
            drawPolygon(points, { color });

            // const firstPoint = points[0];
            // const lastPoint = points[points.length - 1];
            // const isClosedPath = firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y;

            // remove overlapping points
            // if (isClosedPath) points = points.slice(0, -1);

            // draw closed polygon
            // if (lastPoint !== false) return drawPolygon(points, { color });
        }

        // draw path
        drawPoints(points, { color });
        ctx.stroke();
    };

    const drawPoints = (points, { color }) => {
        ctx.beginPath();
        setPathDrawStyle(color);
        ctx.moveTo(...getTranslated(points[0]));
        points.slice(1).forEach((point) => ctx.lineTo(...getTranslated(point)));
    };

    const drawPolygon = (points, { color }) => {
        drawPoints(points, { color });
        ctx.closePath();
        fill();
        ctx.stroke();
    };

    const isShape = (param) => {
        // plain value, list of shapes, or object definition
        return (
            // list of shapes
            Array.isArray(param) ||
            // plain value
            isNumber(param) ||
            // shape
            'x' in param ||
            // line
            isLine(param) ||
            isPath(param)
        );
    };

    function splitArguments(args) {
        let shapes = [];
        let transforms = [];
        let options = {};

        for (let arg of args) {
            if (typeof arg === 'function') transforms.push(arg);
            else if (isShape(arg)) shapes.push(arg);
            else options = { ...options, ...arg };
        }

        return [shapes, options, transforms];
    }

    function getShapeFromParams(params) {
        // object shape definition
        if (params.length === 1 && typeof params[0] === 'object') {
            if (isLine(params[0])) {
                return Object.values(params[0]);
            }
            return params[0];
        }

        const pl = params.length;

        // list of numbers
        if (typeof params[0] === 'number') {
            // rect
            if (pl === 4 || pl === 5) {
                const [x, y, width, height, rotation] = params;
                return { x, y, width, height, rotation };
            }

            // circle
            if (pl === 3) {
                const [x, y, r] = params;
                return { x, y, r };
            }

            // dot
            if (pl === 2) {
                const [x, y] = params;
                return { x, y };
            }

            // vertical line
            if (pl === 1) {
                const [x] = params;
                if (x < 0) return { x: 0, y: -x, dx: 1 };
                return { x, y: 0, dy: 1 };
            }
        } else if (typeof params[0] === 'string') {
            if (pl <= 3) {
                const [text, x = 0, y = 0] = params;
                return { x, y, text };
            }
        }

        return params;
    }

    function getShapesFromParams(params) {
        // list of shapes
        if (Array.isArray(params[0])) return params[0];

        // single shape
        return [params];
    }

    function drawShape(shape, options) {
        if (Array.isArray(shape)) return drawPath(shape, options);

        // text
        if (shape.text) return drawText(shape.text, shape.x, shape.y, options);

        // ray
        if (shape.dx || shape.dy)
            return drawPath(
                [
                    shape,
                    { x: shape.x + (shape.dx || 0) * 10000, y: shape.y + (shape.dy || 0) * 10000 },
                ],
                options
            );

        // rectangle
        if (shape.width || shape.height)
            return drawRect(shape.x, shape.y, shape.width, shape.height, shape.rotation, options);

        // ellipse
        if (shape.r || shape.rx || shape.ry)
            return drawEllipse(shape.x, shape.y, shape.r || shape.rx, shape.r || shape.ry, options);

        // event position as dot
        if (shape.pageX) return drawDot(shape.pageX, shape.pageY, options);

        // dot
        if (shape.x && shape.y) return drawDot(shape.x, shape.y, options);
    }

    function draw(...args) {
        let [params, options = {}, transforms = []] = splitArguments(args);

        options = {
            // passed options
            ...options,

            // clean up color
            color: options.color ? options.color.trim() : getDrawColor(),
        };

        // loop over shapes
        const shapes = getShapesFromParams(params);
        shapes.forEach((shapeArgs) => {
            // get shape type
            const shape = getShapeFromParams(shapeArgs);

            // draw the shape
            drawShape(shape, options);

            // draw action
            transforms.forEach((transform) => transform(shape, options));
        });
    }

    function redraw() {
        // should append canvas when we start drawing
        appendCanvas();

        // reset color index to first value
        resetDrawState();

        // draw rulers
        // drawRulers();

        // apply actions in queue
        queue.forEach((action) => {
            const [, fn, params = []] = action;
            return fn(...params);
        });
    }

    function requestRedraw() {
        cancelAnimationFrame(queuedFrame);
        queuedFrame = requestAnimationFrame(() => {
            clearContext();
            redraw();
        });
    }

    //#endregion

    //#region log

    const format = (value) => {
        if (selectedPrecision === undefined) return `${value}`;
        const [a, b] = `${value}`.split('.');
        if (!b) return a;
        return a + '.' + b.substring(0, selectedPrecision);
    };

    function logValue({ x, y }, value, options = {}) {
        const label = `${options.prefix ? options.prefix + ' ' : ''}${
            Array.isArray(value) ? value.map(format).join(', ') : format(value)
        }`;

        const textOptions = {
            fontSize: options.fontSize || 9,
            textAlign: 'center',
            textBaseline: 'middle',
        };

        const { textBaseline, textOffset, textAlign } = options;

        const textSize = measureText(label, textOptions);

        let tx = 0;
        let ty = 0;
        let tw = textSize.width * 0.5;
        let th = textSize.height * 0.5;

        if (textBaseline === 'bottom') ty += th + textOffset.y;
        if (textBaseline === 'top') ty -= th + textOffset.y;
        if (textAlign === 'left') tx += tw + textOffset.x;
        if (textAlign === 'right') tx -= tw + textOffset.x;

        drawText(label, x + tx, y + ty, {
            ...textOptions,
            color: '#fff',
            fontSize: 8,
            borderColor: options.color,
            backgroundColor: '#000',
        });
    }

    function logShapeAngles(shape, { color, closePath }) {
        let lines = [];
        let points = [];
        let center;

        if (isRect(shape)) {
            lines = rectToEdges(shape);
            points = rectToCorners(shape);
        } else if (isPath(shape) && shape.length > 2) {
            lines = pathToLines(shape);
            if (closePath !== false) lines.push([shape[shape.length - 1], shape[0]]);
            points = shape;
        } else {
            return;
        }

        center = pathCenter([...points]);

        if (closePath !== false) lines.push(lines[0]);

        for (let i = 0; i < lines.length - 1; i++) {
            const [begin, joint] = lines[i];
            const [, end] = i === lines.length - 1 ? [, lines[0][0]] : lines[i + 1];
            const angle = vectorCornerAngle(begin, joint, end);

            const t = { x: center.x - joint.x, y: center.y - joint.y };
            vectorNormalize(t);
            vectorMultiply(t, 30);

            const index = closePath !== false && i + 1 == lines.length - 1 ? 0 : i + 1;

            logValue({ x: joint.x + t.x, y: joint.y + t.y }, radToDeg(angle), {
                color,
                prefix: `∠${index}`,
            });
        }
    }

    function logShapeCoordinates(shape, { color }) {
        let points = [];
        let center;

        if (isRect(shape)) {
            points = rectToCorners(shape);
        } else if (isPath(shape)) {
            points = shape;
        } else {
            return;
        }

        center = pathCenter(points);

        points.forEach((point, index) => {
            logValue(point, [point.x, point.y], {
                color,
                prefix: `•${index}`,
                textOffset: vectorCreate(4, 4),
                textAlign: center && (point.x > center.x ? 'left' : 'right'),
                textBaseline: center && (point.y > center.y ? 'bottom' : 'top'),
            });
        });
    }

    function logShapeSizes(shape, { color, closePath }) {
        let lines = [];

        if (isRect(shape)) {
            lines = rectToEdges(shape);
        } else if (isPath(shape)) {
            lines = pathToLines(shape);
            if (closePath !== false) lines.push([shape[shape.length - 1], shape[0]]);
        } else {
            return;
        }

        lines.forEach(([begin, end], index) => {
            const dist = vectorDistance(begin, end);
            const middle = vectorCreate((begin.x + end.x) * 0.5, (begin.y + end.y) * 0.5);
            const startIndex = index;
            const endIndex = closePath !== false && index + 1 == lines.length ? 0 : index + 1;
            logValue(middle, dist, { color, prefix: `${startIndex}↔${endIndex}` });
        });
    }

    //#endregion

    function updateAction(needle, action, ...params) {
        // if doesn't exist, add
        const queuedActionIndex = queue.findIndex(([id]) => id === needle);

        // update queue
        if (queuedActionIndex < 0) {
            queue.push([needle, action, params]);
        } else {
            queue[queuedActionIndex] = [needle, action, params];
        }
    }

    function removeAction(needle) {
        // find and remove
        const queuedItemIndex = queue.findIndex(([id]) => id === needle);
        if (queuedItemIndex < 0) return;
        queue.splice(queuedItemIndex, 1);
    }

    function getCallerId() {
        const stack = new Error().stack;
        return stack
            .split('\n')
            .filter((str) => str !== 'Error')
            .slice(0, 4)
            .join('');
    }

    let firstCallerId;

    function queueAction(action, params) {
        const callerId = getCallerId();

        // remember first call
        if (!firstCallerId) firstCallerId = callerId;

        // automatically queue clear before first call
        if (firstCallerId === callerId) hud.clear();

        // queue this action for drawing
        queue.push([undefined, action, params]);

        // draw new state on next frame
        cancelAnimationFrame(queuedFrame);
        queuedFrame = requestAnimationFrame(redraw);
    }

    function hud(...params) {
        // queue all actions for drawing in loop
        queueAction(draw, params);

        // for logging shape info, functions can be chained
        const api = {};
        [
            // log params
            [() => console.log(...params), ['log']],

            // color adjustment
            [(color) => ({ color }), ['color']],

            // color by name
            ...Object.keys(Color).map((key) => [
                () => ({
                    color: Color[key],
                }),
                [key],
            ]),

            // path
            [
                () => {
                    // mark path as open
                    params.push({
                        closePath: false,
                    });
                },
                ['open', 'openPath', 'line'],
            ],

            // logging
            [() => logShapeCoordinates, ['corners', 'points', 'coords', 'coordinates']],
            [() => logShapeAngles, ['angle', 'angles', 'deg', 'rad']],
            [() => logShapeSizes, ['length', 'lengths', 'size', 'edges', 'dimensions']],
        ].forEach(([fn, keys]) => {
            keys.forEach((key) => {
                api[key] = (...args) => {
                    const res = fn(...args);
                    res && params.push(res);
                    return api;
                };
            });
        });

        return api;
    }

    // commands
    hud.clear = () => {
        queueAction(clearContext);
        return hud;
    };
    hud.opacity = (...params) => queueAction(setDrawOpacity, params);
    hud.translate = (...params) => queueAction(translateContext, params);
    hud.scale = (...params) => queueAction(scaleContext, params);
    hud.strength = (...params) => queueAction(setDrawStrength, params);
    hud.color = (...params) => queueAction(setDrawColor, params);
    hud.precision = (...params) => queueAction(setValueRounding, params);

    // create
    createCanvas();

    // draw for first time
    requestRedraw();

    // export
    window.hud = hud;
})(window);
