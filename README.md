# jest-canvas-snapshot-serializer

Jest Snapshot Serializer to create comparable snapshots of canvas elements.

## Usage

Make sure you're either running jest with environment set to `jsdom` (default setting)
or you have setup `jsdom` in the test setup file.

Install canvas-prebuilt and this module

```
npm install --save-dev canvas-prebuilt jest-canvas-snapshot-serializer
```

and add it as serializer

```js
// myTest.spec.js
import canvasSerializer from "jest-canvas-snapshot-serializer";

expect.addSnapshotSerializer(canvasSerializer);

test("my awesome test", () => {
    const canvas = document.createElement("canvas");

    // canvas must have a width and height attribute
    // otherwise there is no image to serialize
    canvas.setAttribute("width", "200");
    canvas.setAttribute("height", "200");

    drawAwesomeImage(canvas);

    expect(canvas).toMatchSnapshot();
});
```

Running the test creates a snapshot file like:

```
exports["my awesome test 1"] = `
<canvas
  width="200"
  height="200"
  data-snapshot-image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABm...."
/>
`
```

The snapshot now contains the base64 representation of the drawn image.
So we're informed about canvas image regressions \o/

Furthermore this serializer will create an image file next to the snapshot file.

```
.
├── __snapshots__
│   ├── myTest.spec.js.snap
│   ├── myTest.spec.js.snap.my-awesome-test.canvas-image.png
│   └── myTest.spec.js.snap.my-awesome-test.canvas-image.dirty.png
└── myTest.spec.js
```

There is also a dirty image file if jest is running without `--updateSnapshot` and the persisted snapshot
doesn't match the current implementation. So you can compare the original/persisted image with the current one.
The dirty image is deleted as soon as jest updates the snapshot.

### FAQ

#### Why a snapshot serializer instead of a custom matcher like `.toMatchCanvasSnapshot`?

Using a custom matcher we'd have to implement the same stuff already provided by jest-snapshot (e.g. success and error feedback).
Whereas using a serializer we only have to take care about the serialization of the canvas element and writing/deleting the image files.


## License

Apache License 2.0

