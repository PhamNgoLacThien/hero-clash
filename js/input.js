/* ============================================================
   input.js — Keyboard State Handler
   Tracks which keys are currently held down.
   ============================================================ */

const Keys = {};

// Keys to prevent default browser behavior (scroll, etc.)
const BLOCKED_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'Space', 'KeyJ', 'KeyK', 'KeyL', 'KeyU',
    'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'
]);

window.addEventListener('keydown', (e) => {
    Keys[e.code] = true;
    if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
});

window.addEventListener('keyup', (e) => {
    Keys[e.code] = false;
});

// Helper: check if a key is pressed
function isPressed(code) {
    return Keys[code] === true;
}
