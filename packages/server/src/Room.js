import { Player } from './Player.js';
import { S2C, PHASES } from '@hues/shared/protocol';
import { DEFAULT_COLS, DEFAULT_ROWS } from '@hues/shared/board';
import { chebyshevDistance, scoreGuess, scoreCueGiver, DEFAULT_SCORING_RADII } from '@hues/shared/scoring';
import { validateClue } from '@hues/shared/validation';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a random room code (4 uppercase letters, excluding I and O).
 */
export function generateRoomCode() {
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    return code;
}

function defaultSettings() {
    return {
        cols: DEFAULT_COLS,
        rows: DEFAULT_ROWS,
        cardsPerRound: 4,
        clueWordLimits: [1, 2],
        scoringRadii: [...DEFAULT_SCORING_RADII.map(r => ({ ...r }))],
        phaseTimerSeconds: 60,
        totalRounds: null,
    };
}

export class Room {
    constructor(code) {
        this.code = code;
        this.players = new Map();
        this.settings = defaultSettings();
        this.phase = PHASES.LOBBY;
        this.currentRoundNum = 1;
        this.cueGiverOrder = [];
        this.cueGiverIdx = 0;
        this.targetCell = null;
        this.cardOptions = null;
        this.clues = [];
        this.cluePhaseIndex = 0;
        this.guesses = new Map();
        this.phaseTimer = null;
        this.phaseDeadline = null;
        this.usedCells = new Set();
        this.nextOrder = 0;
        this.lastActivity = Date.now();
    }

    get cueGiverId() {
        return this.cueGiverOrder[this.cueGiverIdx] || null;
    }

    get cueGiver() {
        return this.players.get(this.cueGiverId);
    }

    broadcast(msg, filterFn) {
        for (const player of this.players.values()) {
            if (!player.connected) continue;
            if (filterFn && !filterFn(player)) continue;
            player.send(msg);
        }
    }

    broadcastExceptCueGiver(msg) {
        this.broadcast(msg, (p) => p.id !== this.cueGiverId);
    }

    sendToCueGiver(msg) {
        const cg = this.cueGiver;
        if (cg) cg.send(msg);
    }

    connectedGuessers() {
        return [...this.players.values()].filter(
            (p) => p.connected && p.id !== this.cueGiverId
        );
    }

    getFullState(forPlayerId) {
        const isCueGiver = forPlayerId === this.cueGiverId;
        return {
            phase: this.phase,
            players: [...this.players.values()].map((p) => p.toPublic()),
            settings: this.settings,
            currentRoundNum: this.currentRoundNum,
            cueGiverId: this.cueGiverId,
            cardOptions: isCueGiver && this.phase === PHASES.PICK_TARGET ? this.cardOptions : null,
            clues: [...this.clues],
            cluePhaseIndex: this.phase === PHASES.CLUE ? this.cluePhaseIndex : null,
            phaseDeadline: this.phaseDeadline,
            revealData: null,
            gameOverData: null,
        };
    }

    clearPhaseTimer() {
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
            this.phaseTimer = null;
        }
        this.phaseDeadline = null;
    }

    startPhaseTimer(callback) {
        this.clearPhaseTimer();
        if (this.settings.phaseTimerSeconds > 0) {
            const ms = this.settings.phaseTimerSeconds * 1000;
            this.phaseDeadline = Date.now() + ms;
            this.phaseTimer = setTimeout(() => {
                this.phaseTimer = null;
                callback();
            }, ms);
            this.broadcast({ type: S2C.TIMER_SYNC, phaseDeadline: this.phaseDeadline });
        }
    }

    addPlayer(name, ws) {
        const isHost = this.players.size === 0;
        const player = new Player(name, ws, this.nextOrder++, isHost);
        this.players.set(player.id, player);
        return player;
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    handleMessage(playerId, msg) {
        this.lastActivity = Date.now();
        const player = this.players.get(playerId);
        if (!player) return;

        switch (msg.type) {
            case 'START_GAME':
                return this.handleStartGame(player);
            case 'UPDATE_SETTINGS':
                return this.handleUpdateSettings(player, msg);
            case 'PICK_TARGET':
                return this.handlePickTarget(player, msg);
            case 'SUBMIT_CLUE':
                return this.handleSubmitClue(player, msg);
            case 'SUBMIT_GUESS':
                return this.handleSubmitGuess(player, msg);
            case 'KICK_PLAYER':
                return this.handleKickPlayer(player, msg);
            default:
                player.send({ type: S2C.ERROR, message: `Unknown message type: ${msg.type}` });
        }
    }

    handleStartGame(player) {
        if (!player.isHost) {
            return player.send({ type: S2C.ERROR, message: 'Only the host can start the game' });
        }
        if (this.phase !== PHASES.LOBBY && this.phase !== PHASES.GAME_OVER) {
            return player.send({ type: S2C.ERROR, message: 'Game already in progress' });
        }
        const connected = [...this.players.values()].filter((p) => p.connected);
        if (connected.length < 3) {
            return player.send({ type: S2C.ERROR, message: 'Need at least 3 connected players to start' });
        }

        // Reset game state
        for (const p of this.players.values()) {
            p.score = 0;
        }
        this.cueGiverOrder = [...this.players.values()]
            .sort((a, b) => a.order - b.order)
            .map((p) => p.id);
        this.cueGiverIdx = 0;
        this.currentRoundNum = 1;
        this.usedCells.clear();

        this.transitionToPickTarget();
    }

    handleUpdateSettings(player, msg) {
        if (!player.isHost) {
            return player.send({ type: S2C.ERROR, message: 'Only the host can update settings' });
        }
        if (this.phase !== PHASES.LOBBY) {
            return player.send({ type: S2C.ERROR, message: 'Settings can only be changed in the lobby' });
        }

        const s = msg.settings || {};

        if (s.cardsPerRound !== undefined) {
            const v = Number(s.cardsPerRound);
            if (v >= 2 && v <= 6) this.settings.cardsPerRound = v;
        }
        if (s.clueWordLimits !== undefined && Array.isArray(s.clueWordLimits)) {
            const arr = s.clueWordLimits.map(Number).filter((n) => n >= 1 && n <= 5);
            if (arr.length >= 1 && arr.length <= 4) this.settings.clueWordLimits = arr;
        }
        if (s.scoringRadii !== undefined && Array.isArray(s.scoringRadii)) {
            this.settings.scoringRadii = s.scoringRadii;
        }
        if (s.phaseTimerSeconds !== undefined) {
            const v = Number(s.phaseTimerSeconds);
            if (v === 0 || v >= 10) this.settings.phaseTimerSeconds = v;
        }
        if (s.totalRounds !== undefined) {
            this.settings.totalRounds = s.totalRounds === null ? null : Math.max(1, Number(s.totalRounds));
        }

        this.broadcast({ type: S2C.SETTINGS_UPDATED, settings: this.settings });
    }

    handlePickTarget(player, msg) {
        if (this.phase !== PHASES.PICK_TARGET) {
            return player.send({ type: S2C.ERROR, message: 'Not in pick target phase' });
        }
        if (player.id !== this.cueGiverId) {
            return player.send({ type: S2C.ERROR, message: 'Only the cue giver can pick a target' });
        }
        const idx = msg.cellIndex;
        if (!this.cardOptions || !this.cardOptions.includes(idx)) {
            return player.send({ type: S2C.ERROR, message: 'Invalid target cell' });
        }

        this.targetCell = idx;
        this.usedCells.add(idx);
        this.cluePhaseIndex = 0;
        this.clues = [];
        this.guesses.clear();
        for (const p of this.players.values()) {
            if (p.id !== this.cueGiverId) {
                const guessSlots = {};
                for (let i = 0; i < this.settings.clueWordLimits.length; i++) {
                    guessSlots[`g${i + 1}`] = null;
                }
                this.guesses.set(p.id, guessSlots);
            }
        }

        this.transitionToClue();
    }

    handleSubmitClue(player, msg) {
        if (this.phase !== PHASES.CLUE) {
            return player.send({ type: S2C.ERROR, message: 'Not in clue phase' });
        }
        if (player.id !== this.cueGiverId) {
            return player.send({ type: S2C.ERROR, message: 'Only the cue giver can submit a clue' });
        }

        const maxWords = this.settings.clueWordLimits[this.cluePhaseIndex];
        const result = validateClue(msg.text, maxWords);
        if (!result.valid) {
            return player.send({ type: S2C.ERROR, message: result.error });
        }

        const clueText = msg.text.trim();
        this.clues.push(clueText);

        this.transitionToGuess(clueText);
    }

    handleSubmitGuess(player, msg) {
        if (this.phase !== PHASES.GUESS) {
            return player.send({ type: S2C.ERROR, message: 'Not in guess phase' });
        }
        if (player.id === this.cueGiverId) {
            return player.send({ type: S2C.ERROR, message: 'Cue giver cannot guess' });
        }

        const cellIndex = msg.cellIndex;
        const totalCells = this.settings.cols * this.settings.rows;
        if (cellIndex < 0 || cellIndex >= totalCells) {
            return player.send({ type: S2C.ERROR, message: 'Invalid cell index' });
        }

        const guessKey = `g${this.cluePhaseIndex + 1}`;
        const playerGuesses = this.guesses.get(player.id);
        if (!playerGuesses) {
            return player.send({ type: S2C.ERROR, message: 'You are not a guesser this round' });
        }
        if (playerGuesses[guessKey] !== null) {
            return player.send({ type: S2C.ERROR, message: 'You already guessed this phase' });
        }

        playerGuesses[guessKey] = cellIndex;
        player.send({ type: S2C.GUESS_ACK, cellIndex });

        this.checkAllGuessersSubmitted();
    }

    handleKickPlayer(player, msg) {
        if (!player.isHost) {
            return player.send({ type: S2C.ERROR, message: 'Only the host can kick players' });
        }
        const target = this.players.get(msg.playerId);
        if (!target || target.isHost) {
            return player.send({ type: S2C.ERROR, message: 'Cannot kick that player' });
        }
        if (target.ws) {
            target.ws.close();
        }
        this.players.delete(msg.playerId);
        this.broadcast({ type: S2C.PLAYER_LEFT, playerId: msg.playerId });
    }

    transitionToPickTarget() {
        this.clearPhaseTimer();
        this.phase = PHASES.PICK_TARGET;
        this.targetCell = null;
        this.cardOptions = this.generateCardOptions();
        this.sendToCueGiver({
            type: S2C.PHASE_CHANGED,
            phase: PHASES.PICK_TARGET,
            cueGiverId: this.cueGiverId,
            currentRoundNum: this.currentRoundNum,
            cardOptions: this.cardOptions,
        });
        this.broadcastExceptCueGiver({
            type: S2C.PHASE_CHANGED,
            phase: PHASES.PICK_TARGET,
            cueGiverId: this.cueGiverId,
            currentRoundNum: this.currentRoundNum,
        });
    }

    transitionToClue() {
        this.clearPhaseTimer();
        this.phase = PHASES.CLUE;
        const wordLimit = this.settings.clueWordLimits[this.cluePhaseIndex];

        this.broadcast({
            type: S2C.PHASE_CHANGED,
            phase: PHASES.CLUE,
            clueIndex: this.cluePhaseIndex,
            wordLimit,
            cueGiverId: this.cueGiverId,
        });
    }

    transitionToGuess(clueText) {
        this.clearPhaseTimer();
        this.phase = PHASES.GUESS;

        this.broadcast({
            type: S2C.PHASE_CHANGED,
            phase: PHASES.GUESS,
            clueIndex: this.cluePhaseIndex,
            clue: clueText,
            cueGiverId: this.cueGiverId,
        });

        this.startPhaseTimer(() => {
            this.onGuessTimerExpired();
        });
    }

    transitionToReveal() {
        this.clearPhaseTimer();
        this.phase = PHASES.REVEAL;

        const { cols } = this.settings;
        const scoringRadii = this.settings.scoringRadii;

        // Compute scores
        const roundScores = {};
        const allGuessesFlat = [];

        // Score each guesser
        for (const [pid, gs] of this.guesses.entries()) {
            let total = 0;
            for (const key of Object.keys(gs)) {
                const g = gs[key];
                if (g != null) {
                    allGuessesFlat.push(g);
                    const dist = chebyshevDistance(g, this.targetCell, cols);
                    total += scoreGuess(dist, scoringRadii);
                }
            }
            roundScores[pid] = total;
            const player = this.players.get(pid);
            if (player) player.score += total;
        }

        // Score cue giver
        const cgScore = scoreCueGiver(allGuessesFlat, this.targetCell, cols, scoringRadii);
        roundScores[this.cueGiverId] = cgScore;
        const cg = this.cueGiver;
        if (cg) cg.score += cgScore;

        // Build total scores
        const totalScores = {};
        for (const p of this.players.values()) {
            totalScores[p.id] = p.score;
        }

        // Convert guesses for broadcast
        const guessesObj = {};
        for (const [pid, gs] of this.guesses.entries()) {
            guessesObj[pid] = gs;
        }

        const revealData = {
            targetCell: this.targetCell,
            guesses: guessesObj,
            roundScores,
            totalScores,
        };

        this.broadcast({
            type: S2C.REVEAL,
            ...revealData,
        });

        this.phaseTimer = setTimeout(() => {
            this.advanceRound();
        }, 8000);
    }

    transitionToGameOver() {
        this.clearPhaseTimer();
        this.phase = PHASES.GAME_OVER;

        const finalScores = {};
        for (const p of this.players.values()) {
            finalScores[p.id] = p.score;
        }

        let winner = null;
        let bestScore = -1;
        let bestOrder = Infinity;
        for (const p of this.players.values()) {
            if (p.score > bestScore || (p.score === bestScore && p.order < bestOrder)) {
                bestScore = p.score;
                bestOrder = p.order;
                winner = p.id;
            }
        }

        this.broadcast({
            type: S2C.GAME_OVER,
            finalScores,
            winner,
        });
    }

    advanceRound() {
        this.cluePhaseIndex = 0;
        this.cueGiverIdx++;

        let attempts = 0;
        while (attempts < this.cueGiverOrder.length) {
            if (this.cueGiverIdx >= this.cueGiverOrder.length) {
                this.cueGiverIdx = 0;
            }
            const nextCG = this.players.get(this.cueGiverId);
            if (nextCG && nextCG.connected) break;
            this.cueGiverIdx++;
            attempts++;
        }

        if (attempts >= this.cueGiverOrder.length) {
            return this.transitionToGameOver();
        }

        this.currentRoundNum++;

        if (this.isGameDone()) {
            return this.transitionToGameOver();
        }

        this.transitionToPickTarget();
    }

    isGameDone() {
        if (this.settings.totalRounds !== null) {
            return this.currentRoundNum > this.settings.totalRounds;
        }
        return this.currentRoundNum > this.cueGiverOrder.length;
    }

    checkAllGuessersSubmitted() {
        const guessKey = `g${this.cluePhaseIndex + 1}`;
        const connectedGuessers = this.connectedGuessers();
        const allSubmitted = connectedGuessers.every((p) => {
            const gs = this.guesses.get(p.id);
            return gs && gs[guessKey] !== null;
        });

        if (allSubmitted) {
            this.onAllGuessesIn();
        }
    }

    onGuessTimerExpired() {
        this.onAllGuessesIn();
    }

    onAllGuessesIn() {
        this.cluePhaseIndex++;
        if (this.cluePhaseIndex < this.settings.clueWordLimits.length) {
            this.transitionToClue();
        } else {
            this.transitionToReveal();
        }
    }

    generateCardOptions() {
        const totalCells = this.settings.cols * this.settings.rows;
        let count = Math.min(this.settings.cardsPerRound, totalCells);
        if (totalCells - this.usedCells.size < count) {
            this.usedCells.clear();
        }

        const options = new Set();
        while (options.size < count) {
            const idx = Math.floor(Math.random() * totalCells);
            if (!this.usedCells.has(idx) && !options.has(idx)) {
                options.add(idx);
            }
        }
        return [...options];
    }

    handleDisconnect(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        player.connected = false;
        player.ws = null;
        this.broadcast({ type: S2C.PLAYER_DISCONNECTED, playerId });

        if (player.isHost) {
            player.isHost = false;
            const nextHost = [...this.players.values()]
                .filter((p) => p.connected)
                .sort((a, b) => a.order - b.order)[0];
            if (nextHost) {
                nextHost.isHost = true;
                this.broadcast({ type: S2C.PLAYER_JOINED, player: nextHost.toPublic() });
            }
        }

        if (
            playerId === this.cueGiverId &&
            this.phase !== PHASES.LOBBY &&
            this.phase !== PHASES.GAME_OVER &&
            this.phase !== PHASES.REVEAL
        ) {
            this.advanceRound();
            return;
        }

        if (this.phase === PHASES.GUESS && playerId !== this.cueGiverId) {
            this.checkAllGuessersSubmitted();
        }
    }

    handleReconnect(playerId, ws) {
        const player = this.players.get(playerId);
        if (!player) return false;

        player.ws = ws;
        player.connected = true;
        this.broadcast({ type: S2C.PLAYER_RECONNECTED, playerId });

        player.send({
            type: S2C.ROOM_JOINED,
            playerId: player.id,
            state: this.getFullState(playerId),
        });

        if (this.phaseDeadline) {
            player.send({ type: S2C.TIMER_SYNC, phaseDeadline: this.phaseDeadline });
        }

        return true;
    }
}
