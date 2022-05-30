type HudAxis = [c: number];
type HudPoint = [x: number, y: number] | { x: number; y: number };
type HudPath = HudPoint[];
type HudText = [text: string, x: number, y: number];
type HudRect =
    | [x: number, y: number, width: number, height: number, rotation?: number]
    | { x: number; y: number; width: number; height: number; rotation?: number };
type HudCircle = [x: number, y: number, r: number] | { x: number; y: number; r: number };
type HudShape = HudPoint | HudAxis | HudLineSegment | HudPath | HudText | HudRect | HudCircle;
type HudLineSegment =
    | { x1: number; y1: number; x2: number; y2: number }
    | { a: HudPoint; b: HudPoint }
    | { from: HudPoint; to: HudPoint }
    | { begin: HudPoint; end: HudPoint }
    | { start: HudPoint; end: HudPoint }
    | [HudPoint, HudPoint];

type HudTransform = {
    // log shape to console
    log: () => HudTransform;

    // draw corners to view
    corners: () => HudTransform;
    points: () => HudTransform;
    coords: () => HudTransform;
    coordinates: () => HudTransform;

    // draw angles to view
    angles: () => HudTransform;
    angle: () => HudTransform;

    // draw edges/lines/dimensions to view
    length: () => HudTransform;
    lengths: () => HudTransform;
    size: () => HudTransform;
    edges: () => HudTransform;
    dimensions: () => HudTransform;

    // path
    path: () => HudTransform;

    // apply custom color to this shape
    color: (color: string) => HudTransform;

    // shortcuts to default colors
    red: () => HudTransform;
    orange: () => HudTransform;
    amber: () => HudTransform;
    yellow: () => HudTransform;
    lime: () => HudTransform;
    green: () => HudTransform;
    emerald: () => HudTransform;
    teal: () => HudTransform;
    cyan: () => HudTransform;
    sky: () => HudTransform;
    blue: () => HudTransform;
    indigo: () => HudTransform;
    violet: () => HudTransform;
    purple: () => HudTransform;
    fuchsia: () => HudTransform;
    pink: () => HudTransform;
    rose: () => HudTransform;
    white: () => HudTransform;
    black: () => HudTransform;
    silver: () => HudTransform;
};

type Hud = {
    // line
    (c: number): HudTransform;

    // point
    (x: number, y: number): HudTransform;
    (point: HudPoint): HudTransform;

    // path
    (...points: { x: number; y: number }[]): HudTransform;

    // text
    (text: string, x: number, y: number): HudTransform;

    // rect
    (x: number, y: number, width: number, height: number, rotation?: number): HudTransform;
    (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
    }): HudTransform;

    // circle
    (x: number, y: number, r: number): HudTransform;
    (circle: { x: number; y: number; r: number }): HudTransform;

    // line
    (line: HudLineSegment): HudTransform;

    // group
    (shape: HudShape[]): HudTransform;

    /**
     * Clears the HUD
     */
    clear: () => Hud;

    /**
     * Adjust opacity of HUD
     * @param opacity - opacity between 0 and 1
     */
    opacity: (opacity: number) => Hud;

    /**
     * Adjust translation of shapes
     * @param x - x offset or vector
     * @param y - y offset
     */
    translate: (x: number | { x: number; y: number }, y?: number) => Hud;

    /**
     * Adjust scale of shapes
     * @param scale - scale factor, minimum is 1
     */
    scale: (scale: number) => Hud;

    /**
     * Adjust drawing line thickness
     * @param strength - increase or decrease drawing strength, defaults to 2, minimum is 1
     */
    strength: (opacity: number) => Hud;

    /**
     * Adjust color shapes
     * @param color - set generic color, defaults to undefined
     */
    color: (color: string) => Hud;

    /**
     * Adjust digits to round values to
     * @param color - default to undefined
     */
    precision: (amount: number) => Hud;
};

declare let hud: Hud;
