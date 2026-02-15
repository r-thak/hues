import { writable, get } from 'svelte/store';
import { S2C } from '@hues/shared/protocol';
import { playerId } from './connection.js';

function createInitialState() {
    return {
        phase: null,
        players: [],
        settings: null,
        currentRoundNum: 0,
        cueGiverId: null,
        iAmCueGiver: false,
        iAmHost: false,
        cardOptions: null,
        clues: [],
        currentClueIndex: null,
        wordLimit: null,
        myGuesses: [],
        phaseDeadline: null,
        revealData: null,
        gameOverData: null,
    };
}

export const gameState = writable(createInitialState());

/**
 * Handle an incoming server message and update game state.
 */
export function handleServerMessage(msg) {
    const pid = get(playerId);

    gameState.update((state) => {
        switch (msg.type) {
            case S2C.ROOM_CREATED:
                return {
                    ...createInitialState(),
                    phase: 'lobby',
                    settings: msg.settings,
                    players: msg.players || [],
                    iAmHost: true,
                };

            case S2C.ROOM_JOINED: {
                const s = msg.state;
                return {
                    ...state,
                    phase: s.phase,
                    players: s.players,
                    settings: s.settings,
                    currentRoundNum: s.currentRoundNum,
                    cueGiverId: s.cueGiverId,
                    iAmCueGiver: s.cueGiverId === pid,
                    iAmHost: s.players.find((p) => p.id === pid)?.isHost || false,
                    cardOptions: s.cardOptions,
                    clues: s.clues || [],
                    currentClueIndex: s.cluePhaseIndex,
                    phaseDeadline: s.phaseDeadline,
                    revealData: null,
                    gameOverData: null,
                    myGuesses: [],
                };
            }

            case S2C.PLAYER_JOINED: {
                const existing = state.players.find((p) => p.id === msg.player.id);
                let players;
                if (existing) {
                    players = state.players.map((p) => (p.id === msg.player.id ? msg.player : p));
                } else {
                    players = [...state.players, msg.player];
                }
                return {
                    ...state,
                    players,
                    iAmHost: players.find((p) => p.id === pid)?.isHost || false,
                };
            }

            case S2C.PLAYER_LEFT:
                return {
                    ...state,
                    players: state.players.filter((p) => p.id !== msg.playerId),
                };

            case S2C.PLAYER_DISCONNECTED:
                return {
                    ...state,
                    players: state.players.map((p) =>
                        p.id === msg.playerId ? { ...p, connected: false } : p
                    ),
                };

            case S2C.PLAYER_RECONNECTED:
                return {
                    ...state,
                    players: state.players.map((p) =>
                        p.id === msg.playerId ? { ...p, connected: true } : p
                    ),
                };

            case S2C.SETTINGS_UPDATED:
                return {
                    ...state,
                    settings: msg.settings,
                };

            case S2C.PHASE_CHANGED: {
                const newState = {
                    ...state,
                    phase: msg.phase,
                    cueGiverId: msg.cueGiverId || state.cueGiverId,
                    iAmCueGiver: (msg.cueGiverId || state.cueGiverId) === pid,
                    currentRoundNum: msg.currentRoundNum || state.currentRoundNum,
                    revealData: null,
                };

                if (msg.phase === 'pick_target') {
                    newState.cardOptions = msg.cardOptions || null;
                    newState.clues = [];
                    newState.myGuesses = [];
                    newState.currentClueIndex = null;
                    newState.wordLimit = null;
                } else if (msg.phase === 'clue') {
                    newState.currentClueIndex = msg.clueIndex;
                    newState.wordLimit = msg.wordLimit;
                    newState.cardOptions = null;
                } else if (msg.phase === 'guess') {
                    newState.currentClueIndex = msg.clueIndex;
                    if (msg.clue) {
                        newState.clues = [...state.clues, msg.clue];
                    }
                    newState.cardOptions = null;
                }

                return newState;
            }

            case S2C.GUESS_ACK:
                return {
                    ...state,
                    myGuesses: [...state.myGuesses, msg.cellIndex],
                };

            case S2C.TIMER_SYNC:
                return {
                    ...state,
                    phaseDeadline: msg.phaseDeadline,
                };

            case S2C.REVEAL:
                return {
                    ...state,
                    phase: 'reveal',
                    revealData: {
                        targetCell: msg.targetCell,
                        guesses: msg.guesses,
                        roundScores: msg.roundScores,
                        totalScores: msg.totalScores,
                    },
                    phaseDeadline: null,
                    // Update player scores
                    players: state.players.map((p) => ({
                        ...p,
                        score: msg.totalScores[p.id] ?? p.score,
                    })),
                };

            case S2C.GAME_OVER:
                return {
                    ...state,
                    phase: 'game_over',
                    gameOverData: {
                        finalScores: msg.finalScores,
                        winner: msg.winner,
                    },
                    players: state.players.map((p) => ({
                        ...p,
                        score: msg.finalScores[p.id] ?? p.score,
                    })),
                };

            default:
                return state;
        }
    });
}

export function resetGameState() {
    gameState.set(createInitialState());
}