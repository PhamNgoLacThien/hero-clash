// input.js — Keyboard & Mouse state tracking

const Keys = {};
const Mouse = { x: 0, y: 0, clicked: false };

const BLOCKED = new Set([
    'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space',
    'KeyA','KeyD','KeyW','KeyS',
    'KeyF','KeyG','KeyH','KeyT',
    'Numpad1','Numpad2','Numpad3','Numpad4'
]);

window.addEventListener('keydown', e => {
    if (!Keys[e.code]) Keys[e.code] = { held: false, just: false };
    if (!Keys[e.code].held) Keys[e.code].just = true;
    Keys[e.code].held = true;
    if (BLOCKED.has(e.code)) e.preventDefault();
});

window.addEventListener('keyup', e => {
    if (Keys[e.code]) { Keys[e.code].held = false; Keys[e.code].just = false; }
});

function isHeld(code) { return !!(Keys[code]?.held); }
function isJust(code) {
    if (Keys[code]?.just) { Keys[code].just = false; return true; }
    return false;
}

function setupMouse(canvas) {
    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * (canvas.width  / r.width),
            y: (e.clientY - r.top)  * (canvas.height / r.height),
        };
    }
    canvas.addEventListener('mousemove', e => { const p = getPos(e); Mouse.x = p.x; Mouse.y = p.y; });
    canvas.addEventListener('click',     e => { const p = getPos(e); Mouse.x = p.x; Mouse.y = p.y; Mouse.clicked = true; });
}
