class Script {
    constructor(path, script) {
        this.path = path;
        this.script = script;
        this.lines = script.split("\r\n\r\n");
    }
}