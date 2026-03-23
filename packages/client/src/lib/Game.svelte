<script>
  import { gameState } from "../stores/gameState.js";
  import { playerId } from "../stores/connection.js";
  import Board from "./Board.svelte";
  import Timer from "./Timer.svelte";
  import CueGiverPanel from "./CueGiverPanel.svelte";
  import GuesserPanel from "./GuesserPanel.svelte";
  import Scoreboard from "./Scoreboard.svelte";
  import Reveal from "./Reveal.svelte";

  let selectedCell = null;
  let showScoreboard = false;

  $: state = $gameState;
  $: phase = state.phase;
  $: iAmCueGiver = state.iAmCueGiver;
  $: cueGiver = state.players.find((p) => p.id === state.cueGiverId);
  $: cueGiverName = cueGiver ? cueGiver.name : "Cue Giver";
  $: cols = state.settings?.cols || 30;
  $: rows = state.settings?.rows || 16;
  $: selectable = phase === "guess" && !iAmCueGiver && !alreadyGuessedThisPhase;

  $: alreadyGuessedThisPhase = (() => {
    if (phase !== "guess") return false;
    const guessCount = state.myGuesses.length;
    const expectedIndex = state.currentClueIndex ?? 0;
    return guessCount > expectedIndex;
  })();

  function handleCellSelect(e) {
    selectedCell = e.detail.cellIndex;
  }

  $: if (phase) {
    selectedCell = null;
  }

  $: displayClues = state.clues || [];
  $: latestClue =
    displayClues.length > 0 ? displayClues[displayClues.length - 1] : null;
</script>

<div class="h-full flex flex-col bg-slate-900 overflow-hidden relative">
  <!-- Dynamic Background Effects -->
  <div class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>

  <!-- Top Bar -->
  <div class="flex-none px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 shadow-2xl z-20">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex flex-col">
          <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1 font-['Outfit']">
            Round {state.currentRoundNum}
          </span>
          <h2 class="text-xl font-black text-white tracking-tight font-['Outfit'] italic">
            HUES<span class="text-indigo-500">&</span>CUES
          </h2>
        </div>
        
        <div class="h-8 w-px bg-white/10 mx-2"></div>

        {#if iAmCueGiver}
          <div class="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span class="text-xs font-bold text-indigo-300 uppercase tracking-wide">You're the Cue Giver</span>
          </div>
        {:else}
           <div class="px-3 py-1 rounded-full bg-slate-800 border border-white/5 flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">Guessing Mode</span>
          </div>
        {/if}
      </div>

      <div class="flex items-center gap-4">
        <Timer phaseDeadline={state.phaseDeadline} />
        <button
          on:click={() => (showScoreboard = true)}
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 group"
        >
          <span class="text-sm font-bold text-slate-300 group-hover:text-white uppercase tracking-widest">Scoreboard</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500 group-hover:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Clue display -->
    {#if displayClues.length > 0}
      <div class="mt-4 flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        {#each displayClues as clue, i}
          <div class="flex-none inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-100 shadow-inner">
            <div class="w-5 h-5 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-300">
              {i + 1}
            </div>
            <span class="text-lg font-black tracking-tight italic font-['Outfit'] italic">"{clue}"</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Board Area -->
  <div class="flex-1 min-h-0 relative z-10 bg-slate-950/20">
    <Board
      {cols}
      {rows}
      {selectable}
      {selectedCell}
      myGuesses={state.myGuesses}
      revealData={state.revealData}
      scoringRadii={state.settings?.scoringRadii}
      players={state.players}
      on:select={handleCellSelect}
    />

    <!-- Reveal overlay -->
    {#if phase === "reveal" && state.revealData}
      <div
        class="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none z-30"
      >
        <div class="pointer-events-auto transform animate-reveal-up">
          <Reveal
            revealData={state.revealData}
            players={state.players}
            cueGiverId={state.cueGiverId}
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Action Bar -->
  <div class="flex-none px-6 py-5 bg-slate-900 border-t border-white/5 shadow-2xl z-20">
    {#if iAmCueGiver}
      <CueGiverPanel
        {phase}
        cardOptions={state.cardOptions}
        clueIndex={state.currentClueIndex}
        wordLimit={state.wordLimit || 1}
        {cols}
        {rows}
      />
    {:else}
      <GuesserPanel
        {phase}
        {selectedCell}
        {cueGiverName}
        {cols}
        {rows}
        alreadyGuessed={alreadyGuessedThisPhase}
      />
    {/if}
  </div>
</div>

<!-- Scoreboard -->
{#if showScoreboard}
  <Scoreboard
    players={state.players}
    cueGiverId={state.cueGiverId}
    onClose={() => (showScoreboard = false)}
  />
{/if}

<style>
  @keyframes reveal-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-reveal-up {
    animation: reveal-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
