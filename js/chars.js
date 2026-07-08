// chars.js — Character class with full physics, skill & status system

class Character {
    constructor(x, y, type, isAI = false) {
        const def = CHAR_DEFS[type];
        this.type = type;
        this.name = def.name;
        this.width = def.width;
        this.height = def.height;
        this.maxHp = def.maxHp;
        this.isAI = isAI;

        // Appearance (overridden by skin)
        this.primaryColor = def.color;
        this.accentColor  = def.accent;

        // Start position (saved for reset)
        this.startX = x; this.startY = y;
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;

        // State
        this.hp = def.maxHp;
        this.onGround = false;
        this.facingRight = def.startFacing;
        this.state = 'idle'; // idle|running|jumping|falling|attacking|hurt|dead

        // Skill system
        this.activeSkill    = null;  // { id, frame, hitDone, hitCount, lastHitFrame }
        this.skillCooldowns = {};    // { skillId: framesLeft }

        // Status effects
        this.buffs            = {};  // { damage: { mult, frames }, ... }
        this.poison           = null;// { dps, frames }
        this.staggerFrames    = 0;
        this.hurtFrames       = 0;
        this.invincibleFrames = 0;

        // Animation
        this.animTimer = 0;
        this.stepTimer = 0;
        this.idleBob   = 0;

        // AI state
        this._aiThink  = 0;
        this._aiMoveDir = 0;
        this._aiJump   = false;
    }

    // ── Reset for new round ─────────────────────────────────
    reset() {
        this.x = this.startX; this.y = this.startY;
        this.vx = 0; this.vy = 0;
        this.hp = this.maxHp;
        this.onGround = false;
        this.facingRight = CHAR_DEFS[this.type].startFacing;
        this.state = 'idle';
        this.activeSkill = null;
        this.skillCooldowns = {};
        this.buffs = {};
        this.poison = null;
        this.staggerFrames = 0;
        this.hurtFrames = 0;
        this.invincibleFrames = 0;
        this.animTimer = 0;
        this._aiThink = 0; this._aiMoveDir = 0; this._aiJump = false;
    }

    // ── Main update (called every frame) ───────────────────
    update(groundY, canvasW, opponent, platforms = []) {
        this.animTimer++;

        // ── Tick cooldowns & buffs ──
        for (const k in this.skillCooldowns) {
            if (this.skillCooldowns[k] > 0) this.skillCooldowns[k]--;
        }
        for (const k in this.buffs) {
            this.buffs[k].frames--;
            if (this.buffs[k].frames <= 0) delete this.buffs[k];
        }

        // ── Poison tick ──
        if (this.poison) {
            this.poison.frames--;
            if (this.poison.frames <= 0) { this.poison = null; }
            else if (this.animTimer % 60 === 0) {
                this.hp = Math.max(0, this.hp - this.poison.dps);
                spawnHitParticles(this.centerX, this.centerY, '#2ecc71', this.poison.dps);
            }
        }

        // ── Tick stagger/hurt/invincible ──
        if (this.staggerFrames    > 0) this.staggerFrames--;
        if (this.hurtFrames       > 0) this.hurtFrames--;
        if (this.invincibleFrames > 0) this.invincibleFrames--;

        // ── Skill animation ──
        if (this.activeSkill) {
            this.activeSkill.frame++;
            const sk = SKILL_DEFS[this.activeSkill.id];

            // Dash movement
            if (sk.dashSpeed && this.activeSkill.frame < sk.duration * 0.7) {
                this.vx = (this.facingRight ? 1 : -1) * sk.dashSpeed;
            }

            // Buff skills apply immediately once
            if (sk.buff && !this.activeSkill.buffApplied) {
                this.buffs[sk.buff.type] = { mult: sk.buff.mult, frames: sk.buff.frames };
                this.activeSkill.buffApplied = true;
            }

            if (this.activeSkill.frame >= sk.duration) {
                this.activeSkill = null;
            }
        }

        // ── Input / AI movement ──
        const locked = this.staggerFrames > 0 || (this.activeSkill && !SKILL_DEFS[this.activeSkill.id]?.dashSpeed);
        if (!locked) {
            if (this.isAI) {
                this._applyAIMovement();
            } else {
                this._handleInput();
            }
        }

        // ── Auto-face opponent when idle ──
        if (opponent && this.state === 'idle' && !this.activeSkill) {
            this.facingRight = this.x < opponent.x;
        }

        // ── Physics ──
        this.vy += PHYSICS.GRAVITY;
        if (this.vy > PHYSICS.MAX_FALL) this.vy = PHYSICS.MAX_FALL;
        this.x += this.vx;
        this.y += this.vy;

        // Friction (not during dashes)
        if (!this.activeSkill || !SKILL_DEFS[this.activeSkill.id]?.dashSpeed) {
            this.vx *= PHYSICS.FRICTION;
            if (Math.abs(this.vx) < 0.08) this.vx = 0;
        }

        // ── Collision ──
        this._collide(groundY, canvasW, platforms);

        // ── State ──
        if (!this.activeSkill) {
            if (!this.onGround)           this.state = this.vy < 0 ? 'jumping' : 'falling';
            else if (Math.abs(this.vx) > 0.3) this.state = 'running';
            else                          this.state = 'idle';
        } else {
            this.state = 'attacking';
        }

        if (this.state === 'running') this.stepTimer++;
        this.idleBob = this.state === 'idle' ? Math.sin(this.animTimer * 0.04) * 2.5 : 0;
    }

    _handleInput() {
        const ctrl = CHAR_DEFS[this.type].controls;
        if (isHeld(ctrl.left))  { this.vx = -PHYSICS.MOVE_SPEED; this.facingRight = false; }
        if (isHeld(ctrl.right)) { this.vx =  PHYSICS.MOVE_SPEED; this.facingRight = true;  }
        if (isJust(ctrl.jump) && this.onGround) {
            this.vy = PHYSICS.JUMP_FORCE; this.onGround = false;
        }
    }

    _applyAIMovement() {
        if (this._aiMoveDir !== 0) {
            this.vx = this._aiMoveDir * PHYSICS.MOVE_SPEED;
            this.facingRight = this._aiMoveDir > 0;
        }
        if (this._aiJump && this.onGround) {
            this.vy = PHYSICS.JUMP_FORCE; this.onGround = false; this._aiJump = false;
        }
    }

    _collide(groundY, canvasW, platforms) {
        // Platforms
        for (const p of platforms) {
            if (this.vy >= 0 &&
                this.x + this.width > p.x && this.x < p.x + p.w &&
                this.y + this.height >= p.y && this.y + this.height <= p.y + p.h + Math.abs(this.vy) + 2) {
                this.y = p.y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // Ground
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.onGround = true;
        } else {
            // Only set to false if not already set by platform
            if (this.y + this.height < groundY - 2) this.onGround = false;
        }

        // Walls
        if (this.x < 0)               { this.x = 0;               this.vx = 0; }
        if (this.x + this.width > canvasW) { this.x = canvasW - this.width; this.vx = 0; }
    }

    // ── Use a skill ─────────────────────────────────────────
    tryUseSkill(skillId) {
        if (this.activeSkill) return false;
        if (this.staggerFrames > 0) return false;
        if ((this.skillCooldowns[skillId] || 0) > 0) return false;

        this.activeSkill = { id: skillId, frame: 0, hitDone: false, hitCount: 0, lastHitFrame: -999 };
        this.skillCooldowns[skillId] = SKILL_DEFS[skillId].cooldown;
        return true;
    }

    // ── Take damage ─────────────────────────────────────────
    takeDamage(amount, knockDir, skill) {
        if (this.invincibleFrames > 0) return;
        if (this.hp <= 0) return;

        this.hp = Math.max(0, this.hp - amount);
        this.vx = knockDir * (skill?.knockX || 5);
        this.vy = skill?.knockY || -4;
        this.staggerFrames = Math.min(50, 18 + Math.floor(amount));
        this.hurtFrames    = 14;

        // Cancel skill on heavy hit
        if (amount > 20 && this.activeSkill) { this.activeSkill = null; }
    }

    applyPoison(pd) { this.poison = { dps: pd.dps, frames: pd.frames }; }
    cancelSkill()   { this.activeSkill = null; }

    get centerX() { return this.x + this.width  / 2; }
    get centerY() { return this.y + this.height / 2; }
    get feetY()   { return this.y + this.height;      }
    get isDead()  { return this.hp <= 0;               }
}
