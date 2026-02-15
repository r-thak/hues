<script>
  export let players = [];
  export let cueGiverId = "";
  export let onClose = () => {};

  $: sorted = [...players].sort((a, b) => b.score - a.score);
</script>

<div
  class="fixed inset-0 z-50 flex justify-end"
  on:click|self={onClose}
  role="presentation"
>
  <div
    class="w-80 max-w-full h-full bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-slide-in"
  >
    <div class="flex items-center justify-between p-4 border-b border-gray-100">
      <h2 class="text-lg font-bold text-gray-800">Scoreboard</h2>
      <button
        on:click={onClose}
        class="text-gray-400 hover:text-gray-600 transition-colors text-xl"
      >
        ✕
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-2">
        {#each sorted as player, i (player.id)}
          <div
            class="flex items-center gap-3 py-3 px-4 rounded-xl transition-opacity"
            class:bg-amber-50={i === 0 && player.score > 0}
            class:bg-gray-50={i !== 0 || player.score === 0}
            class:opacity-50={!player.connected}
          >
            <span class="w-6 text-center font-bold text-gray-400 text-sm">
              {#if i === 0 && player.score > 0}🥇{:else if i === 1 && player.score > 0}🥈{:else if i === 2 && player.score > 0}🥉{:else}{i +
                  1}{/if}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-800 truncate"
                  >{player.name}</span
                >
                {#if player.id === cueGiverId}
                  <span
                    class="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium"
                    >Cue Giver</span
                  >
                {/if}
              </div>
            </div>
            <span class="font-bold text-gray-800 text-lg tabular-nums"
              >{player.score}</span
            >
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  .animate-slide-in {
    animation: slideIn 200ms ease-out;
  }
</style>
