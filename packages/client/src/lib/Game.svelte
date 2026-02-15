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

<div class="h-full flex flex-col bg-gray-50">
  <!-- Top Bar -->
  <div class="flex-none px-4 py-2 bg-white border-b border-gray-100 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-gray-800">
          Round {state.currentRoundNum}
        </span>
        {#if iAmCueGiver}
          <span
            class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium"
          >
            You're the Cue Giver
          </span>
        {/if}
      </div>
      <button
        on:click={() => (showScoreboard = true)}
        class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        Scores ▸
      </button>
    </div>

    <!-- Clue display -->
    {#if displayClues.length > 0}
      <div class="mt-1 flex items-center gap-2 flex-wrap">
        {#each displayClues as clue, i}
          <span
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium"
          >
            <span class="text-xs text-amber-500">#{i + 1}</span>
            "{clue}"
          </span>
        {/each}
      </div>
    {/if}

    <Timer phaseDeadline={state.phaseDeadline} />
  </div>

  <!-- Board Area -->
  <div class="flex-1 min-h-0 relative">
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
        class="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none"
      >
        <div class="pointer-events-auto">
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
  <div class="flex-none px-4 py-3 bg-white border-t border-gray-100 shadow-sm">
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
