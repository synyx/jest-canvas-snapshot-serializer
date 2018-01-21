const fs = require("fs");
const path = require("path");
const prettyFormat = require("pretty-format");
const createCanvasSnapshotSerializer = require("./canvasSnapshotSerializer");

module.exports = createCanvasSnapshotSerializer(fs, path, prettyFormat, expect.getState);
