<script>
  import { connect, error } from '../stores/connection.js';

  let playerName = '';
  let joinRoomCode = '';
  let joinPlayerName = '';

  function handleCreate() {
    if (!playerName.trim()) return;
    connect('create', { playerName: playerName.trim() });
  }

  function handleJoin() {
    if (!joinRoomCode.trim() || !joinPlayerName.trim()) return;
    connect('join', {
      roomCode: joinRoomCode.trim().toUpperCase(),
      playerName: joinPlayerName.trim(),
    });
  }

  function handleCodeInput(e) {
    joinRoomCode = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  }
</script>

<div class="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
  <div class="w-full max-w-md space-y-6">
    <!-- Logo / Title -->
    <div class="text-center">
      <h1 class="text-5xl font-extrabold tracking-tight">
        <span class="bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 to-violet-500 bg-clip-text text-transparent">
          Hues & Cues
        </span>
      </h1>
      <p class="mt-2 text-gray-500 text-sm">The color guessing party game</p>
    </div>

    <!-- Create Room Card -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Create a Room</h2>
      <form on:submit|preventDefault={handleCreate} class="space-y-3">
        <input
          type="text"
          bind:value={playerName}
          placeholder="Your name"
          maxlength="20"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={!playerName.trim()}
          class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          Create Room
        </button>
      </form>
    </div>

    <!-- Join Room Card -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Join a Room</h2>
      <form on:submit|preventDefault={handleJoin} class="space-y-3">
        <input
          type="text"
          value={joinRoomCode}
          on:input={handleCodeInput}
          placeholder="Room code"
          maxlength="4"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder-gray-400 font-mono text-center text-2xl tracking-[0.3em] uppercase"
        />
        <input
          type="text"
          bind:value={joinPlayerName}
          placeholder="Your name"
          maxlength="20"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={!joinRoomCode.trim() || !joinPlayerName.trim() || joinRoomCode.length < 4}
          class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          Join Room
        </button>
      </form>
    </div>

    <!-- Error display -->
    {#if $error}
      <div class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm text-center">
        {$error}
      </div>
    {/if}
  </div>
</div>
