<script>
  import { send } from '../stores/connection.js';
  import { C2S } from '@hues/shared/protocol';
  import { generateBoard } from '@hues/shared/board';
  import { validateClue } from '@hues/shared/validation';

  export let phase = '';
  export let cardOptions = null;
  export let clueIndex = 0;
  export let wordLimit = 1;
  export let cols = 30;
  export let rows = 16;

  let clueText = '';
  let clueError = '';

  $: board = generateBoard(cols, rows);

  function pickTarget(cellIndex) {
    send({ type: C2S.PICK_TARGET, cellIndex });
  }

  function submitClue() {
    const result = validateClue(clueText, wordLimit);
    if (!result.valid) {
      clueError = result.error || 'Invalid clue';
      return;
    }
    clueError = '';
    send({ type: C2S.SUBMIT_CLUE, text: clueText.trim() });
    clueText = '';
  }

  $: {
    if (phase === 'clue') {
      clueText = '';
      clueError = '';
    }
  }
</script>

{#if phase === 'pick_target' && cardOptions}
  <div class="space-y-2">
    <p class="text-sm font-medium text-gray-600 text-center">Choose a target color:</p>
    <div class="flex gap-3 justify-center flex-wrap">
      {#each cardOptions as cellIndex}
        {@const cell = board[cellIndex]}
        <button
          class="w-16 h-16 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95 border-2 border-white/60"
          style="background-color: {cell?.hex || '#ccc'};"
          on:click={() => pickTarget(cellIndex)}
          title="Cell {cellIndex}"
        ></button>
      {/each}
    </div>
  </div>
{:else if phase === 'clue'}
  <div class="space-y-2">
    <p class="text-sm font-medium text-gray-600 text-center">
      Give a clue ({wordLimit} word{wordLimit > 1 ? 's' : ''} max):
    </p>
    <form on:submit|preventDefault={submitClue} class="flex gap-2">
      <input
        type="text"
        bind:value={clueText}
        placeholder="Enter your clue…"
        class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-800"
        autofocus
      />
      <button
        type="submit"
        disabled={!clueText.trim()}
        class="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
      >
        Submit
      </button>
    </form>
    {#if clueError}
      <p class="text-xs text-red-500 text-center">{clueError}</p>
    {/if}
  </div>
{:else if phase === 'guess'}
  <div class="text-center py-2">
    <p class="text-gray-500 text-sm">Waiting for guessers…</p>
  </div>
{:else}
  <div class="text-center py-2">
    <p class="text-gray-400 text-sm">Preparing…</p>
  </div>
{/if}
