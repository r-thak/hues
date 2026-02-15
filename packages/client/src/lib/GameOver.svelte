<script>
  import { createEventDispatcher } from 'svelte';
  import { gameState } from '../stores/gameState.js';
  import { playerId } from '../stores/connection.js';
  import { send } from '../stores/connection.js';
  import { C2S } from '@hues/shared/protocol';

  const dispatch = createEventDispatcher();

  $: state = $gameState;
  $: gameOverData = state.gameOverData;
  $: finalScores = gameOverData?.finalScores || {};
  $: winnerId = gameOverData?.winner;
  $: winner = state.players.find((p) => p.id === winnerId);

  $: sorted = [...state.players].sort(
    (a, b) => (finalScores[b.id] || 0) - (finalScores[a.id] || 0)
  );

  $: isHost = state.iAmHost;
  $: iAmWinner = winnerId === $playerId;

  function playAgain() {
    send({ type: C2S.START_GAME });
  }
</script>

<div class="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
  <div class="w-full max-w-md space-y-6 text-center">
    <!-- Trophy -->
    <div class="text-6xl">🏆</div>

    <h1 class="text-3xl font-extrabold text-gray-800">
      {#if iAmWinner}
        You Won!
      {:else if winner}
        {winner.name} Wins!
      {:else}
        Game Over
      {/if}
    </h1>

    <!-- Final Scores -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Final Scores</h2>
      <div class="space-y-2">
        {#each sorted as player, i (player.id)}
          {@const score = finalScores[player.id] || 0}
          <div
            class="flex items-center justify-between py-3 px-4 rounded-xl {i === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">
                {#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}<span class="text-gray-400 text-sm font-medium w-6 text-center">{i + 1}</span>{/if}
              </span>
              <span class="font-medium text-gray-800">{player.name}</span>
              {#if player.id === $playerId}
                <span class="text-xs text-gray-400">(you)</span>
              {/if}
            </div>
            <span class="font-bold text-xl tabular-nums text-gray-800">{score}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-3">
      {#if isHost}
        <button
          on:click={playAgain}
          class="w-full py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-lg"
        >
          Play Again
        </button>
      {:else}
        <p class="text-gray-500 text-sm">Waiting for host to restart…</p>
      {/if}
      <button
        on:click={() => dispatch('leave')}
        class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Leave Room
      </button>
    </div>
  </div>
</div>
