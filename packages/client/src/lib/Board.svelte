<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { generateBoard } from "@hues/shared/board";

  export let cols = 30;
  export let rows = 16;
  export let selectable = false;
  export let selectedCell = null;
  export let myGuesses = [];
  export let revealData = null;
  export let scoringRadii = null;
  export let players = [];

  const dispatch = createEventDispatcher();

  let board = [];
  let containerEl;
  let gridWidth = 0;
  let gridHeight = 0;

  let zoomed = false;
  let zoomCenterCol = 0;
  let zoomCenterRow = 0;
  let isDesktop = false;

  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOffsetCol = 0;
  let panOffsetRow = 0;

  const ZOOM_COLS = 8;
  const ZOOM_ROWS = 6;

  $: board = generateBoard(cols, rows);
  $: aspectRatio = cols / rows;

  // Player marker colors
  const MARKER_COLORS = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
  ];

  /**
   * Returns the color associated with a player index.
   * @param {number} playerIndex
   * @returns {string} Hex color string
   */
  function getPlayerColor(playerIndex) {
    return MARKER_COLORS[playerIndex % MARKER_COLORS.length];
  }

  onMount(() => {
    const mq = window.matchMedia("(pointer: fine)");
    isDesktop = mq.matches;
    const listener = (e) => {
      isDesktop = e.matches;
    };
    mq.addEventListener("change", listener);

    updateDimensions();
    const ro = new ResizeObserver(() => updateDimensions());
    if (containerEl) ro.observe(containerEl);

    return () => {
      mq.removeEventListener("change", listener);
      ro.disconnect();
    };
  });

  function updateDimensions() {
    if (!containerEl) return;
    const cw = containerEl.clientWidth;
    const ch = containerEl.clientHeight;

    if (cw / ch > aspectRatio) {
      gridHeight = ch;
      gridWidth = ch * aspectRatio;
    } else {
      gridWidth = cw;
      gridHeight = cw / aspectRatio;
    }
  }

  /**
   * Handles user interaction with a cell.
   * On mobile/touch devices, this handles "zoom to tap" behavior.
   * @param {number} index - The cell index
   */
  function handleCellClick(index) {
    if (!selectable) return;

    const row = Math.floor(index / cols);
    const col = index % cols;

    if (!zoomed && !isDesktop) {
      // Enter zoom mode centered on this cell
      zoomCenterCol = col;
      zoomCenterRow = row;
      panOffsetCol = 0;
      panOffsetRow = 0;
      zoomed = true;
      return;
    }

    selectedCell = index;
    dispatch("select", { cellIndex: index });
  }

  function exitZoom() {
    zoomed = false;
  }

  $: zoomStartCol = zoomed
    ? Math.max(
        0,
        Math.min(
          cols - ZOOM_COLS,
          Math.round(zoomCenterCol + panOffsetCol - ZOOM_COLS / 2),
        ),
      )
    : 0;
  $: zoomStartRow = zoomed
    ? Math.max(
        0,
        Math.min(
          rows - ZOOM_ROWS,
          Math.round(zoomCenterRow + panOffsetRow - ZOOM_ROWS / 2),
        ),
      )
    : 0;
  $: visibleCols = zoomed ? Math.min(ZOOM_COLS, cols) : cols;
  $: visibleRows = zoomed ? Math.min(ZOOM_ROWS, rows) : rows;

  /**
   * Starts the panning interaction when zoomed in.
   * @param {PointerEvent} e
   */
  function handlePointerDown(e) {
    if (!zoomed) return;
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    e.target.setPointerCapture?.(e.pointerId);
  }

  /**
   * Updates the pan offset during a pointer move event.
   * @param {PointerEvent} e
   */
  function handlePointerMove(e) {
    if (!isPanning || !zoomed) return;
    const cellW = gridWidth / visibleCols;
    const cellH = gridHeight / visibleRows;
    const dx = (panStartX - e.clientX) / cellW;
    const dy = (panStartY - e.clientY) / cellH;

    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
      panOffsetCol += dx;
      panOffsetRow += dy;
      panStartX = e.clientX;
      panStartY = e.clientY;
    }
  }

  function handlePointerUp() {
    isPanning = false;
  }

  /**
   * Calculates scoring zone bounds for a given distance from target cell.
   * @param {number} targetIndex - The center cell index
   * @param {number} maxDist - The maximum scoring distance
   * @returns {{startRow: number, endRow: number, startCol: number, endCol: number}}
   */
  function getScoringRect(targetIndex, maxDist) {
    const tRow = Math.floor(targetIndex / cols);
    const tCol = targetIndex % cols;
    return {
      startRow: Math.max(0, tRow - maxDist),
      endRow: Math.min(rows - 1, tRow + maxDist),
      startCol: Math.max(0, tCol - maxDist),
      endCol: Math.min(cols - 1, tCol + maxDist),
    };
  }

  function isTargetCell(index) {
    return revealData && revealData.targetCell === index;
  }

  /**
   * Retrieves specific markers for a cell based on player guesses in the reveal data.
   * @param {number} index
   * @returns {Array<{color: string, name: string, pid: string}>}
   */
  function getGuessMarkers(index) {
    if (!revealData || !revealData.guesses) return [];
    const markers = [];
    let pi = 0;
    for (const [pid, gs] of Object.entries(revealData.guesses)) {
      const color = getPlayerColor(pi);
      const player = players.find((p) => p.id === pid);
      const name = player ? player.name : pid.slice(0, 4);
      for (const key of Object.keys(gs)) {
        if (gs[key] === index) {
          markers.push({ color, name, pid });
        }
      }
      pi++;
    }
    return markers;
  }

  /**
   * Checks if the current user has guessed this cell.
   * @param {number} index
   * @returns {boolean}
   */
  function isMyGuess(index) {
    return myGuesses.includes(index);
  }
</script>

<div
  class="relative w-full h-full flex items-center justify-center no-select"
  bind:this={containerEl}
>
  <div
    class="relative"
    style="width: {gridWidth}px; height: {gridHeight}px;"
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
  >
    <div
      class="grid w-full h-full"
      style="grid-template-columns: repeat({visibleCols}, 1fr); grid-template-rows: repeat({visibleRows}, 1fr); gap: 0;"
    >
      {#each { length: visibleRows * visibleCols } as _, vi}
        {@const vRow = Math.floor(vi / visibleCols)}
        {@const vCol = vi % visibleCols}
        {@const actualRow = (zoomed ? zoomStartRow : 0) + vRow}
        {@const actualCol = (zoomed ? zoomStartCol : 0) + vCol}
        {@const index = actualRow * cols + actualCol}
        {@const cell = board[index]}
        {@const isSelected = selectedCell === index}
        {@const isTarget = isTargetCell(index)}
        {@const markers = revealData ? getGuessMarkers(index) : []}
        {@const hasMyGuess = isMyGuess(index)}
        <div
          class="relative cursor-pointer transition-shadow"
          class:ring-2={isSelected}
          class:ring-white={isSelected}
          class:ring-offset-1={isSelected}
          style="background-color: {cell?.hex || '#ccc'}; {zoomed
            ? 'border: 1px solid rgba(0,0,0,0.1);'
            : ''}"
          on:click={() => handleCellClick(index)}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === "Enter" && handleCellClick(index)}
        >
          <!-- Target cell marker -->
          {#if isTarget}
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-3/4 h-3/4 border-2 border-white rounded-sm shadow-md flex items-center justify-center"
              >
                <span class="text-white text-xs font-bold drop-shadow-lg"
                  >★</span
                >
              </div>
            </div>
          {/if}

          <!-- My guess marker -->
          {#if hasMyGuess && !revealData}
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-3 h-3 rounded-full bg-white border-2 border-gray-800 shadow-md"
              ></div>
            </div>
          {/if}

          <!-- Player guess markers during reveal -->
          {#if markers.length > 0}
            <div
              class="absolute inset-0 flex items-center justify-center gap-px flex-wrap"
            >
              {#each markers as marker}
                <div
                  class="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                  style="background-color: {marker.color};"
                  title={marker.name}
                ></div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Scoring zone overlays during reveal -->
    {#if revealData && scoringRadii}
      {#each scoringRadii as { maxDist, points }}
        {@const rect = getChebyshevRect(revealData.targetCell, maxDist)}
        {@const cellW = gridWidth / visibleCols}
        {@const cellH = gridHeight / visibleRows}
        {@const offsetCol = zoomed ? zoomStartCol : 0}
        {@const offsetRow = zoomed ? zoomStartRow : 0}
        {@const left = (rect.startCol - offsetCol) * cellW}
        {@const top = (rect.startRow - offsetRow) * cellH}
        {@const width = (rect.endCol - rect.startCol + 1) * cellW}
        {@const height = (rect.endRow - rect.startRow + 1) * cellH}
        <div
          class="absolute pointer-events-none border-2 border-dashed border-white/80"
          style="left: {left}px; top: {top}px; width: {width}px; height: {height}px;"
        >
          <span
            class="absolute -top-5 left-1 text-xs font-bold text-white bg-black/50 px-1.5 py-0.5 rounded"
          >
            {points}pt
          </span>
        </div>
      {/each}
    {/if}

    {#if zoomed}
      <button
        class="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg transition-all z-10 backdrop-blur-sm"
        on:click={exitZoom}
      >
        ← Overview
      </button>
    {/if}
  </div>
</div>
