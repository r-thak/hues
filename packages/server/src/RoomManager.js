import { Room, generateRoomCode } from './Room.js';
import { C2S, S2C } from '@hues/shared/protocol';

/**
 * Manages all active game rooms.
 */
export class RoomManager {
    constructor() {
        /** @type {Map<string, Room>} */
        this.rooms = new Map();

        // Cleanup interval: every 5 minutes, remove rooms inactive for 15+ minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Generate a unique room code.
     */
    generateUniqueCode() {
        let code;
        let attempts = 0;
        do {
            code = generateRoomCode();
            attempts++;
            if (attempts > 1000) throw new Error('Cannot generate unique room code');
        } while (this.rooms.has(code));
        return code;
    }

    /**
     * Handle a new WebSocket connection.
     * @param {import('ws').WebSocket} ws
     */
    handleConnection(ws) {
        let assignedRoom = null;
        let assignedPlayerId = null;

        ws.on('message', (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            } catch {
                ws.send(JSON.stringify({ type: S2C.ERROR, message: 'Invalid JSON' }));
                return;
            }

            // If not yet assigned to a room, must be a join/create/rejoin message
            if (!assignedRoom) {
                switch (msg.type) {
                    case C2S.CREATE_ROOM:
                        return this.handleCreateRoom(ws, msg, (room, playerId) => {
                            assignedRoom = room;
                            assignedPlayerId = playerId;
                        });
                    case C2S.JOIN_ROOM:
                        return this.handleJoinRoom(ws, msg, (room, playerId) => {
                            assignedRoom = room;
                            assignedPlayerId = playerId;
                        });
                    case C2S.REJOIN_ROOM:
                        return this.handleRejoinRoom(ws, msg, (room, playerId) => {
                            assignedRoom = room;
                            assignedPlayerId = playerId;
                        });
                    default:
                        ws.send(JSON.stringify({
                            type: S2C.ERROR,
                            message: 'First message must be CREATE_ROOM, JOIN_ROOM, or REJOIN_ROOM',
                        }));
                        return;
                }
            }

            // Already in a room: dispatch to room
            assignedRoom.handleMessage(assignedPlayerId, msg);
        });

        ws.on('close', () => {
            if (assignedRoom && assignedPlayerId) {
                assignedRoom.handleDisconnect(assignedPlayerId);
            }
        });

        ws.on('error', () => {
            // errors will trigger close
        });
    }

    handleCreateRoom(ws, msg, assignFn) {
        const name = (msg.playerName || '').trim();
        if (!name) {
            return ws.send(JSON.stringify({ type: S2C.ERROR, message: 'Player name is required' }));
        }

        const code = this.generateUniqueCode();
        const room = new Room(code);
        this.rooms.set(code, room);

        const player = room.addPlayer(name, ws);
        assignFn(room, player.id);

        ws.send(JSON.stringify({
            type: S2C.ROOM_CREATED,
            roomCode: code,
            playerId: player.id,
            settings: room.settings,
            players: [player.toPublic()],
        }));
    }

    handleJoinRoom(ws, msg, assignFn) {
        const code = (msg.roomCode || '').toUpperCase().trim();
        const name = (msg.playerName || '').trim();

        if (!name) {
            return ws.send(JSON.stringify({ type: S2C.ERROR, message: 'Player name is required' }));
        }

        const room = this.rooms.get(code);
        if (!room) {
            return ws.send(JSON.stringify({ type: S2C.ERROR, message: 'Room not found' }));
        }

        // Bar joining mid-game
        if (room.phase !== 'lobby') {
            return ws.send(JSON.stringify({ type: S2C.ERROR, message: 'Game already in progress' }));
        }

        const player = room.addPlayer(name, ws);
        assignFn(room, player.id);

        // Send full state to joining player
        ws.send(JSON.stringify({
            type: S2C.ROOM_JOINED,
            playerId: player.id,
            state: room.getFullState(player.id),
        }));

        // Broadcast to others
        room.broadcast(
            { type: S2C.PLAYER_JOINED, player: player.toPublic() },
            (p) => p.id !== player.id
        );
    }

    handleRejoinRoom(ws, msg, assignFn) {
        const code = (msg.roomCode || '').toUpperCase().trim();
        const playerId = msg.playerId;

        const room = this.rooms.get(code);
        if (!room) {
            return ws.send(JSON.stringify({ type: S2C.ERROR, message: 'Room or player not found' }));
        }

        const success = room.handleReconnect(playerId, ws);
        if (!success) {
            return ws.send(JSON.stringify({ type: S2C.ERROR, message: 'Room or player not found' }));
        }

        assignFn(room, playerId);
    }

    cleanup() {
        const now = Date.now();
        const timeout = 15 * 60 * 1000;

        for (const [code, room] of this.rooms.entries()) {
            const allDisconnected = [...room.players.values()].every((p) => !p.connected);
            if (allDisconnected && now - room.lastActivity > timeout) {
                room.clearPhaseTimer();
                this.rooms.delete(code);
                console.log(`[RoomManager] Cleaned up room ${code}`);
            }
        }
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        for (const room of this.rooms.values()) {
            room.clearPhaseTimer();
        }
    }
}
