# HUD

An easy way to visually debug 2D shapes.

Add to page body

```html
<script src="hud.js"></script>
```

Now you can draw info to the viewport.

This will draw a cyan dot on the viewport at position `50, 50`

```js
hud({
    x: 50,
    y: 50,
});
```

This will draw a rectangle. HUD automatically picks colors for every shape drawn to the view.

```js
hud({
    x: 50,
    y: 50,
    width: 200,
    height: 300,
});
```

We can manually assign a color like shown below where we draw a cyan circle.

```js
hud({
    x: 50,
    y: 50,
    r: 10,
}).cyan();
```

Available colors:

```
red
orange
amber
yellow
lime
green
emerald
teal
cyan
sky
blue
indigo
violet
purple
fuchsia
pink
rose
white
black
silver
```

We can supply custom color info with the `color` transform.

```js
hud('Hello World', 100, 100).color('#ff0');
```

Draw a line segment by supplying a line object or an array of two coordinates.

```js
hud({
    start: {
        x: 0,
        y: 0,
    },
    end: {
        x: 50,
        y: 50,
    },
});

// or
hud(
    {
        x: 0,
        y: 0,
    },
    {
        x: 50,
        y: 50,
    }
);

// or
hud([0, 0], [50, 50]);
```

Add one more coordinate and HUD will draw a polygon.

```js
hud(
    {
        x: 0,
        y: 0,
    },
    {
        x: 50,
        y: 50,
    },
    {
        x: 0,
        y: 50,
    }
);
```

Want to draw a line instead, pass the `line` transform.

```js
hud(
    {
        x: 0,
        y: 0,
    },
    {
        x: 50,
        y: 50,
    },
    {
        x: 0,
        y: 50,
    }
).line();
```

These generic HUD API enables adjusting the generic HUD style.

```js
// lower opacity of HUD
hud.opacity(0.5);

// translate HUD drawing offset
hud.translate(0, 50);

// increase line thickness
hud.strength(3);

// set 3 digit precision for logged data
hud.precision(3);
```

We can use these additional shape API end points to make logging coordinates easier.

```js
// this logs vertex coordinates to the view
hud({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
}).points();

// this logs line segment lengths to the view
hud({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
}).lengths();

// this logs line segment angles to the view
hud({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
}).angles();
```

Add `.log()` to log the shape data to the developer console.

```js
// this logs vertex coordinates to the dev console
hud({
    x: 0,
    y: 100,
}).log();
```
