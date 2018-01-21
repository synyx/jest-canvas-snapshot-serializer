const path = require("path");
const createCanvasSnapshotSerializer = require("../canvasSnapshotSerializer");

describe("canvasSnapshotSerializer", () => {
  const fsMock = jest.genMockFromModule("fs");
  const prettyFormatMock = jest.genMockFromModule("pretty-format");
  const getStateMock = jest.fn();

  const currentTestName = "awesome test name";
  const currentTestNameNormalized = "awesome-test-name";
  const snapshotPath = "/Users/doe/foo/__tests__/__snapshots__/bar.spec.js.snap";
  const imageFilePath = `${snapshotPath}.${currentTestNameNormalized}.canvas-image.png`;
  const dirtyImageFilePath = `${snapshotPath}.${currentTestNameNormalized}.canvas-image.dirty.png`;

  let canvasSnapshotSerializer;

  beforeEach(() => {
    fsMock.existsSync.mockImplementation(() => {});
    fsMock.mkdirSync.mockImplementation(() => {});
    fsMock.writeFileSync.mockImplementation(() => {});
    fsMock.unlinkSync.mockImplementation(() => {});

    canvasSnapshotSerializer = createCanvasSnapshotSerializer(
      fsMock,
      path,
      prettyFormatMock,
      getStateMock,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("is used for canvas elements", () => {
    expect(canvasSnapshotSerializer.test({ tagName: "CANVAS" })).toBe(true);
    expect(canvasSnapshotSerializer.test({ tagName: "canvas" })).toBe(false);
  });

  it("returns the pretty formatted string", () => {
    prettyFormatMock.mockReturnValue("pretty format");
    mockTestState();

    const canvas = createCanvas();
    const expectedCanvas = createExpectedCanvas(canvas);

    const actual = canvasSnapshotSerializer.print(canvas);

    expect(actual).toEqual("pretty format");
    expect(prettyFormatMock).toHaveBeenCalledWith(expectedCanvas, {
      plugins: [prettyFormatMock.plugins.DOMElement],
    });
  });

  describe("image file is written", () => {
    it("on first test run and update mode is set to 'new' (default)", () => {
      fsMock.existsSync.mockReturnValue(false);
      mockTestState({ update: "new", snapshotData: null });

      const canvas = createCanvas();
      const expectedContent = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");

      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.writeFileSync).toHaveBeenCalledWith(imageFilePath, expectedContent, "base64");
    });

    it("when image is dirty and update mode is 'all'", () => {
      fsMock.existsSync.mockReturnValue(false);
      mockTestState({ update: "all", snapshotData: null });

      const canvas = createCanvas();
      const expectedContent = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");

      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.writeFileSync).toHaveBeenCalledWith(imageFilePath, expectedContent, "base64");
    });
  });

  describe("image file is not written", () => {
    it("on first test run and update mode is set to 'none' (CI mode)", () => {
      fsMock.existsSync.mockReturnValue(false);
      mockTestState({ update: "none", snapshotData: null });

      const canvas = createCanvas();
      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.writeFileSync).not.toHaveBeenCalled();
    });

    it("when image is dirty but update mode is set to 'new' and image already exists", () => {
      fsMock.existsSync.mockReturnValue(true);
      mockTestState({ update: "new", snapshotData: "<canvas data-snapshot='true' />" });
      prettyFormatMock.mockImplementation(element => {
        const isSnapshotCanvas = Boolean(element.getAttribute("data-snapshot"));
        return isSnapshotCanvas ? "snapshotCanvasFormatted" : "receivedCanvasFormatted";
      });

      const canvas = createCanvas();
      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.writeFileSync).not.toHaveBeenCalledWith(
        imageFilePath,
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe("dirty image is written", () => {
    it("when update mode is set to 'new' and image exists", () => {
      fsMock.existsSync.mockReturnValue(true);
      mockTestState({ update: "new", snapshotData: "<canvas data-snapshot='true' />" });
      prettyFormatMock.mockImplementation(element => {
        const isSnapshotCanvas = Boolean(element.getAttribute("data-snapshot"));
        return isSnapshotCanvas ? "snapshotCanvasFormatted" : "receivedCanvasFormatted";
      });

      const canvas = createCanvas();
      const expectedContent = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");
      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.writeFileSync).toHaveBeenCalledWith(
        dirtyImageFilePath,
        expectedContent,
        "base64",
      );
    });
  });

  describe("dirty image is not written", () => {
    it("on first test run and update mode set to 'new'", () => {
      fsMock.existsSync.mockReturnValue(false);
      mockTestState({ update: "new", snapshotData: null });

      const canvas = createCanvas();
      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.writeFileSync).not.toHaveBeenCalledWith(
        dirtyImageFilePath,
        expect.anything(),
        expect.anything(),
      );
    });

    it("on first test run and update mode set to 'all'", () => {
      fsMock.existsSync.mockReturnValue(false);
      mockTestState({ update: "all", snapshotData: null });

      const canvas = createCanvas();
      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.writeFileSync).not.toHaveBeenCalledWith(
        dirtyImageFilePath,
        expect.anything(),
        expect.anything(),
      );
    });

    it("when image is not dirty", () => {
      fsMock.existsSync.mockReturnValue(true);
      // the actual snapshotData is not of interest here
      // it only has to be defined to invoke prettyFormat
      mockTestState({ update: "all", snapshotData: "canvas snapshot" });

      // should be called one for the received canvas element
      // and once for the persisted snapshot
      prettyFormatMock.mockReturnValue("formatted canvas");

      const canvas = createCanvas();
      canvasSnapshotSerializer.print(canvas);

      expect(prettyFormatMock).toHaveBeenCalledTimes(2);
      expect(fsMock.writeFileSync).not.toHaveBeenCalledWith(
        dirtyImageFilePath,
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe("dirty image is deleted", () => {
    it("when image is dirty but update mode is set to 'all'", () => {
      fsMock.existsSync.mockReturnValue(true);
      mockTestState({ update: "all", snapshotData: "<canvas data-snapshot='true' />" });
      prettyFormatMock.mockImplementation(element => {
        const isSnapshotCanvas = Boolean(element.getAttribute("data-snapshot"));
        return isSnapshotCanvas ? "snapshotCanvasFormatted" : "receivedCanvasFormatted";
      });

      const canvas = createCanvas();
      canvasSnapshotSerializer.print(canvas);

      expect(fsMock.existsSync).toHaveBeenCalledWith(dirtyImageFilePath);
      expect(fsMock.unlinkSync).toHaveBeenCalledWith(dirtyImageFilePath);
    });

    describe("when image is not dirty", () => {
      ["new", "all", "none"].forEach(update => {
        it(`and update mode is set to "${update}"`, () => {
          fsMock.existsSync.mockReturnValue(true);
          mockTestState({ update, snapshotData: "<canvas data-snapshot='true' />" });
          prettyFormatMock.mockReturnValue("formatted canvas snapshot");

          const canvas = createCanvas();
          canvasSnapshotSerializer.print(canvas);

          expect(prettyFormatMock).toHaveBeenCalledTimes(2);
          expect(fsMock.existsSync).toHaveBeenCalledWith(dirtyImageFilePath);
          expect(fsMock.unlinkSync).toHaveBeenCalledWith(dirtyImageFilePath);
        });
      });
    });
  });

  describe("dirty image is not deleted", () => {
    ["new", "all", "none"].forEach(update => {
      it(`when it does not exist and update mode is set to "${update}"`, () => {
        fsMock.existsSync.mockImplementation(pathname => pathname !== dirtyImageFilePath);
        // the snapshotData is not of interest here
        // it only has to be defined to invoke prettyFormat
        mockTestState({ update, snapshotData: "canvas snapshot" });

        // should be called one for the received canvas element
        // and once for the persisted snapshot
        prettyFormatMock.mockReturnValue("formatted canvas snapshot");

        const canvas = createCanvas();
        canvasSnapshotSerializer.print(canvas);

        expect(prettyFormatMock).toHaveBeenCalledTimes(2);
        expect(fsMock.existsSync).toHaveBeenCalledWith(dirtyImageFilePath);
        expect(fsMock.unlinkSync).not.toHaveBeenCalledWith(dirtyImageFilePath);
      });
    });
  });

  function mockTestState({ update = "new", snapshotData = null } = {}) {
    const _snapshotData = {};
    if (snapshotData) {
      _snapshotData[currentTestName + " 1"] = snapshotData;
    }
    getStateMock.mockReturnValue({
      currentTestName,
      snapshotState: {
        _snapshotData,
        _snapshotPath: snapshotPath,
        _updateSnapshot: update,
      },
    });
  }

  function createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("width", "200");
    canvas.setAttribute("height", "200");

    const context = canvas.getContext("2d");
    context.font = "24px Helvetica";
    context.fillStyle = "#B4D455";
    context.fillText("Canvas", 50, 130);

    return canvas;
  }

  function createExpectedCanvas(canvas) {
    const expectedCanvas = canvas.cloneNode();
    expectedCanvas.setAttribute("data-snapshot-image", canvas.toDataURL());
    return expectedCanvas;
  }
});
