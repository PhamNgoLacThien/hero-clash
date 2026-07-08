/* ============================================================
   main.js — Game Loop & Initialization
   Entry point: sets up canvas, creates characters, runs loop.
   ============================================================ */

// ── Canvas Setup ────────────────────────────────────────────
const CANVAS_W  = 1200;
const CANVAS_H  = 600;
const GROUND_Y  = 508;    // Y position of ground surface

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

// Scale canvas to fit the browser window while keeping aspect ratio
function resizeCanvas() {
    const padding  = 40;
    const hintArea = 60;
    const maxW     = window.innerWidth  - padding;
    const maxH     = window.innerHeight - hintArea - padding;
    const scale    = Math.min(maxW / CANVAS_W, maxH / CANVAS_H, 1);
    canvas.style.width  = (CANVAS_W * scale) + 'px';
    canvas.style.height = (CANVAS_H * scale) + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Create Characters ─────────────────────────────────────
const warrior = new Character(
    160,                        // Start X
    GROUND_Y - 82,             // Start Y (feet on ground)
    'warrior',
    {
        left:  'KeyA',
        right: 'KeyD',
        jump:  'KeyW',
    }
);

const assassin = new Character(
    1200 - 160 - 44,           // Start X (right side, 44 = assassin width)
    GROUND_Y - 90,             // Start Y (feet on ground)
    'assassin',
    {
        left:  'ArrowLeft',
        right: 'ArrowRight',
        jump:  'ArrowUp',
    }
);

const characters = [warrior, assassin];

// ── Init Stars ────────────────────────────────────────────
initStars(CANVAS_W, CANVAS_H);

// ── Game Loop ─────────────────────────────────────────────
function gameLoop() {
    // Update all characters (pass opponent for auto-facing)
    warrior.update(GROUND_Y, CANVAS_W, assassin);
    assassin.update(GROUND_Y, CANVAS_W, warrior);

    // Render everything
    render(ctx, CANVAS_W, CANVAS_H, GROUND_Y, characters);

    requestAnimationFrame(gameLoop);
}

// Start!
gameLoop();
