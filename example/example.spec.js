const canvasSnapshotSerializer = require("../src/index");

expect.addSnapshotSerializer(canvasSnapshotSerializer);

describe("my test suite", () => {
  it("works", () => {
    const canvas = createCanvas("#000", "#F00");
    expect(canvas).toMatchSnapshot();
  });

  it("works for canvas wrapped by other elements", () => {
    const canvas = createCanvas("#000", "#0F0");
    const root = document.createElement("div");
    root.appendChild(canvas);

    expect(root).toMatchSnapshot();
  });

  function createCanvas(color, textColor) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.setAttribute("height", "200");
    canvas.setAttribute("height", "200");

    context.fillStyle = color;
    context.beginPath();
    context.arc(100, 100, 75, 0, 2 * Math.PI);
    context.fill();

    context.font = "24px Helvetica";
    context.fillStyle = textColor;
    context.fillText("Canvas", 50, 130);

    return canvas;
  }
});
