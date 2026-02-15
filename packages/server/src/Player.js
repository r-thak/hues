import crypto from 'crypto';

/**
 * Represents a connected player in a game room.
 */
export class Player {
    /**
     * @param {string} name
     * @param {import('ws').WebSocket} ws
     * @param {number} order
     * @param {boolean} isHost
     */
    constructor(name, ws, order, isHost = false) {
        this.id = crypto.randomUUID();
        this.name = name;
        this.score = 0;
        this.connected = true;
        this.ws = ws;
        this.order = order;
        this.isHost = isHost;
    }

    /**
     * Send a message to this player's WebSocket.
     * @param {object} msgObject
     */
    send(msgObject) {
        if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN = 1
            this.ws.send(JSON.stringify(msgObject));
        }
    }

    /**
     * Return a public-safe representation (no ws reference).
     */
    toPublic() {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            connected: this.connected,
            isHost: this.isHost,
            order: this.order,
        };
    }
}
