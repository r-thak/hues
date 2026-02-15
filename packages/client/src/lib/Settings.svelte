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
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Game Settings</h2>
    <div class="space-y-5">
      <!-- Cards per Round -->
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Cards per round</label>
        <input
          type="number"
          min="2"
          max="6"
          value={localSettings.cardsPerRound}
          on:change={updateCardsPerRound}
          disabled={!isHost}
          class="w-24 px-3 py-2 rounded-lg border border-gray-200 text-center text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
        />
      </div>

      <!-- Clue Word Limits -->
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-2">Clue word limits (per phase)</label>
        <div class="space-y-2">
          {#each localSettings.clueWordLimits as limit, i}
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-16">Clue {i + 1}:</span>
              <input
                type="number"
                min="1"
                max="5"
                value={limit}
                on:change={(e) => updateWordLimit(i, e)}
                disabled={!isHost}
                class="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-center text-sm text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <span class="text-xs text-gray-400">word{limit > 1 ? 's' : ''} max</span>
              {#if isHost && localSettings.clueWordLimits.length > 1}
                <button
                  on:click={() => removeCluePhase(i)}
                  class="text-xs text-red-400 hover:text-red-600 ml-auto"
                >
                  ✕
                </button>
              {/if}
            </div>
          {/each}
          {#if isHost && localSettings.clueWordLimits.length < 4}
            <button
              on:click={addCluePhase}
              class="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              + Add clue phase
            </button>
          {/if}
        </div>
      </div>

      <!-- Phase Timer -->
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">Phase timer (seconds)</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="300"
            value={localSettings.phaseTimerSeconds}
            on:change={updateTimer}
            disabled={!isHost}
            class="w-24 px-3 py-2 rounded-lg border border-gray-200 text-center text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <span class="text-xs text-gray-400">{localSettings.phaseTimerSeconds === 0 ? 'Disabled' : ''}</span>
        </div>
      </div>
    </div>
  </div>
{/if}
