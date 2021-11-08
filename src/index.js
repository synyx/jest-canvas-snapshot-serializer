const fs = require("fs");
const path = require("path");
const hasha = require("hasha");
const createCanvasSnapshotSerializer = require("./canvasSnapshotSerializer");

module.exports = createCanvasSnapshotSerializer(fs, path, hasha, expect.getState);
