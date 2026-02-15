<script>
  import { send } from '../stores/connection.js';
  import { C2S } from '@hues/shared/protocol';
  import { generateBoard } from '@hues/shared/board';

  export let phase = '';
  export let selectedCell = null;
  export let cueGiverName = '';
  export let cols = 30;
  export let rows = 16;
  export let alreadyGuessed = false;

  $: board = generateBoard(cols, rows);
  $: cell = selectedCell != null ? board[selectedCell] : null;
  $: cellRow = selectedCell != null ? Math.floor(selectedCell / cols) : null;
  $: cellCol = selectedCell != null ? selectedCell % cols : null;

  function confirmGuess() {
    if (selectedCell == null) return;
    send({ type: C2S.SUBMIT_GUESS, cellIndex: selectedCell });
  }
</script>

{#if phase === 'pick_target' || phase === 'clue'}
  <div class="text-center py-2">
    <p class="text-gray-500 text-sm">Waiting for {cueGiverName}…</p>
  </div>
{:else if phase === 'guess'}
  {#if alreadyGuessed}
    <div class="text-center py-2">
      <p class="text-emerald-600 text-sm font-medium">✓ Guess submitted! Waiting for others…</p>
    </div>
  {:else if selectedCell != null}
    <div class="flex items-center gap-3 justify-center">
      <div
        class="w-10 h-10 rounded-lg shadow-md border-2 border-white"
        style="background-color: {cell?.hex || '#ccc'};"
      ></div>
      <div class="text-sm text-gray-600">
        Row {cellRow + 1}, Col {cellCol + 1}
      </div>
      <button
        on:click={confirmGuess}
        class="px-5 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md active:scale-95"
      >
        Confirm Guess
      </button>
    </div>
  {:else}
    <div class="text-center py-2">
      <p class="text-gray-500 text-sm">Tap the board to place your guess</p>
    </div>
  {/if}
{/if}
