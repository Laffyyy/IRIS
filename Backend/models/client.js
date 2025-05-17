// models/client.js

class Client {
    constructor(clientId, clientName, LOB, subLOB, createdBy, createdAt) {
        this.clientId = clientId;
        this.clientName = clientName;
        this.LOB = LOB;
        this.subLOB = subLOB;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}

module.exports = Client;