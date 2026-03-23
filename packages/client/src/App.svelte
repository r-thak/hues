<script>
  import { onMount } from 'svelte';
  import { playerId, roomCode, connected, error, tryRejoin, disconnect } from './stores/connection.js';
  import { gameState, resetGameState } from './stores/gameState.js';
  import Landing from './lib/Landing.svelte';
  import Lobby from './lib/Lobby.svelte';
  import Game from './lib/Game.svelte';
  import GameOver from './lib/GameOver.svelte';

  onMount(() => {
    tryRejoin();
  });

  function handleLeave() {
    disconnect();
    resetGameState();
  }
</script>

<main class="h-full bg-slate-950">
  {#if !$roomCode || !$playerId}
    <Landing />
  {:else if $gameState.phase === 'lobby'}
    <Lobby on:leave={handleLeave} />
  {:else if $gameState.phase === 'game_over'}
    <GameOver on:leave={handleLeave} />
  {:else if $gameState.phase}
    <Game />
  {:else}
    <div class="flex flex-col items-center justify-center h-full gap-6 bg-slate-950">
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 rounded-full border-4 border-white/5"></div>
        <div class="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
      <div class="flex flex-col items-center gap-1">
        <div class="text-white font-black tracking-widest text-sm uppercase font-['Outfit'] animate-pulse">Establishing Link</div>
        <div class="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Please wait a moment</div>
      </div>
    </div>
  {/if}
</main>
