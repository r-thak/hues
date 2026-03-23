<script>
  import { send } from '../stores/connection.js';
  import { gameState } from '../stores/gameState.js';
  import { C2S } from '@hues/shared/protocol';

  $: settings = $gameState.settings;
  $: isHost = $gameState.iAmHost;

  let localSettings = null;

  $: if (settings && !localSettings) {
    localSettings = JSON.parse(JSON.stringify(settings));
  }

  $: if (settings) {
    localSettings = JSON.parse(JSON.stringify(settings));
  }

  function sendUpdate() {
    if (!isHost || !localSettings) return;
    send({
      type: C2S.UPDATE_SETTINGS,
      settings: {
        cardsPerRound: localSettings.cardsPerRound,
        clueWordLimits: localSettings.clueWordLimits,
        scoringRadii: localSettings.scoringRadii,
        phaseTimerSeconds: localSettings.phaseTimerSeconds,
      },
    });
  }

  function updateCardsPerRound(e) {
    localSettings.cardsPerRound = Math.max(2, Math.min(6, parseInt(e.target.value) || 2));
    sendUpdate();
  }

  function updateTimer(e) {
    let v = parseInt(e.target.value) || 0;
    if (v !== 0 && v < 10) v = 10;
    localSettings.phaseTimerSeconds = v;
    sendUpdate();
  }

  function updateWordLimit(index, e) {
    localSettings.clueWordLimits[index] = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
    sendUpdate();
  }

  function addCluePhase() {
    if (localSettings.clueWordLimits.length < 4) {
      localSettings.clueWordLimits = [...localSettings.clueWordLimits, 1];
      sendUpdate();
    }
  }

  function removeCluePhase(index) {
    if (localSettings.clueWordLimits.length > 1) {
      localSettings.clueWordLimits = localSettings.clueWordLimits.filter((_, i) => i !== index);
      sendUpdate();
    }
  }
</script>

{#if localSettings}
  <div class="space-y-5">
    <h2 class="text-base font-black text-white tracking-tight">Settings</h2>

    <!-- Cards per Round -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-white/60">Cards per round</label>
      <input
        type="number"
        min="2"
        max="6"
        value={localSettings.cardsPerRound}
        on:change={updateCardsPerRound}
        disabled={!isHost}
        class="w-20 px-3 py-2 rounded-lg bg-white/[0.08] border border-white/10 text-center text-white text-sm
          disabled:opacity-40 disabled:cursor-not-allowed focus:border-white/30 focus:ring-1 focus:ring-white/10 outline-none"
      />
    </div>

    <!-- Clue Word Limits -->
    <div>
      <label class="block text-sm font-medium text-white/60 mb-2">Clue word limits (per phase)</label>
      <div class="space-y-2">
        {#each localSettings.clueWordLimits as limit, i}
          <div class="flex items-center gap-2">
            <span class="text-xs text-white/30 w-14">Clue {i + 1}</span>
            <input
              type="number"
              min="1"
              max="5"
              value={limit}
              on:change={(e) => updateWordLimit(i, e)}
              disabled={!isHost}
              class="w-16 px-2 py-1.5 rounded-lg bg-white/[0.08] border border-white/10 text-center text-sm text-white
                disabled:opacity-40 disabled:cursor-not-allowed focus:border-white/30 focus:ring-1 focus:ring-white/10 outline-none"
            />
            <span class="text-xs text-white/30">word{limit > 1 ? 's' : ''} max</span>
            {#if isHost && localSettings.clueWordLimits.length > 1}
              <button
                on:click={() => removeCluePhase(i)}
                class="ml-auto text-white/25 hover:text-rose-400 transition-colors text-sm"
              >✕</button>
            {/if}
          </div>
        {/each}
        {#if isHost && localSettings.clueWordLimits.length < 4}
          <button
            on:click={addCluePhase}
            class="text-xs text-white/35 hover:text-white/70 transition-colors"
          >+ Add clue phase</button>
        {/if}
      </div>
    </div>

    <!-- Phase Timer -->
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-white/60">
        Phase timer
        {#if localSettings.phaseTimerSeconds === 0}<span class="text-white/30 font-normal ml-1">(off)</span>{/if}
      </label>
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="300"
          value={localSettings.phaseTimerSeconds}
          on:change={updateTimer}
          disabled={!isHost}
          class="w-20 px-3 py-2 rounded-lg bg-white/[0.08] border border-white/10 text-center text-white text-sm
            disabled:opacity-40 disabled:cursor-not-allowed focus:border-white/30 focus:ring-1 focus:ring-white/10 outline-none"
        />
        <span class="text-xs text-white/30">sec</span>
      </div>
    </div>
  </div>
{/if}
