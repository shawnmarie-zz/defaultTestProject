const INSTANCE_URL = process.env.INSTANCE ||  "http://";
module.exports = class Connector {
    constructor() {
        this.instanceUrl = INSTANCE_URL;
        this.username = "shawnmarie";
        this.password = "shawnmarie";
    }
}