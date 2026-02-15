<script>
  import { onMount, onDestroy } from "svelte";

  export let phaseDeadline = null;

  let remaining = 0;
  let interval;

  $: if (phaseDeadline) {
    startTimer();
  } else {
    stopTimer();
    remaining = 0;
  }

  function startTimer() {
    stopTimer();
    tick();
    interval = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function tick() {
    if (!phaseDeadline) {
      remaining = 0;
      return;
    }
    remaining = Math.max(0, Math.ceil((phaseDeadline - Date.now()) / 1000));
  }

  onDestroy(stopTimer);

  $: minutes = Math.floor(remaining / 60);
  $: seconds = remaining % 60;
  $: display =
    remaining > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : "Time's up";
  $: urgent = remaining > 0 && remaining <= 10;
</script>

{#if phaseDeadline}
  <div
    class="text-center font-mono text-lg font-semibold transition-colors"
    class:text-red-500={urgent}
    class:text-gray-600={!urgent}
    class:animate-pulse={urgent}
  >
    ⏱ {display}
  </div>
{/if}
