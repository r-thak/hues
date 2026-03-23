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

<div class="min-h-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
  <!-- Dynamic Background -->
  <div class="absolute top-0 -left-4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
  <div class="absolute bottom-0 -right-4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

  <div class="w-full max-w-md space-y-8 text-center z-10">
    <!-- Trophy & Title -->
    <div class="space-y-4">
      <div class="relative inline-block">
        <div class="absolute inset-0 bg-amber-400 blur-2xl opacity-20 animate-pulse"></div>
        <div class="text-8xl filter drop-shadow-2xl relative">🏆</div>
      </div>

      <div class="space-y-1">
        <h1 class="text-5xl font-black text-white tracking-tighter font-['Outfit'] italic italic">
          {#if iAmWinner}
            <span class="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">YOU WON!</span>
          {:else if winner}
            <span class="text-white uppercase">{winner.name}</span>
            <span class="block text-2xl text-slate-400 not-italic font-medium tracking-wide">Take the Crown!</span>
          {:else}
            GAME OVER
          {/if}
        </h1>
      </div>
    </div>

    <!-- Final Scores -->
    <div class="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 p-8">
      <h2 class="text-xl font-black text-white mb-6 tracking-tight font-['Outfit'] flex items-center justify-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Final Standings
      </h2>
      <div class="space-y-3">
        {#each sorted as player, i (player.id)}
          {@const score = finalScores[player.id] || 0}
          <div
            class="flex items-center justify-between py-4 px-5 rounded-2xl transition-all {i === 0 ? 'bg-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.05] border border-white/20' : 'bg-white/5 border border-white/5'}"
          >
            <div class="flex items-center gap-4">
              <span class="text-2xl w-8 text-center">
                {#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}<span class="text-slate-500 text-sm font-black italic">{i + 1}</span>{/if}
              </span>
              <div class="flex flex-col items-start">
                <span class="font-bold {i === 0 ? 'text-white' : 'text-slate-200'} tracking-tight">{player.name}</span>
                {#if player.id === $playerId}
                  <span class="text-[9px] font-black {i === 0 ? 'text-indigo-200' : 'text-indigo-400'} uppercase tracking-widest">YOU</span>
                {/if}
              </div>
            </div>
            <span class="font-black text-2xl tabular-nums {i === 0 ? 'text-white' : 'text-slate-400'} font-['Outfit']">{score}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-4">
      {#if isHost}
        <button
          on:click={playAgain}
          class="w-full py-5 px-8 rounded-[2rem] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all shadow-2xl shadow-emerald-500/20 active:scale-[0.98] text-xl uppercase tracking-widest font-['Outfit']"
        >
          Rematch!
        </button>
      {:else}
        <div class="w-full py-5 px-8 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-center gap-4">
          <div class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Waiting for host to restart...</p>
        </div>
      {/if}
      
      <button
        on:click={() => dispatch('leave')}
        class="text-sm font-bold text-slate-500 hover:text-rose-400 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
        </svg>
        Return to Menu
      </button>
    </div>
  </div>
</div>
