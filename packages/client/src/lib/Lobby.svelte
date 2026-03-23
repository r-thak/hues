<script>
  import { createEventDispatcher } from 'svelte';
  import { roomCode, playerId, error } from '../stores/connection.js';
  import { gameState } from '../stores/gameState.js';
  import { send } from '../stores/connection.js';
  import { C2S } from '@hues/shared/protocol';
  import { generateBoard } from '@hues/shared/board';
  import Settings from './Settings.svelte';

  const dispatch = createEventDispatcher();

  $: players = $gameState.players;
  $: isHost = $gameState.iAmHost;
  $: connectedCount = players.filter((p) => p.connected).length;

  const board = generateBoard(30, 16);

  function startGame() {
    send({ type: C2S.START_GAME });
  }

  function kickPlayer(pid) {
    send({ type: C2S.KICK_PLAYER, playerId: pid });
  }
</script>

<div class="h-full relative overflow-hidden">

  <!-- Full-screen color grid background -->
  <div
    class="absolute inset-0 grid"
    style="grid-template-columns: repeat(30, 1fr); grid-template-rows: repeat(16, 1fr);"
  >
    {#each board as cell}
      <div style="background-color: {cell.hex};"></div>
    {/each}
  </div>

  <!-- Dark overlay for readability -->
  <div class="absolute inset-0 bg-slate-950/70 pointer-events-none"></div>

  <!-- Scrollable content -->
  <div class="relative h-full overflow-y-auto">
    <div class="min-h-full flex flex-col items-center justify-start px-5 pt-12 pb-10">
      <div class="w-full max-w-lg space-y-5">

        <!-- Room Code Header -->
        <div class="text-center space-y-2">
          <p class="text-[10px] font-bold text-white/40 uppercase tracking-[0.25em]">Game Lobby</p>
          <h1 class="text-7xl font-black font-mono tracking-[0.1em] text-white drop-shadow-2xl">
            {$roomCode}
          </h1>
          <p class="text-white/40 text-sm font-medium">Share this code with your friends</p>
        </div>

        <!-- Player List -->
        <div class="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-black text-white tracking-tight flex items-center gap-2.5">
              Players
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 text-sm font-bold">
                {connectedCount}
              </span>
            </h2>
            <div class="flex -space-x-2">
              {#each players.slice(0, 5) as player}
                <div class="w-8 h-8 rounded-full border-2 border-slate-900/50 bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white">
                  {player.name[0].toUpperCase()}
                </div>
              {/each}
              {#if players.length > 5}
                <div class="w-8 h-8 rounded-full border-2 border-slate-900/50 bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                  +{players.length - 5}
                </div>
              {/if}
            </div>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each players as player (player.id)}
              <div class="group flex items-center justify-between px-4 py-3 rounded-2xl transition-all
                {player.connected ? 'bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08]' : 'opacity-35 border border-transparent'}">
                <div class="flex items-center gap-3">
                  <div class="relative flex-shrink-0">
                    <div class="w-10 h-10 rounded-xl
                      {player.id === $playerId ? 'bg-indigo-500/40 border border-indigo-400/40' : 'bg-white/10 border border-white/10'}
                      flex items-center justify-center font-bold text-white backdrop-blur-sm">
                      {player.name[0].toUpperCase()}
                    </div>
                    {#if player.connected}
                      <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900/70"></div>
                    {/if}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-white text-sm">{player.name}</span>
                      {#if player.id === $playerId}
                        <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 uppercase tracking-wider">you</span>
                      {/if}
                    </div>
                    {#if player.isHost}
                      <span class="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">Host</span>
                    {/if}
                  </div>
                </div>
                {#if isHost && !player.isHost && player.id !== $playerId}
                  <button
                    on:click={() => kickPlayer(player.id)}
                    class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400"
                    title="Kick"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Settings (host only) -->
        {#if isHost}
          <div class="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 p-6">
            <Settings />
          </div>
        {/if}

        <!-- Start / Waiting -->
        {#if isHost}
          <button
            on:click={startGame}
            disabled={connectedCount < 3}
            class="w-full py-4 rounded-2xl font-black text-slate-950 bg-white hover:bg-slate-100
              disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-[0.98]
              text-base uppercase tracking-widest"
          >
            {#if connectedCount < 3}
              Need {3 - connectedCount} more player{3 - connectedCount === 1 ? '' : 's'}
            {:else}
              Launch Game
            {/if}
          </button>
        {:else}
          <div class="w-full py-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm flex items-center justify-center gap-3">
            <div class="w-1.5 h-1.5 rounded-full bg-white/60 animate-ping"></div>
            <p class="text-white/50 font-semibold uppercase tracking-widest text-xs">Waiting for host…</p>
          </div>
        {/if}

        <!-- Leave -->
        <button
          on:click={() => dispatch('leave')}
          class="w-full text-sm font-semibold text-white/30 hover:text-rose-400 transition-colors uppercase tracking-widest"
        >
          Leave Room
        </button>

        {#if $error}
          <p class="text-rose-400 text-sm text-center">{$error}</p>
        {/if}

      </div>
    </div>
  </div>
</div>
