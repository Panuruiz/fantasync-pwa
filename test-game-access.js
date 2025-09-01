// Test script to verify game access fix
// Run this in the browser console after logging in

async function testGameAccess() {
  const userId = '687c2320-c841-4165-aba4-962475ddff09';
  const gameId = '5efa722d-34c6-4633-be50-ff29288dfad9';
  
  console.log('Testing game access for:');
  console.log('User ID:', userId);
  console.log('Game ID:', gameId);
  
  // Check user store
  const userStore = window.__zustand_stores?.find(s => s.getState()?.id !== undefined);
  if (userStore) {
    const state = userStore.getState();
    console.log('User Store State:', {
      id: state.id,
      username: state.username,
      isAuthenticated: state.isAuthenticated
    });
  } else {
    console.log('User store not found');
  }
  
  // Navigate to the game page
  console.log('Navigate to: /games/' + gameId);
  window.location.href = '/games/' + gameId;
}

// Instructions:
// 1. Login to the app
// 2. Open browser console
// 3. Run: testGameAccess()