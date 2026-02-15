<script>
  export let revealData = null;
  export let players = [];
  export let cueGiverId = '';

  $: roundScores = revealData?.roundScores || {};
  $: totalScores = revealData?.totalScores || {};

  function getPlayerName(pid) {
    const p = players.find((pl) => pl.id === pid);
    return p ? p.name : pid.slice(0, 6);
  }

  $: sortedPlayers = [...players].sort(
    (a, b) => (roundScores[b.id] || 0) - (roundScores[a.id] || 0)
  );
</script>

{#if revealData}
  <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 max-w-sm mx-auto">
    <h3 class="text-center font-bold text-gray-800 mb-3">Round Scores</h3>
    <div class="space-y-1.5">
      {#each sortedPlayers as player (player.id)}
        {@const rs = roundScores[player.id] || 0}
        {@const ts = totalScores[player.id] || 0}
        <div class="flex items-center justify-between py-1.5 px-3 rounded-lg {player.id === cueGiverId ? 'bg-blue-50' : 'bg-gray-50'}">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700 truncate">{player.name}</span>
            {#if player.id === cueGiverId}
              <span class="text-xs text-blue-500">🎙</span>
            {/if}
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold {rs > 0 ? 'text-emerald-600' : 'text-gray-400'}">
              +{rs}
            </span>
            <span class="text-xs text-gray-400 tabular-nums w-8 text-right">{ts}</span>
          </div>
        </div>
      {/each}
    </div>
    <p class="text-center text-xs text-gray-400 mt-3">Next round starting…</p>
  </div>
{/if}
