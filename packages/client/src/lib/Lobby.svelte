<script>
  import { createEventDispatcher } from 'svelte';
  import { roomCode, playerId, error } from '../stores/connection.js';
  import { gameState } from '../stores/gameState.js';
  import { send } from '../stores/connection.js';
  import { C2S } from '@hues/shared/protocol';
  import Settings from './Settings.svelte';

  const dispatch = createEventDispatcher();

  $: players = $gameState.players;
  $: isHost = $gameState.iAmHost;
  $: connectedCount = players.filter((p) => p.connected).length;

  function startGame() {
    send({ type: C2S.START_GAME });
  }

  function kickPlayer(pid) {
    send({ type: C2S.KICK_PLAYER, playerId: pid });
  }
</script>

<div class="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
  <div class="w-full max-w-lg space-y-6">
    <!-- Room Code Header -->
    <div class="text-center">
      <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Room Code</p>
      <p class="text-5xl font-extrabold font-mono tracking-[0.25em] text-gray-800 mt-1">
        {$roomCode}
      </p>
      <p class="text-xs text-gray-400 mt-2">Share this code with your friends</p>
    </div>

    <!-- Player List -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">
        Players <span class="text-gray-400 text-sm font-normal">({connectedCount})</span>
      </h2>
      <ul class="space-y-2">
        {#each players as player (player.id)}
          <li class="flex items-center justify-between py-2 px-3 rounded-xl {player.connected ? 'bg-gray-50' : 'bg-gray-50 opacity-50'}">
            <div class="flex items-center gap-3">
              <!-- Connection indicator -->
              <span class="w-2.5 h-2.5 rounded-full {player.connected ? 'bg-emerald-400' : 'bg-gray-300'}"></span>
              <span class="font-medium text-gray-800">{player.name}</span>
              {#if player.isHost}
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Host</span>
              {/if}
              {#if player.id === $playerId}
                <span class="text-xs text-gray-400">(you)</span>
              {/if}
            </div>
            {#if isHost && !player.isHost && player.id !== $playerId}
              <button
                on:click={() => kickPlayer(player.id)}
                class="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1"
              >
                Kick
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    </div>

    <!-- Settings (host only) -->
    {#if isHost}
      <Settings />
    {/if}

    <!-- Start / Waiting -->
    <div class="text-center space-y-3">
      {#if isHost}
        <button
          on:click={startGame}
          disabled={connectedCount < 3}
          class="w-full py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-lg"
        >
          {#if connectedCount < 3}
            Need {3 - connectedCount} more player{3 - connectedCount === 1 ? '' : 's'}
          {:else}
            Start Game
          {/if}
        </button>
      {:else}
        <p class="text-gray-500 py-3">Waiting for host to start the game…</p>
      {/if}

      <button
        on:click={() => dispatch('leave')}
        class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Leave Room
      </button>
    </div>

    {#if $error}
      <div class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm text-center">
        {$error}
      </div>
    {/if}
  </div>
</div>
