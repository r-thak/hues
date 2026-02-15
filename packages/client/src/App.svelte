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

<main class="h-full">
  {#if !$roomCode || !$playerId}
    <Landing />
  {:else if $gameState.phase === 'lobby'}
    <Lobby on:leave={handleLeave} />
  {:else if $gameState.phase === 'game_over'}
    <GameOver on:leave={handleLeave} />
  {:else if $gameState.phase}
    <Game />
  {:else}
    <div class="flex items-center justify-center h-full">
      <div class="text-gray-400 text-lg">Connecting…</div>
    </div>
  {/if}
</main>
