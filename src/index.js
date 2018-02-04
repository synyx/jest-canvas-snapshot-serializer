const fs = require("fs");
const path = require("path");
const hasha = require("hasha");
const prettyFormat = require("pretty-format");
const createCanvasSnapshotSerializer = require("./canvasSnapshotSerializer");

module.exports = createCanvasSnapshotSerializer(fs, path, hasha, prettyFormat, expect.getState);
