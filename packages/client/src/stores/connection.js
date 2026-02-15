import { writable, get } from 'svelte/store';
import { C2S, S2C } from '@hues/shared/protocol';
import { handleServerMessage } from './gameState.js';

export const connected = writable(false);
export const playerId = writable(null);
export const roomCode = writable(null);
export const error = writable(null);

let ws = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
const MAX_RECONNECT_ATTEMPTS = 10;

function getWsUrl() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}/ws`;
}

function onMessage(event) {
    let msg;
    try {
        msg = JSON.parse(event.data);
    } catch {
        return;
    }

    switch (msg.type) {
        case S2C.ROOM_CREATED:
            playerId.set(msg.playerId);
            roomCode.set(msg.roomCode);
            sessionStorage.setItem('hues_playerId', msg.playerId);
            sessionStorage.setItem('hues_roomCode', msg.roomCode);
            error.set(null);
            break;
        case S2C.ROOM_JOINED:
            playerId.set(msg.playerId);
            sessionStorage.setItem('hues_playerId', msg.playerId);
            error.set(null);
            break;
        case S2C.ERROR:
            error.set(msg.message);
            return;
        default:
            break;
    }
    handleServerMessage(msg);
}

// Handle player disconnects
function onClose() {
    connected.set(false);
    ws = null;

    const pid = get(playerId);
    const rc = get(roomCode);

    if (pid && rc && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimer = setTimeout(() => {
            attemptReconnect(rc, pid);
        }, delay);
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        error.set('Connection lost. Please refresh the page.');
    }
}

function attemptReconnect(code, pid) {
    try {
        ws = new WebSocket(getWsUrl());
        ws.onopen = () => {
            connected.set(true);
            reconnectAttempts = 0;
            send({ type: C2S.REJOIN_ROOM, roomCode: code, playerId: pid });
        };
        ws.onmessage = onMessage;
        ws.onclose = onClose;
        ws.onerror = () => { }; // fires close
    } catch {
        onClose();
    }
}

/**
 * Connect to the server.
 * @param {'create'|'join'|'rejoin'} mode
 * @param {object} params
 */
export function connect(mode, params = {}) {
    if (reconnectTimer) { // cleanup
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
    }
    reconnectAttempts = 0;
    error.set(null);

    try {
        ws = new WebSocket(getWsUrl());
    } catch (e) {
        error.set('Could not connect to server');
        return;
    }

    ws.onopen = () => {
        connected.set(true);
        if (mode === 'create') {
            send({ type: C2S.CREATE_ROOM, playerName: params.playerName });
        } else if (mode === 'join') {
            send({ type: C2S.JOIN_ROOM, roomCode: params.roomCode, playerName: params.playerName });
            roomCode.set(params.roomCode.toUpperCase());
            sessionStorage.setItem('hues_roomCode', params.roomCode.toUpperCase());
        } else if (mode === 'rejoin') {
            send({ type: C2S.REJOIN_ROOM, roomCode: params.roomCode, playerId: params.playerId });
        }
    };
    ws.onmessage = onMessage;
    ws.onclose = onClose;
    ws.onerror = () => { };
}

/**
 * Send a message object on the WebSocket.
 */
export function send(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
    }
}

/**
 * Attempt to rejoin from session storage on page load.
 */
export function tryRejoin() {
    const pid = sessionStorage.getItem('hues_playerId');
    const rc = sessionStorage.getItem('hues_roomCode');
    if (pid && rc) {
        connect('rejoin', { roomCode: rc, playerId: pid });
        return true;
    }
    return false;
}

/**
 * Full disconnect and clear session.
 */
export function disconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
    }
    connected.set(false);
    playerId.set(null);
    roomCode.set(null);
    error.set(null);
    sessionStorage.removeItem('hues_playerId');
    sessionStorage.removeItem('hues_roomCode');
}
