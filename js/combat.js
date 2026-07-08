// combat.js — Hit detection + AI logic

// ── Rect overlap ────────────────────────────────────────────
function rectsOverlap(ax,ay,aw,ah, bx,by,bw,bh) {
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

// ── Hitbox position ─────────────────────────────────────────
function getHitbox(attacker, skill) {
    return {
        x: attacker.facingRight ? attacker.x + attacker.width - 5 : attacker.x - skill.hitboxW + 5,
        y: attacker.y + (attacker.height - skill.hitboxH) / 2,
        w: skill.hitboxW,
        h: skill.hitboxH,
    };
}

// ── Check & apply hits each frame ───────────────────────────
function checkHitboxes(attacker, defender) {
    if (!attacker.activeSkill) return;
    const sk = SKILL_DEFS[attacker.activeSkill.id];
    const fr = attacker.activeSkill.frame;

    if (fr < sk.activeStart || fr > sk.activeEnd) return;
    if (defender.invincibleFrames > 0) return;
    if (sk.hitboxW === 0) return; // buff skills have no hitbox

    // Multi-hit check
    if (sk.hits && sk.hits > 1) {
        if (attacker.activeSkill.hitCount >= sk.hits) return;
        if (fr - attacker.activeSkill.lastHitFrame < (sk.hitInterval || 8)) return;
    } else {
        if (attacker.activeSkill.hitDone) return;
    }

    const hb = getHitbox(attacker, sk);
    if (!rectsOverlap(hb.x, hb.y, hb.w, hb.h, defender.x, defender.y, defender.width, defender.height)) return;

    // --- HIT! ---
    let dmg = sk.damage;
    if (attacker.buffs.damage) dmg = Math.ceil(dmg * attacker.buffs.damage.mult);
    if (sk.execBonus && defender.hp < defender.maxHp * 0.3) dmg = Math.ceil(dmg * (1 + sk.execBonus));

    const dir = attacker.facingRight ? 1 : -1;
    defender.takeDamage(dmg, dir, sk);

    if (sk.poison)    defender.applyPoison(sk.poison);
    if (sk.interrupt) defender.cancelSkill();
    if (sk.invincible) attacker.invincibleFrames = sk.duration;

    // Effects
    const hx = attacker.facingRight ? defender.x : defender.x + defender.width;
    spawnHitParticles(hx, defender.centerY, sk.color, dmg);
    triggerScreenShake(dmg > 20 ? 9 : 4);

    // Track hit
    if (sk.hits && sk.hits > 1) {
        attacker.activeSkill.hitCount++;
        attacker.activeSkill.lastHitFrame = fr;
    } else {
        attacker.activeSkill.hitDone = true;
    }
}

// ── AI Update ────────────────────────────────────────────────
function updateAI(aiChar, player, difficulty) {
    const diff    = AI_DIFFS[difficulty];
    const skillIds = CHAR_DEFS[aiChar.type].skills;

    aiChar._aiThink++;
    if (aiChar._aiThink < diff.react) return;
    aiChar._aiThink = 0;

    if (aiChar.staggerFrames > 0) return;

    const dist    = Math.abs(aiChar.x - player.x);
    const toRight = player.x > aiChar.x;
    const attackRange = aiChar.width + player.width + 80;

    if (dist > attackRange) {
        // Chase
        aiChar._aiMoveDir = toRight ? 1 : -1;
        if (Math.random() < 0.08 && aiChar.onGround) aiChar._aiJump = true;
    } else if (dist < 35) {
        // Too close, back up
        aiChar._aiMoveDir = toRight ? -1 : 1;
    } else {
        // In attack range — stand and fight
        aiChar._aiMoveDir = 0;
        aiChar.facingRight = toRight;

        if (!aiChar.activeSkill && Math.random() < diff.skillChance) {
            const avail = skillIds.filter(id => !(aiChar.skillCooldowns[id] > 0));
            if (avail.length > 0) {
                let pick;
                if (difficulty === 'hard') {
                    // Hard AI prioritises high-damage skills
                    const prio = ['death_mark','charge','heavy_strike','shadow_step','shield_bash','poison_blade','quick_slash','battle_cry'];
                    pick = prio.find(id => avail.includes(id)) || avail[0];
                } else {
                    pick = avail[Math.floor(Math.random() * avail.length)];
                }
                aiChar.tryUseSkill(pick);
            }
        }

        // Medium/Hard: occasional jump
        if (difficulty !== 'easy' && Math.random() < 0.04 && aiChar.onGround) {
            aiChar._aiJump = true;
        }
    }
}
