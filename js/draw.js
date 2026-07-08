// draw.js — ALL rendering: background, characters, HUD, and all screens

// ── Stars (generated once) ─────────────────────────────────
let stars = [];
function initStars() {
    stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H * 0.7,
        size: Math.random() * 1.5 + 0.3, base: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.02 + 0.008,
    }));
}

// ── Polyfill/Helper for rounded rectangles (fully cross-browser safe) ──
function drawRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// ── Floating particles for background screens ─────────────
let menuParticles = [];
function updateMenuParticles() {
    if (menuParticles.length < 35) {
        menuParticles.push({
            x: Math.random() * CANVAS_W,
            y: CANVAS_H + 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.2 - 0.4,
            size: Math.random() * 3 + 1,
            color: Math.random() < 0.5 ? 'rgba(136, 85, 255, 0.4)' : 'rgba(240, 165, 0, 0.3)',
            life: Math.random() * 300 + 100
        });
    }
    menuParticles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0 || p.x < 0 || p.x > CANVAS_W || p.y < -10) {
            menuParticles.splice(idx, 1);
        }
    });
}

function drawMenuParticles(ctx) {
    menuParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ── Utility ─────────────────────────────────────────────────
function btn(ctx, label, x, y, w, h, hovered, accent = '#8855ff') {
    const alpha = hovered ? 1 : 0.75;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (hovered) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 15;
    }

    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, hovered ? accent : '#2a1a4a');
    g.addColorStop(1, hovered ? darken(accent, 0.4) : '#1a0e30');

    ctx.fillStyle = g;
    drawRoundRect(ctx, x, y, w, h, 8); ctx.fill();

    ctx.strokeStyle = hovered ? '#ffffff' : accent;
    ctx.lineWidth = hovered ? 2 : 1.5;
    drawRoundRect(ctx, x, y, w, h, 8); ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
    return { x, y, w, h };
}

function darken(hex, amt) {
    if (hex.startsWith('rgba')) return hex;
    if (hex.startsWith('rgb')) return hex;
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amt));
    const g = Math.max(0, ((n >> 8)  & 0xff) * (1 - amt));
    const b = Math.max(0, (n         & 0xff) * (1 - amt));
    return `rgb(${r|0},${g|0},${b|0})`;
}

function isOver(mx, my, x, y, w, h) { return mx >= x && mx <= x+w && my >= y && my <= y+h; }

function title(ctx, text, x, y, size = 72, t = 0) {
    ctx.save();
    ctx.font = `900 ${size}px Cinzel, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.fillStyle = '#100a20';
    ctx.fillText(text, x + 3, y + 4);

    const glow = `rgba(136,85,255,${0.65 + 0.15 * Math.sin(t * 0.03)})`;
    ctx.shadowColor = glow; ctx.shadowBlur = 35;

    const g = ctx.createLinearGradient(x - 250, y, x + 250, y);
    g.addColorStop(0, '#a27cff');
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(1, '#ffb834');
    ctx.fillStyle = g;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// ── Background (per map) ────────────────────────────────────
function drawBackground(ctx, map) {
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, map.skyTop); sky.addColorStop(1, map.skyBot);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    stars.forEach(s => {
        s.phase += s.speed;
        const a = s.base * (0.6 + 0.4 * Math.sin(s.phase));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,228,196,${a})`; ctx.fill();
    });

    // Moon
    const mx = CANVAS_W * 0.83, my = 70, mr = 34;
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(252,242,190,0.9)'; ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 12, my - 4, mr - 5, 0, Math.PI * 2);
    ctx.fillStyle = map.skyTop; ctx.fill();
    ctx.restore();

    // Mountains
    ctx.fillStyle = 'rgba(10,5,25,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H * 0.58);
    [90,190,310,430,560,680,820,950,1080].forEach((px,i) => {
        ctx.lineTo(px, CANVAS_H * [0.38,0.52,0.32,0.48,0.28,0.44,0.35,0.50,0.38][i]);
    });
    ctx.lineTo(CANVAS_W, CANVAS_H * 0.58); ctx.closePath(); ctx.fill();
}

// ── Ground ───────────────────────────────────────────────────
function drawGround(ctx, map, platforms = []) {
    const gl = ctx.createLinearGradient(0, GROUND_Y - 28, 0, GROUND_Y + 4);
    gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, map.glowColor);
    ctx.fillStyle = gl; ctx.fillRect(0, GROUND_Y - 28, CANVAS_W, 32);

    const gf = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    gf.addColorStop(0, map.groundFill); gf.addColorStop(0.08, '#0f0a1e'); gf.addColorStop(1, '#080610');
    ctx.fillStyle = gf; ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Glow line
    ctx.save();
    ctx.shadowColor = map.lineColor; ctx.shadowBlur = 16;
    ctx.strokeStyle = map.lineColor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(CANVAS_W, GROUND_Y); ctx.stroke();
    ctx.restore();

    // Runes
    ctx.strokeStyle = map.runeColor; ctx.lineWidth = 1;
    for (let rx = 60; rx < CANVAS_W; rx += 110) {
        ctx.beginPath();
        ctx.moveTo(rx, GROUND_Y+12); ctx.lineTo(rx+30, GROUND_Y+4); ctx.lineTo(rx+60, GROUND_Y+12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx+30, GROUND_Y+4); ctx.lineTo(rx+30, GROUND_Y+22); ctx.stroke();
    }

    // Platforms
    for (const p of platforms) {
        const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        pg.addColorStop(0, map.groundFill); pg.addColorStop(1, '#0f0a1e');
        ctx.fillStyle = pg; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.save(); ctx.shadowColor = map.lineColor; ctx.shadowBlur = 8;
        ctx.strokeStyle = map.lineColor; ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.restore();
    }
}

// ── Segmented Brawlhalla/bandit.rip Character Render Engine ──
function drawSegmentedChar(ctx, type, state, animTimer, stepTimer, activeSkill, facingRight, primaryColor, accentColor, x, y, width, height, scaleFactor = 1.0) {
    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);

    const facing = facingRight ? 1 : -1;
    const time = animTimer;

    const bob = state === 'idle' ? Math.sin(time * 0.08) * 3 : 0;

    let runPhase = stepTimer * 0.22;
    let feetOffset = { lx: -12, ly: 0, rx: 12, ry: 0 };
    let handsOffset = { lx: -18, ly: 0, rx: 18, ry: 0 };

    if (state === 'running') {
        const str = 14;
        feetOffset.lx = Math.cos(runPhase) * str;
        feetOffset.ly = Math.sin(runPhase) * 6;
        feetOffset.rx = Math.cos(runPhase + Math.PI) * str;
        feetOffset.ry = Math.sin(runPhase + Math.PI) * 6;

        handsOffset.lx = Math.sin(runPhase) * 8 - 10;
        handsOffset.ly = Math.cos(runPhase) * 3;
        handsOffset.rx = Math.sin(runPhase + Math.PI) * 8 + 10;
        handsOffset.ry = Math.cos(runPhase + Math.PI) * 3;
    } else if (state === 'jumping' || state === 'falling') {
        feetOffset.lx = -8; feetOffset.ly = 6;
        feetOffset.rx = 8;  feetOffset.ry = 11;
        handsOffset.lx = -14; handsOffset.ly = -8;
        handsOffset.rx = 14;  handsOffset.ly = -4;
    }

    let weaponAngle = 0;
    let isAttacking = activeSkill !== null;
    let weaponScale = 1.0;

    if (isAttacking) {
        const sk = SKILL_DEFS[activeSkill.id];
        const progress = activeSkill.frame / sk.duration;
        weaponAngle = -1.2 + progress * 2.8;
        handsOffset.rx = 18 + Math.cos(weaponAngle * 2) * 10;
        handsOffset.ry = -10 + Math.sin(weaponAngle * 2) * 10;
        if (progress < 0.4) weaponScale = 1.25;
    }

    const cx = x / scaleFactor + (width / 2);
    const cy = (y + bob) / scaleFactor + 38;

    ctx.translate(cx, cy);
    ctx.scale(facing, 1);

    // ── 1. DRAW BACK HAND / SHIELD ──
    if (type === 'warrior') {
        ctx.save();
        ctx.translate(handsOffset.lx, handsOffset.ly + 4);
        ctx.fillStyle = '#8b6914';
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = primaryColor;
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    } else {
        ctx.save();
        ctx.translate(handsOffset.lx, handsOffset.ly + 2);
        ctx.rotate(-0.4);
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-4, -18); ctx.lineTo(4, -18);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#222';
        ctx.fillRect(-2, 0, 4, 7);
        ctx.restore();
    }

    // ── 2. DRAW BACK FOOT (Standard rect/circle for 100% compatibility) ──
    ctx.fillStyle = darken(primaryColor, 0.45);
    ctx.strokeStyle = darken(accentColor, 0.45);
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, feetOffset.lx - 7, 34 + feetOffset.ly, 13, 8, 3);
    ctx.fill(); ctx.stroke();

    // ── 3. DRAW TORSO ──
    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    drawRoundRect(ctx, -14, -12, 28, 36, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-10, -8, 20, 8);

    // ── 4. DRAW FRONT FOOT ──
    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    drawRoundRect(ctx, feetOffset.rx - 7, 34 + feetOffset.ry, 13, 8, 3);
    ctx.fill(); ctx.stroke();

    // ── 5. DRAW HEAD ──
    ctx.save();
    ctx.translate(0, -28);

    if (type === 'warrior') {
        ctx.fillStyle = primaryColor;
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = accentColor; ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#0d1a2e';
        ctx.fillRect(2, -3, 13, 5);
        ctx.fillStyle = '#80d0ff';
        ctx.fillRect(7, -2, 5, 3);

        ctx.fillStyle = '#d44000';
        ctx.beginPath();
        ctx.moveTo(-6, -13);
        ctx.bezierCurveTo(-18, -25, -5, -34, -2, -36);
        ctx.bezierCurveTo(-2, -26, 0, -20, -6, -13);
        ctx.fill();
    } else {
        ctx.fillStyle = '#4a1010';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#100505';
        ctx.beginPath();
        ctx.arc(3, 1, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.arc(4, -1, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -1, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // ── 6. DRAW FRONT HAND + WEAPON ──
    ctx.save();
    ctx.translate(handsOffset.rx, handsOffset.ry + 2);

    if (isAttacking) {
        ctx.rotate(weaponAngle);
        ctx.scale(weaponScale, weaponScale);
    }

    if (type === 'warrior') {
        ctx.fillStyle = '#e8f0f8';
        ctx.beginPath();
        ctx.moveTo(-3, -8);
        ctx.lineTo(-4, -46);
        ctx.lineTo(0, -54);
        ctx.lineTo(4, -46);
        ctx.lineTo(3, -8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -48, 2, 38);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-9, -8, 18, 5);
        ctx.fillStyle = '#553311';
        ctx.fillRect(-2.5, -3, 5, 9);
    } else {
        ctx.save();
        ctx.rotate(0.2);
        ctx.fillStyle = '#b0c0d0';
        ctx.beginPath();
        ctx.moveTo(-3, 0); ctx.lineTo(-3, -26); ctx.lineTo(0, -32); ctx.lineTo(3, -26); ctx.lineTo(3, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(-0.5, -28, 1, 24);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-6, 0, 12, 3.5);
        ctx.fillStyle = '#222';
        ctx.fillRect(-2, 3.5, 4, 7);
        ctx.restore();
    }
    ctx.restore();

    // ── 7. ATTACK SLASH TRAIL ──
    if (isAttacking) {
        const sk = SKILL_DEFS[activeSkill.id];
        const progress = activeSkill.frame / sk.duration;
        if (progress > 0.2 && progress < 0.7 && sk.hitboxW > 0) {
            ctx.save();
            ctx.strokeStyle = sk.color + 'aa';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 48, -0.6, 1.2);
            ctx.stroke();
            ctx.strokeStyle = '#ffffffaa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 48, -0.4, 1.0);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
}

// ── Draw wrapper for main battle ───────────────────────────
function drawChar(ctx, char) {
    const x = char.x, y = char.y, w = char.width, h = char.height;

    let renderPrimary = char.primaryColor;
    let renderAccent = char.accentColor;

    if (char.hurtFrames > 0 && char.animTimer % 6 < 3) {
        renderPrimary = '#ffffff';
        renderAccent = '#ffffff';
    }

    const aH = GROUND_Y - char.feetY;
    const sc = Math.max(0.15, 1 - aH / 280);
    ctx.beginPath();
    ctx.ellipse(char.centerX, GROUND_Y - 3, w * 0.44 * sc, 6 * sc, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.04, 0.25 * sc)})`; ctx.fill();

    if (char.invincibleFrames > 0) {
        ctx.save();
        ctx.shadowColor = '#9b59b6';
        ctx.shadowBlur = 15;
    }

    drawSegmentedChar(
        ctx,
        char.type,
        char.state,
        char.animTimer,
        char.stepTimer,
        char.activeSkill,
        char.facingRight,
        renderPrimary,
        renderAccent,
        x, y, w, h
    );

    if (char.invincibleFrames > 0) {
        ctx.restore();
    }

    if (char.poison) {
        ctx.fillStyle = 'rgba(46,204,113,0.18)';
        ctx.beginPath(); drawRoundRect(ctx, char.x, char.y, char.width, char.height, 8); ctx.fill();
    }
    if (char.buffs.damage) {
        if (Math.random() < 0.22) {
            spawnHitParticles(char.centerX + (Math.random()-0.5)*w, char.y + Math.random()*h, '#ff5500', 2);
        }
    }

    if (char.staggerFrames > 0) {
        ctx.fillStyle = '#ffea00'; ctx.font = 'bold 15px Inter'; ctx.textAlign = 'center';
        ctx.fillText('★', char.centerX, char.y - 16);
    }
}

// ── HUD ─────────────────────────────────────────────────────
function drawHPBar(ctx, char, x, y, w, flip) {
    const pct = Math.max(0, char.hp / char.maxHp);
    const barH = 22;
    const innerW = (w - 4) * pct;

    ctx.fillStyle = 'rgba(15,10,25,0.78)';
    ctx.beginPath(); drawRoundRect(ctx, x, y, w, barH, 5); ctx.fill();

    const hpColor = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    if (flip) ctx.fillRect(x + 2 + (w-4) - innerW, y + 2, innerW, barH - 4);
    else      ctx.fillRect(x + 2,                   y + 2, innerW, barH - 4);

    ctx.strokeStyle = char.accentColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); drawRoundRect(ctx, x, y, w, barH, 5); ctx.stroke();

    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(char.hp)} / ${char.maxHp}`, x + w/2, y + barH/2 + 4);

    ctx.font = '900 15px Cinzel, serif'; ctx.fillStyle = char.accentColor; ctx.textAlign = flip ? 'right' : 'left';
    ctx.fillText(char.name.toUpperCase(), flip ? x + w : x, y - 6);
}

function drawCooldowns(ctx, char, x, y, flip) {
    const skillIds = CHAR_DEFS[char.type].skills;
    const boxW = 44, boxH = 44, gap = 6;
    const totalW = skillIds.length * (boxW + gap) - gap;
    const startX = flip ? x - totalW : x;

    skillIds.forEach((sid, i) => {
        const sk = SKILL_DEFS[sid];
        const cd = char.skillCooldowns[sid] || 0;
        const cdPct = cd / sk.cooldown;
        const bx = startX + i * (boxW + gap);
        const by = y;
        const isActive = char.activeSkill?.id === sid;

        ctx.fillStyle = 'rgba(10,5,20,0.85)'; ctx.beginPath(); drawRoundRect(ctx, bx, by, boxW, boxH, 6); ctx.fill();

        if (cd === 0) {
            ctx.fillStyle = 'rgba(120,60,255,0.18)'; ctx.beginPath(); drawRoundRect(ctx, bx, by, boxW, boxH, 6); ctx.fill();
        }

        if (cd > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(bx, by, boxW, boxH * cdPct);
        }

        if (isActive) {
            ctx.save(); ctx.shadowColor = sk.color; ctx.shadowBlur = 12;
            ctx.strokeStyle = sk.color; ctx.lineWidth = 2.5;
            ctx.beginPath(); drawRoundRect(ctx, bx, by, boxW, boxH, 6); ctx.stroke();
            ctx.restore();
        } else {
            ctx.strokeStyle = cd === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath(); drawRoundRect(ctx, bx, by, boxW, boxH, 6); ctx.stroke();
        }

        ctx.fillStyle = cd === 0 ? '#fff' : '#666';
        ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center';
        ctx.fillText(sk.icon || sk.key, bx + boxW/2, by + boxH/2 + 6);

        if (cd > 0) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter';
            ctx.fillText(Math.ceil(cd/60)+'s', bx + boxW/2, by + boxH - 4);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '9px Inter';
        ctx.fillText(sk.key, bx + boxW/2, by + boxH + 10);
    });
}

function drawHUD(ctx, p1, p2, timerFrames, round, p1Wins, p2Wins) {
    const barW = 380;
    const barX1 = 30, barX2 = CANVAS_W - barX1 - barW;

    drawHPBar(ctx, p1, barX1, 12, barW, false);
    drawHPBar(ctx, p2, barX2, 12, barW, true);

    drawCooldowns(ctx, p1, barX1, 44, false);
    drawCooldowns(ctx, p2, barX2 + barW, 44, true);

    const secs = Math.ceil(timerFrames / 60);
    ctx.fillStyle = 'rgba(15,10,25,0.7)';
    ctx.beginPath(); drawRoundRect(ctx, CANVAS_W/2 - 50, 10, 100, 52, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,255,0.4)'; ctx.stroke();

    ctx.font = `bold ${secs <= 10 ? 30 : 26}px Cinzel, serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = secs <= 10 ? '#ff3333' : '#ffffff';
    ctx.fillText(secs, CANVAS_W / 2, 32);

    ctx.font = 'bold 11px Inter'; ctx.fillStyle = 'rgba(200,180,255,0.6)';
    ctx.fillText(`ROUND ${round}`, CANVAS_W / 2, 50);

    for (let i = 0; i < 2; i++) {
        const filled1 = i < p1Wins, filled2 = i < p2Wins;
        const dx = 22;
        ctx.beginPath(); ctx.arc(CANVAS_W/2 - 70 - i*dx, 34, 6, 0, Math.PI*2);
        ctx.fillStyle = filled1 ? '#f0a500' : 'rgba(255,255,255,0.15)'; ctx.fill();
        ctx.beginPath(); ctx.arc(CANVAS_W/2 + 70 + i*dx, 34, 6, 0, Math.PI*2);
        ctx.fillStyle = filled2 ? '#ff6b6b' : 'rgba(255,255,255,0.15)'; ctx.fill();
    }
}

// ── Loading Screen ───────────────────────────────────────────
function drawLoading(ctx, progress, t) {
    const bg = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 40, CANVAS_W/2, CANVAS_H/2, 650);
    bg.addColorStop(0, '#10062a');
    bg.addColorStop(1, '#02020a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    updateMenuParticles();
    drawMenuParticles(ctx);

    title(ctx, 'HERO CLASH', CANVAS_W/2, CANVAS_H/2 - 50, 80, t);

    const bw = 400, bh = 8, bx = (CANVAS_W-bw)/2, by = CANVAS_H/2 + 30;
    ctx.fillStyle = '#0a0518'; ctx.beginPath(); drawRoundRect(ctx, bx, by, bw, bh, 4); ctx.fill();

    const g = ctx.createLinearGradient(bx, by, bx + bw, by);
    g.addColorStop(0, '#8855ff'); g.addColorStop(1, '#f0a500');
    ctx.fillStyle = g;
    ctx.beginPath(); drawRoundRect(ctx, bx, by, bw*progress, bh, 4); ctx.fill();

    ctx.fillStyle = 'rgba(200,180,255,0.5)'; ctx.font = '13px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`Loading… ${Math.round(progress*100)}%`, CANVAS_W/2, by + 30);
}

// ── Main Menu ────────────────────────────────────────────────
function drawMainMenu(ctx, mx, my, t) {
    const bg = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 60, CANVAS_W/2, CANVAS_H/2, 650);
    bg.addColorStop(0,'#12082e'); bg.addColorStop(1,'#020208');
    ctx.fillStyle = bg; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    updateMenuParticles();
    drawMenuParticles(ctx);

    title(ctx, '⚔  HERO CLASH  ⚔', CANVAS_W/2, 180, 72, t);

    ctx.font = '16px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(180,160,220,0.6)';
    ctx.fillText('Experience fast-paced segmented combat inspired by Brawlhalla & bandit.rip', CANVAS_W/2, 240);

    const cx = CANVAS_W/2, bw = 240, bh = 54;
    const btns = {
        play: btn(ctx,'▶  PLAY',  cx-bw/2, 290, bw, bh, isOver(mx,my, cx-bw/2,290,bw,bh), '#8855ff'),
        shop: btn(ctx,'🛒  SHOP', cx-bw/2, 360, bw, bh, isOver(mx,my, cx-bw/2,360,bw,bh), '#f0a500'),
    };

    ctx.font='11px Inter'; ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.textAlign='center';
    ctx.fillText('P1: WASD + F,G,H,T  |  P2: ARROWS + Num 1,2,3,4', CANVAS_W/2, CANVAS_H-16);

    return btns;
}

// ── Character Select ─────────────────────────────────────────
function drawCharSelect(ctx, sel, mx, my) {
    ctx.fillStyle='#04020a'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,228,196,${s.base * 0.35})`; ctx.fill();
    });

    ctx.font='bold 30px Cinzel, serif'; ctx.textAlign='center'; ctx.fillStyle='#c0a0ff';
    ctx.fillText('CHOOSE YOUR CHAMPION', CANVAS_W/2, 45);

    const chars  = Object.keys(CHAR_DEFS);
    const sides  = [
        { label:'PLAYER 1', cx:CANVAS_W*0.22, color:'#f0a500', selected: sel.p1 },
        { label:'PLAYER 2 (AI)', cx:CANVAS_W*0.78, color:'#ff6b6b', selected: sel.p2 }
    ];

    const btns = {};

    sides.forEach((side, pi) => {
        ctx.font='900 13px Inter'; ctx.textAlign='center'; ctx.fillStyle=side.color;
        ctx.fillText(side.label, side.cx, 80);

        if (side.selected) {
            const sk = SKINS[side.selected]?.[getEquipped(side.selected)] || SKINS[side.selected][0];
            const pX = side.cx - (side.selected === 'warrior' ? 29 : 22)*2.2;

            const pY = 110;
            drawSegmentedChar(
                ctx,
                side.selected,
                'idle',
                Date.now() / 16,
                0,
                null,
                pi === 0,
                sk.primary,
                sk.accent,
                pX, pY,
                CHAR_DEFS[side.selected].width,
                CHAR_DEFS[side.selected].height,
                2.2
            );

            const def = CHAR_DEFS[side.selected];
            ctx.font='900 22px Cinzel'; ctx.fillStyle='#fff';
            ctx.fillText(def.name, side.cx, 320);
            ctx.font='italic 12px Inter'; ctx.fillStyle='rgba(200,180,255,0.7)';
            ctx.fillText(def.title, side.cx, 338);

            ctx.font='bold 11px Inter'; ctx.fillStyle=side.color;
            ctx.fillText('SKILLSET:', side.cx, 365);
            def.skills.forEach((sid, si) => {
                const sinfo = SKILL_DEFS[sid];
                ctx.fillStyle='#fff'; ctx.font='11px Inter'; ctx.textAlign='center';
                ctx.fillText(`${sinfo.icon} ${sinfo.name} — ${sinfo.desc}`, side.cx, 382 + si*15);
            });
        }

        chars.forEach((ctype, ci) => {
            const def = CHAR_DEFS[ctype];
            const cardW = 120, cardH = 50;
            const cardX = CANVAS_W/2 - cardW/2 + (pi === 0 ? -70 : 70);
            const cardY = 110 + ci * 60;
            const hovered = isOver(mx, my, cardX, cardY, cardW, cardH);
            const isSel = side.selected === ctype;

            ctx.fillStyle = isSel ? side.color + '33' : hovered ? 'rgba(120,60,255,0.2)' : 'rgba(20,10,40,0.6)';
            ctx.beginPath(); drawRoundRect(ctx, cardX, cardY, cardW, cardH, 6); ctx.fill();
            ctx.strokeStyle = isSel ? side.color : hovered ? 'rgba(120,60,255,0.5)' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = isSel ? 2 : 1;
            ctx.beginPath(); drawRoundRect(ctx, cardX, cardY, cardW, cardH, 6); ctx.stroke();

            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Cinzel'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(def.name, cardX + cardW/2, cardY + cardH/2);

            if (!btns[`p${pi+1}`]) btns[`p${pi+1}`] = {};
            btns[`p${pi+1}`][ctype] = { x: cardX, y: cardY, w: cardW, h: cardH };
        });
    });

    const panelX = CANVAS_W/2 - 190, panelY = 250, panelW = 380, panelH = 175;
    ctx.fillStyle = 'rgba(15,10,35,0.6)';
    ctx.beginPath(); drawRoundRect(ctx, panelX, panelY, panelW, panelH, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,255,0.2)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); drawRoundRect(ctx, panelX, panelY, panelW, panelH, 10); ctx.stroke();

    // ── Difficulty ──
    ctx.font='bold 12px Inter'; ctx.fillStyle='rgba(200,180,255,0.7)'; ctx.textAlign='center';
    ctx.fillText('DIFFICULTY (vs CPU)', CANVAS_W/2, panelY + 20);
    const diffs = ['easy','medium','hard'];
    diffs.forEach((d, di) => {
        const dw=100, dh=30, dx=CANVAS_W/2-155+di*110, dy=panelY + 34;
        const isSelD = sel.difficulty === d;
        const hov = isOver(mx,my,dx,dy,dw,dh);
        const dc = d==='easy'?'#2ecc71':d==='medium'?'#f39c12':'#e74c3c';

        ctx.fillStyle = isSelD ? dc+'44' : hov ? dc+'22' : 'rgba(25,15,40,0.5)';
        ctx.beginPath(); drawRoundRect(ctx, dx,dy,dw,dh,5); ctx.fill();
        ctx.strokeStyle = isSelD ? dc : hov ? dc+'66' : 'rgba(255,255,255,0.1)';
        ctx.beginPath(); drawRoundRect(ctx, dx,dy,dw,dh,5); ctx.stroke();

        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter';
        ctx.fillText(AI_DIFFS[d].label, dx+dw/2, dy+dh/2+4);
        btns[`diff_${d}`] = {x:dx,y:dy,w:dw,h:dh};
    });

    // ── Maps ──
    ctx.font='bold 12px Inter'; ctx.fillStyle='rgba(200,180,255,0.7)'; ctx.fillText('STAGE SELECT', CANVAS_W/2, panelY + 95);
    MAPS.forEach((map, mi) => {
        const mw=80, mh=28, mx2=CANVAS_W/2-170+mi*88, my2=panelY + 110;
        const isSelM = sel.mapId === map.id;
        const hov = isOver(mx,my,mx2,my2,mw,mh);

        ctx.fillStyle = isSelM ? 'rgba(136,85,255,0.35)' : hov ? 'rgba(136,85,255,0.15)' : 'rgba(25,15,40,0.5)';
        ctx.beginPath(); drawRoundRect(ctx, mx2,my2,mw,mh,4); ctx.fill();
        ctx.strokeStyle = isSelM ? '#8855ff' : hov ? 'rgba(136,85,255,0.5)' : 'rgba(255,255,255,0.1)';
        ctx.beginPath(); drawRoundRect(ctx, mx2,my2,mw,mh,4); ctx.stroke();

        ctx.fillStyle = '#fff'; ctx.font = '10px Inter';
        ctx.fillText(map.name.split(' ')[0], mx2+mw/2, my2+mh/2+3);
        btns[`map_${map.id}`] = {x:mx2,y:my2,w:mw,h:mh};
    });

    if (sel.p1 && sel.p2) {
        const rx=CANVAS_W/2-110, ry=440, rw=220, rh=46;
        btns.ready = btn(ctx,'⚔  START DUEL', rx,ry,rw,rh, isOver(mx,my,rx,ry,rw,rh), '#f0a500');
    }

    btns.back = btn(ctx,'← Back', 20, CANVAS_H-52, 100, 36, isOver(mx,my,20,CANVAS_H-52,100,36), '#555');
    return btns;
}

// ── Round End overlay ────────────────────────────────────────
function drawRoundEnd(ctx, winnerLabel, winnerColor, round) {
    ctx.fillStyle='rgba(2,2,8,0.65)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    ctx.font='bold 52px Cinzel, serif'; ctx.textAlign='center';
    ctx.fillStyle=winnerColor; ctx.shadowColor=winnerColor; ctx.shadowBlur=30;
    ctx.fillText(`Round ${round}`, CANVAS_W/2, CANVAS_H/2-30);
    ctx.font='bold 34px Cinzel'; ctx.fillStyle='#fff'; ctx.shadowBlur=0;
    ctx.fillText(winnerLabel, CANVAS_W/2, CANVAS_H/2+20);
}

// ── Game Over ────────────────────────────────────────────────
function drawGameOver(ctx, winnerLabel, winnerColor, p1Wins, p2Wins, goldEarned, mx, my) {
    ctx.fillStyle='rgba(3,2,10,0.85)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    ctx.font='bold 58px Cinzel, serif'; ctx.textAlign='center';
    ctx.fillStyle=winnerColor; ctx.shadowColor=winnerColor; ctx.shadowBlur=30;
    ctx.fillText('⚔ VICTORY ⚔', CANVAS_W/2, 170);

    ctx.font='bold 32px Cinzel'; ctx.fillStyle='#fff'; ctx.shadowBlur=0;
    ctx.fillText(winnerLabel, CANVAS_W/2, 230);

    ctx.font='22px Inter'; ctx.fillStyle='rgba(200,180,255,0.7)';
    ctx.fillText(`Final Match Score: ${p1Wins} — ${p2Wins}`, CANVAS_W/2, 280);

    if (goldEarned > 0) {
        ctx.font='bold 22px Inter'; ctx.fillStyle='#f0a500';
        ctx.fillText(`💰 + ${goldEarned} Gold Rewarded!`, CANVAS_W/2, 324);
    }

    const btns = {
        again: btn(ctx,'▶  Play Again', CANVAS_W/2-250, 380, 230, 50, isOver(mx,my,CANVAS_W/2-250,380,230,50),'#8855ff'),
        shop:  btn(ctx,'🛒  Enter Shop', CANVAS_W/2+20,  380, 230, 50, isOver(mx,my,CANVAS_W/2+20,380,230,50),'#f0a500'),
        menu:  btn(ctx,'← Main Menu',    CANVAS_W/2-110, 448, 220, 40, isOver(mx,my,CANVAS_W/2-110,448,220,40),'#555'),
    };
    return btns;
}

// ── Shop Screen ──────────────────────────────────────────────
function drawShop(ctx, shopState, mx, my) {
    ctx.fillStyle='#04020a'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    ctx.font='bold 36px Cinzel, serif'; ctx.textAlign='center'; ctx.fillStyle='#f0a500';
    ctx.fillText('🛒  SKIN SHOP', CANVAS_W/2, 50);

    ctx.font='bold 18px Inter'; ctx.fillStyle='#ffd700'; ctx.textAlign='center';
    ctx.fillText(`💰 Balance: ${getGold()} Gold`, CANVAS_W/2, 82);

    const tabs  = Object.keys(CHAR_DEFS);
    const btns  = {};
    tabs.forEach((ctype, ti) => {
        const tw=180, th=36, tx=CANVAS_W/2-190+ti*200, ty=104;
        const isActive = shopState.tab === ctype;
        const hov = isOver(mx,my,tx,ty,tw,th);
        ctx.fillStyle = isActive?'rgba(136,85,255,0.35)':hov?'rgba(136,85,255,0.15)':'rgba(20,10,40,0.7)';
        ctx.beginPath(); drawRoundRect(ctx, tx,ty,tw,th,6); ctx.fill();
        ctx.strokeStyle=isActive?'#8855ff':'rgba(255,255,255,0.1)'; ctx.lineWidth=1.5;
        ctx.beginPath(); drawRoundRect(ctx, tx,ty,tw,th,6); ctx.stroke();
        ctx.fillStyle=isActive?'#fff':'rgba(200,180,255,0.6)'; ctx.font='bold 15px Cinzel'; ctx.textAlign='center';
        ctx.fillText(CHAR_DEFS[ctype].name, tx+tw/2, ty+th/2+5);
        btns[`tab_${ctype}`]={x:tx,y:ty,w:tw,h:th};
    });

    const skins  = SKINS[shopState.tab] || [];
    const equipped = getEquipped(shopState.tab);

    skins.forEach((sk, si) => {
        const cols = 2;
        const cardW=260, cardH=160, pad=30;
        const col=si%cols, row=Math.floor(si/cols);
        const cx=CANVAS_W/2-cardW-pad/2+col*(cardW+pad);
        const cy=168+row*(cardH+20);
        const owned = isSkinOwned(shopState.tab, si);
        const isEq  = equipped===si;
        const hov   = isOver(mx,my,cx,cy,cardW,cardH);

        ctx.fillStyle = isEq?'rgba(136,85,255,0.25)':hov?'rgba(136,85,255,0.1)':'rgba(15,10,30,0.6)';
        ctx.beginPath(); drawRoundRect(ctx, cx,cy,cardW,cardH,8); ctx.fill();
        ctx.strokeStyle=isEq?sk.accent:owned?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.05)'; ctx.lineWidth=isEq?2.5:1;
        ctx.beginPath(); drawRoundRect(ctx, cx,cy,cardW,cardH,8); ctx.stroke();

        const pX = cx + 18;
        const pY = cy + 30;
        drawSegmentedChar(
            ctx,
            shopState.tab,
            'idle',
            Date.now() / 16 + si * 20,
            0,
            null,
            true,
            sk.primary,
            sk.accent,
            pX, pY,
            CHAR_DEFS[shopState.tab].width,
            CHAR_DEFS[shopState.tab].height,
            1.1
        );

        ctx.font='bold 15px Cinzel'; ctx.textAlign='left'; ctx.fillStyle='#fff';
        ctx.fillText(sk.name, cx+95, cy+50);

        if (isEq) {
            ctx.font='bold 11px Inter'; ctx.fillStyle=sk.accent;
            ctx.fillText('✓ EQUIPPED', cx+95, cy+78);
        } else if (owned) {
            const eb=btn(ctx,'Equip',cx+95,cy+70,110,30,hov,sk.accent);
            btns[`equip_${shopState.tab}_${si}`]={x:cx+95,y:cy+70,w:110,h:30};
        } else {
            const canAfford = getGold()>=sk.price;
            const eb=btn(ctx,`Buy ${sk.price}g`,cx+95,cy+70,130,30,hov&&canAfford, canAfford?'#f0a500':'#444');
            if (canAfford) btns[`buy_${shopState.tab}_${si}`]={x:cx+95,y:cy+70,w:130,h:30};
        }
    });

    btns.back = btn(ctx,'← Back', 20, CANVAS_H-52, 100, 36, isOver(mx,my,20,CANVAS_H-52,100,36), '#555');
    return btns;
}

// ── Pause overlay ────────────────────────────────────────────
function drawPaused(ctx, mx, my) {
    ctx.fillStyle='rgba(2,1,5,0.7)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    ctx.font='bold 52px Cinzel, serif'; ctx.textAlign='center'; ctx.fillStyle='#fff';
    ctx.fillText('PAUSED', CANVAS_W/2, CANVAS_H/2-40);
    const btns = {
        resume: btn(ctx,'▶ Resume Duel',   CANVAS_W/2-130, CANVAS_H/2+10, 260,46, isOver(mx,my,CANVAS_W/2-130,CANVAS_H/2+10,260,46),'#8855ff'),
        quit:   btn(ctx,'✕ Return to Menu', CANVAS_W/2-130, CANVAS_H/2+68, 260,46, isOver(mx,my,CANVAS_W/2-130,CANVAS_H/2+68,260,46),'#e74c3c'),
    };
    return btns;
}
