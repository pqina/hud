type HudAPI = {
    // log shape to console
    log: () => HudAPI;

    // draw corners to view
    corners: () => HudAPI;
    points: () => HudAPI;
    coords: () => HudAPI;
    coordinates: () => HudAPI;

    // draw angles to view
    angles: () => HudAPI;
    angle: () => HudAPI;
    deg: () => HudAPI;
    rad: () => HudAPI;

    // draw edges/lines/dimensions to view
    length: () => HudAPI;
    lengths: () => HudAPI;
    size: () => HudAPI;
    edges: () => HudAPI;
    dimensions: () => HudAPI;

    // path
    path: () => HudAPI;

    // apply custom color to this shape
    color: (color: string) => HudAPI;

    // shortcuts to default colors
    red: () => HudAPI;
    orange: () => HudAPI;
    amber: () => HudAPI;
    yellow: () => HudAPI;
    lime: () => HudAPI;
    green: () => HudAPI;
    emerald: () => HudAPI;
    teal: () => HudAPI;
    cyan: () => HudAPI;
    sky: () => HudAPI;
    blue: () => HudAPI;
    indigo: () => HudAPI;
    violet: () => HudAPI;
    purple: () => HudAPI;
    fuchsia: () => HudAPI;
    pink: () => HudAPI;
    rose: () => HudAPI;
};

type HudLine = [c: number];
type HudPoint = [x: number, y: number] | { x: number; y: number };
type HudPath = HudPoint[];
type HudText = [text: string, x: number, y: number];
type HudRect =
    | [x: number, y: number, width: number, height: number, rotation?: number]
    | { x: number; y: number; width: number; height: number; rotation?: number };
type HudCircle = [x: number, y: number, r: number] | { x: number; y: number; r: number };
type HudShape = HudLine | HudPoint | HudPath | HudText | HudRect | HudCircle;

type Hud = {
    // line
    (c: number): HudAPI;

    // point
    (x: number, y: number): HudAPI;
    (point: { x: number; y: number }): HudAPI;

    // line
    (line: { [point: string]: { x: number; y: number } }): HudAPI;

    // path
    (...points: { x: number; y: number }[]): HudAPI;

    // text
    (text: string, x: number, y: number): HudAPI;

    // rect
    (x: number, y: number, width: number, height: number, rotation?: number): HudAPI;
    (rect: { x: number; y: number; width: number; height: number; rotation?: number }): HudAPI;

    // circle
    (x: number, y: number, r: number): HudAPI;
    (circle: { x: number; y: number; r: number }): HudAPI;

    // group
    (shape: HudShape[]): HudAPI;

    /**
     * Clears the HUD
     */
    clear: () => Hud;

    /**
     * Adjust opacity of HUD
     * @param opacity - opacity between 0 and 1
     */
    opacity: (opacity: number) => void;

    /**
     * Adjust translation of shapes
     * @param x - x offset or vector
     * @param y - y offset
     */
    translate: (x: number | { x: number; y: number }, y?: number) => void;

    /**
     * Adjust scale of shapes
     * @param scale - scale factor, minimum is 1
     */
    scale: (scale: number) => void;

    /**
     * Adjust drawing line thickness
     * @param strength - increase or decrease drawing strength, defaults to 2, minimum is 1
     */
    strength: (opacity: number) => void;

    /**
     * Adjust color shapes
     * @param color - set generic color, defaults to undefined
     */
    color: (color: string) => void;

    /**
     * Adjust digits to round values to
     * @param color - default to undefined
     */
    digits: (amount: number) => void;
};

declare let hud: Hud;
