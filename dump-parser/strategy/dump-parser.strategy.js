class DumpParserStrategy {
    constructor() {}
    parse(jsonData) {
        throw new Error("parse method must be implemented");
    }
}

module.exports = DumpParserStrategy;
