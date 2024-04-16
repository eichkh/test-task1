const fs = require("fs");

class FileManager {
    static readData(filePath) {
        return fs.readFileSync(filePath, "utf8");
    }
}

module.exports = FileManager;
