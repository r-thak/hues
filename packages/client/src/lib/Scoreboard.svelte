<script>
  export let players = [];
  export let cueGiverId = "";
  export let onClose = () => {};

  $: sorted = [...(players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
</script>

<div
  class="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-sm"
  on:click|self={onClose}
  role="presentation"
>
  <div
    class="w-80 max-w-full h-full bg-slate-900 shadow-2xl border-l border-white/5 flex flex-col animate-slide-in relative"
  >
    <!-- Background Gradient Accent -->
    <div class="absolute top-0 right-0 w-32 h-64 bg-indigo-500/10 blur-3xl pointer-events-none"></div>

    <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
      <h2 class="text-xl font-black text-white tracking-tight font-['Outfit'] italic">SCOREBOARD</h2>
      <button
        on:click={onClose}
        class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
      <div class="space-y-3">
        {#each sorted as player, i (player.id)}
          <div
            class="group flex items-center gap-4 py-4 px-5 rounded-2xl transition-all border {i === 0 && player.score > 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/5 border-transparent hover:bg-white/10'}"
            class:opacity-40={!player.connected}
          >
            <div class="w-8 flex items-center justify-center">
               {#if i === 0 && player.score > 0}
                 <span class="text-2xl filter drop-shadow-md">🥇</span>
               {:else if i === 1 && player.score > 0}
                 <span class="text-xl filter drop-shadow-md">🥈</span>
               {:else if i === 2 && player.score > 0}
                 <span class="text-lg filter drop-shadow-md">🥉</span>
               {:else}
                 <span class="text-slate-500 font-black italic text-sm">{i + 1}</span>
               {/if}
            </div>

            <div class="flex-1 min-w-0">
               <div class="flex flex-col">
                 <div class="flex items-center gap-2">
                   <span class="font-bold {i === 0 && player.score > 0 ? 'text-indigo-100' : 'text-slate-200'} truncate tracking-tight">{player.name}</span>
                   {#if !player.connected}
                     <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">OFFLINE</span>
                   {/if}
                 </div>
                 {#if player.id === cueGiverId}
                   <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mt-0.5">CUE GIVER</span>
                 {/if}
               </div>
            </div>

            <span class="font-black {i === 0 && player.score > 0 ? 'text-indigo-300' : 'text-slate-400'} text-2xl tabular-nums font-['Outfit']">
              {player.score}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-in {
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
