<script>
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import { connect, error } from '../stores/connection.js';
  import { generateBoard } from '@hues/shared/board';

  // --- Form state ---
  let activeTab = 'join';
  let playerName = '';
  let joinRoomCode = '';
  let joinPlayerName = '';

  function handleCreate() {
    if (!playerName.trim()) return;
    connect('create', { playerName: playerName.trim() });
  }

  function handleJoin() {
    if (!joinRoomCode.trim() || !joinPlayerName.trim()) return;
    connect('join', {
      roomCode: joinRoomCode.trim().toUpperCase(),
      playerName: joinPlayerName.trim(),
    });
  }

  function handleCodeInput(e) {
    joinRoomCode = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  }

  // --- Full-screen grid animation ---
  const COLS = 30;
  const ROWS = 16;

  const board = generateBoard(COLS, ROWS);

  const MARKER_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e'];

  let targetIdx = null;
  let markers = [];

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runCycle(signal) {
    if (signal.cancelled) return;

    // Pick target away from edges
    const col = 4 + Math.floor(Math.random() * (COLS - 8));
    const row = 1 + Math.floor(Math.random() * (ROWS - 6));
    targetIdx = row * COLS + col;
    markers = [];

    await wait(900);

    for (let i = 0; i < MARKER_COLORS.length; i++) {
      if (signal.cancelled) return;
      const sign = i % 2 === 0 ? 1 : -1;
      const dCol = sign * (2 + Math.floor(Math.random() * 6));
      const dRow = Math.floor(Math.random() * 5) - 2;
      const mCol = Math.max(1, Math.min(COLS - 2, col + dCol));
      const mRow = Math.max(0, Math.min(ROWS - 1, row + dRow));
      markers = [...markers, { idx: mRow * COLS + mCol, color: MARKER_COLORS[i] }];
      await wait(430);
    }

    if (signal.cancelled) return;
    await wait(1300);

    targetIdx = null;
    markers = [];

    await wait(600);
    runCycle(signal);
  }

  onMount(() => {
    const signal = { cancelled: false };
    const t = setTimeout(() => runCycle(signal), 400);
    return () => {
      signal.cancelled = true;
      clearTimeout(t);
    };
  });
</script>

<div class="h-full relative overflow-hidden">

  <!-- ── Full-screen color grid ── -->
  <div
    class="absolute inset-0 grid"
    style="grid-template-columns: repeat({COLS}, 1fr); grid-template-rows: repeat({ROWS}, 1fr);"
  >
    {#each board as cell, i}
      <div class="relative" style="background-color: {cell.hex};">
        {#if i === targetIdx}
          <div class="absolute inset-[2px] border-2 border-white/90 rounded-sm target-ring pointer-events-none"></div>
        {/if}
        {#each markers.filter(m => m.idx === i) as marker (marker.color)}
          <div
            in:scale={{ duration: 220, start: 0 }}
            out:scale={{ duration: 150, start: 0 }}
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              class="marker-dot rounded-full border-2 border-white/80 shadow-md"
              style="background-color: {marker.color};"
            ></div>
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <!-- Top scrim + title -->
  <div class="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none"></div>
  <div class="absolute inset-x-0 top-0 flex flex-col items-center pt-10 sm:pt-14 pointer-events-none">
    <h1 class="rainbow-title text-5xl sm:text-6xl font-black tracking-tighter leading-none">
      HUES &amp; CUES
    </h1>
  </div>

  <!-- ── Form overlay panel (centered card) ── -->
  <div class="absolute inset-0 flex items-start justify-center px-5 pt-[calc(50vh-144px)] pointer-events-none">
    <div class="w-full max-w-sm bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/15 p-6 space-y-3 pointer-events-auto">

      <!-- Tab switcher -->
      <div class="flex bg-white/[0.07] rounded-xl p-1 gap-1">
        <button
          class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-150
            {activeTab === 'join' ? 'bg-white text-slate-950 shadow-sm' : 'text-white/75 hover:text-white'}"
          on:click={() => activeTab = 'join'}
        >
          Join Friends
        </button>
        <button
          class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-150
            {activeTab === 'create' ? 'bg-white text-slate-950 shadow-sm' : 'text-white/75 hover:text-white'}"
          on:click={() => activeTab = 'create'}
        >
          Create Room
        </button>
      </div>

      <div>
        {#if activeTab === 'join'}
          <form on:submit|preventDefault={handleJoin} class="space-y-2.5">
            <input
              type="text"
              bind:value={joinPlayerName}
              placeholder="Your name"
              maxlength="20"
              class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/30 focus:border-white/60 focus:ring-2 focus:ring-white/20 outline-none transition-all text-white placeholder-white/50 font-medium"
            />
            <input
              type="text"
              value={joinRoomCode}
              on:input={handleCodeInput}
              placeholder="ROOM"
              maxlength="4"
              class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/30 focus:border-white/60 focus:ring-2 focus:ring-white/20 outline-none transition-all text-white placeholder-white/35 font-mono text-center text-3xl font-black tracking-[0.4em] uppercase"
            />
            <button
              type="submit"
              disabled={!joinRoomCode.trim() || !joinPlayerName.trim() || joinRoomCode.length < 4}
              class="w-full py-3.5 rounded-xl font-bold text-slate-950 bg-white hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-[0.98] tracking-wide"
            >
              Join Game
            </button>
          </form>
        {:else}
          <form on:submit|preventDefault={handleCreate} class="space-y-2.5">
            <input
              type="text"
              bind:value={playerName}
              placeholder="Your name"
              maxlength="20"
              class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/30 focus:border-white/60 focus:ring-2 focus:ring-white/20 outline-none transition-all text-white placeholder-white/50 font-medium"
            />
            <button
              type="submit"
              disabled={!playerName.trim()}
              class="w-full py-3.5 rounded-xl font-bold text-slate-950 bg-white hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-[0.98] tracking-wide"
            >
              Start New Game
            </button>
          </form>
        {/if}
      </div>

      {#if $error}
        <p class="text-rose-400 text-sm text-center animate-shake">{$error}</p>
      {/if}

    </div>
  </div>

</div>

<style>
  @keyframes rainbow-shift {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes rainbow-glow {
    0%   { filter: drop-shadow(0 0 8px rgba(255,0,128,0.9))  drop-shadow(0 0 24px rgba(255,0,128,0.5)); }
    16%  { filter: drop-shadow(0 0 8px rgba(255,100,0,0.9))  drop-shadow(0 0 24px rgba(255,100,0,0.5)); }
    33%  { filter: drop-shadow(0 0 8px rgba(255,220,0,0.9))  drop-shadow(0 0 24px rgba(255,220,0,0.5)); }
    50%  { filter: drop-shadow(0 0 8px rgba(0,220,120,0.9))  drop-shadow(0 0 24px rgba(0,220,120,0.5)); }
    66%  { filter: drop-shadow(0 0 8px rgba(0,180,255,0.9))  drop-shadow(0 0 24px rgba(0,180,255,0.5)); }
    83%  { filter: drop-shadow(0 0 8px rgba(180,0,255,0.9))  drop-shadow(0 0 24px rgba(180,0,255,0.5)); }
    100% { filter: drop-shadow(0 0 8px rgba(255,0,128,0.9))  drop-shadow(0 0 24px rgba(255,0,128,0.5)); }
  }
  .rainbow-title {
    background: linear-gradient(90deg,
      #ff0080, #ff4500, #ffcc00, #00fa9a, #00bfff, #bf00ff, #ff0080
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: rainbow-shift 10s linear infinite, rainbow-glow 10s linear infinite;
  }

  @keyframes pulse-ring {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.75); }
  }
  .target-ring {
    animation: pulse-ring 0.95s ease-in-out infinite;
  }

  .marker-dot {
    width: clamp(7px, 1.2vw, 12px);
    height: clamp(7px, 1.2vw, 12px);
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  .animate-shake {
    animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
    animation-iteration-count: 2;
  }
</style>
