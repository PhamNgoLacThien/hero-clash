/* ============================================================
   characters.js — Character Class & Physics
   Defines each fighter's properties, movement, and physics.
   ============================================================ */

// ── Physics Constants ──────────────────────────────────────
const PHYSICS = {
    GRAVITY:       0.65,   // Downward acceleration per frame
    JUMP_FORCE:   -15.5,   // Upward velocity on jump
    MOVE_SPEED:    5.5,    // Horizontal movement speed
    FRICTION:      0.72,   // Horizontal deceleration factor
    MAX_FALL:      22,     // Terminal velocity (falling)
};

// ── Character Definitions ──────────────────────────────────
const CHARACTER_DEFS = {
    warrior: {
        name:          'Warrior',
        width:         58,
        height:        82,
        maxHp:         120,           // Warriors are tankier
        primaryColor:  '#3a7bd5',
        accentColor:   '#f0a500',
        darkColor:     '#2c5f9e',
        startFacing:   true,          // true = facing right
    },
    assassin: {
        name:          'Assassin',
        width:         44,
        height:        90,
        maxHp:         90,            // Assassins are fragile
        primaryColor:  '#c0392b',
        accentColor:   '#ff6b6b',
        darkColor:     '#7b241c',
        startFacing:   false,         // false = facing left
    }
};

// ── Character Class ────────────────────────────────────────
class Character {
    constructor(x, y, type, controls) {
        this.type     = type;
        this.controls = controls;

        const def = CHARACTER_DEFS[type];

        // Identity
        this.name          = def.name;
        this.width         = def.width;
        this.height        = def.height;
        this.hp            = def.maxHp;
        this.maxHp         = def.maxHp;
        this.primaryColor  = def.primaryColor;
        this.accentColor   = def.accentColor;
        this.darkColor     = def.darkColor;

        // Position & velocity
        this.x  = x;
        this.y  = y;
        this.vx = 0;
        this.vy = 0;

        // State flags
        this.onGround    = false;
        this.facingRight = def.startFacing;
        this.state       = 'idle';    // idle | running | jumping | falling

        // Animation counters
        this.animTimer   = 0;         // General timer (increments every frame)
        this.stepTimer   = 0;         // Run step timer
        this.idleBob     = 0;         // Vertical idle breathing offset
        this.jumpSquash  = 1;         // Scale effect on landing
    }

    // ── Update ───────────────────────────────────────────────
    update(groundY, canvasWidth, opponent) {
        const ctrl = this.controls;

        // ── Horizontal movement ──
        if (isPressed(ctrl.left)) {
            this.vx = -PHYSICS.MOVE_SPEED;
            this.facingRight = false;
        } else if (isPressed(ctrl.right)) {
            this.vx = PHYSICS.MOVE_SPEED;
            this.facingRight = true;
        } else {
            this.vx *= PHYSICS.FRICTION;
            if (Math.abs(this.vx) < 0.08) this.vx = 0;
        }

        // ── Jump ──
        if (isPressed(ctrl.jump) && this.onGround) {
            this.vy = PHYSICS.JUMP_FORCE;
            this.onGround = false;
        }

        // ── Gravity ──
        this.vy += PHYSICS.GRAVITY;
        if (this.vy > PHYSICS.MAX_FALL) this.vy = PHYSICS.MAX_FALL;

        // ── Apply movement ──
        this.x += this.vx;
        this.y += this.vy;

        // ── Ground collision ──
        if (this.y + this.height >= groundY) {
            this.y       = groundY - this.height;
            this.vy      = 0;
            this.onGround = true;
            this.jumpSquash = 0.85;  // Landing squash
        } else {
            this.onGround = false;
        }

        // ── Boundary collision ──
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.width > canvasWidth) {
            this.x  = canvasWidth - this.width;
            this.vx = 0;
        }

        // ── Auto-face toward opponent (only when idle) ──
        if (opponent && this.state === 'idle') {
            this.facingRight = this.x < opponent.x;
        }

        // ── State update ──
        if (!this.onGround) {
            this.state = this.vy < 0 ? 'jumping' : 'falling';
        } else if (Math.abs(this.vx) > 0.3) {
            this.state = 'running';
        } else {
            this.state = 'idle';
        }

        // ── Animation ──
        this.animTimer++;
        if (this.state === 'running') this.stepTimer++;

        // Idle breathing bob (gentle up/down)
        this.idleBob = this.state === 'idle'
            ? Math.sin(this.animTimer * 0.04) * 2.5
            : 0;

        // Landing squash recovery
        this.jumpSquash += (1 - this.jumpSquash) * 0.2;
    }

    // ── Convenience Getters ──────────────────────────────────
    get centerX() { return this.x + this.width  / 2; }
    get centerY() { return this.y + this.height / 2; }
    get feetY()   { return this.y + this.height;      }
}
