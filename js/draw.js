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

// ── Utility ─────────────────────────────────────────────────
function btn(ctx, label, x, y, w, h, hovered, accent = '#8855ff') {
    const alpha = hovered ? 1 : 0.75;
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, hovered ? accent : '#2a1a4a');
    g.addColorStop(1, hovered ? darken(accent, 0.4) : '#1a0e30');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = hovered ? 2 : 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = accent; ctx.shadowBlur = hovered ? 12 : 0;
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
    return { x, y, w, h };
}

function darken(hex, amt) {
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
    const glow = `rgba(180,100,255,${0.6 + 0.15 * Math.sin(t * 0.03)})`;
    ctx.shadowColor = glow; ctx.shadowBlur = 40;
    const g = ctx.createLinearGradient(x - 200, y, x + 200, y);
    g.addColorStop(0, '#c0a0ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#f0a500');
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
    // Glow above ground
    const gl = ctx.createLinearGradient(0, GROUND_Y - 28, 0, GROUND_Y + 4);
    gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, map.glowColor);
    ctx.fillStyle = gl; ctx.fillRect(0, GROUND_Y - 28, CANVAS_W, 32);

    // Ground fill
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

// ── Character (rectangle + status) ──────────────────────────
function drawChar(ctx, char) {
    const x = char.x, y = char.y + char.idleBob, w = char.width, h = char.height;

    // Shadow on ground
    const aH = GROUND_Y - char.feetY;
    const sc = Math.max(0.15, 1 - aH / 280);
    ctx.beginPath();
    ctx.ellipse(char.centerX, GROUND_Y - 3, w * 0.38 * sc, 6 * sc, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.04, 0.22 * sc)})`; ctx.fill();

    // Hurt blink (white flash)
    if (char.hurtFrames > 0 && char.animTimer % 6 < 3) {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = char.accentColor; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
        return;
    }

    // Body
    ctx.fillStyle = char.primaryColor; ctx.fillRect(x, y, w, h);

    // Status tints
    if (char.poison) {
        ctx.fillStyle = 'rgba(46,204,113,0.25)'; ctx.fillRect(x, y, w, h);
    }
    if (char.buffs.damage) {
        ctx.fillStyle = 'rgba(255,68,0,0.3)'; ctx.fillRect(x, y, w, h);
        // Fire particles periodically
        if (Math.random() < 0.2) spawnHitParticles(x + Math.random()*w, y + Math.random()*h, '#ff4400', 0);
    }

    // Skill active flash
    if (char.activeSkill) {
        const sk = SKILL_DEFS[char.activeSkill.id];
        const fr = char.activeSkill.frame;
        if (fr >= sk.activeStart && fr <= sk.activeEnd && sk.hitboxW > 0) {
            ctx.fillStyle = sk.color + '50'; ctx.fillRect(x, y, w, h);
        }
    }

    // Invincible shimmer
    if (char.invincibleFrames > 0) {
        ctx.fillStyle = `rgba(155,89,182,${0.3 * Math.sin(char.animTimer * 0.3) + 0.3})`;
        ctx.fillRect(x, y, w, h);
    }

    // Outline
    ctx.strokeStyle = char.accentColor; ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Facing arrow
    const dir = char.facingRight ? 1 : -1;
    const ax  = char.centerX + dir * w * 0.22;
    ctx.fillStyle = char.accentColor;
    ctx.beginPath();
    ctx.moveTo(ax, y - 11); ctx.lineTo(ax - dir*9, y - 2); ctx.lineTo(ax + dir*9, y - 2);
    ctx.closePath(); ctx.fill();

    // Stagger indicator
    if (char.staggerFrames > 0) {
        ctx.font = '14px Inter'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffff00';
        ctx.fillText('★', char.centerX, y - 20);
    }
}

// ── HUD ─────────────────────────────────────────────────────
function drawHPBar(ctx, char, x, y, w, flip) {
    const pct = Math.max(0, char.hp / char.maxHp);
    const barH = 22;
    const innerW = (w - 4) * pct;

    // Background
    ctx.fillStyle = '#1a1228'; ctx.beginPath(); ctx.roundRect(x, y, w, barH, 4); ctx.fill();
    // HP color
    const hpColor = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    if (flip) ctx.fillRect(x + 2 + (w-4) - innerW, y + 2, innerW, barH - 4);
    else      ctx.fillRect(x + 2,                   y + 2, innerW, barH - 4);
    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, barH, 4); ctx.stroke();
    // HP text
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(char.hp)} / ${char.maxHp}`, x + w/2, y + barH/2 + 4);
    // Name
    ctx.font = 'bold 13px Cinzel'; ctx.fillStyle = char.accentColor; ctx.textAlign = flip ? 'right' : 'left';
    ctx.fillText(char.name, flip ? x + w : x, y - 5);
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

        // Box bg
        ctx.fillStyle = '#0f0a20'; ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 4); ctx.fill();

        // Ready fill
        if (cd === 0) {
            ctx.fillStyle = 'rgba(40,20,80,0.8)'; ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 4); ctx.fill();
        }

        // Cooldown overlay (top to bottom drain)
        if (cd > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            const oH = boxH * cdPct;
            ctx.fillRect(bx, by, boxW, oH);
        }

        // Active glow
        if (isActive) {
            ctx.save(); ctx.shadowColor = sk.color; ctx.shadowBlur = 12;
            ctx.strokeStyle = sk.color; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 4); ctx.stroke();
            ctx.restore();
        } else {
            ctx.strokeStyle = cd === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 4); ctx.stroke();
        }

        // Icon / key label
        ctx.fillStyle = cd === 0 ? '#fff' : '#888';
        ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center';
        ctx.fillText(sk.icon || sk.key, bx + boxW/2, by + boxH/2 + 6);

        // Cooldown seconds
        if (cd > 0) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter';
            ctx.fillText(Math.ceil(cd/60)+'s', bx + boxW/2, by + boxH - 4);
        }

        // Skill name tooltip on top
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '9px Inter';
        ctx.fillText(sk.name.split(' ')[0], bx + boxW/2, by + boxH + 10);
    });
}

function drawHUD(ctx, p1, p2, timerFrames, round, p1Wins, p2Wins) {
    const barW = 380;
    const barX1 = 30, barX2 = CANVAS_W - barX1 - barW;

    // HP bars
    drawHPBar(ctx, p1, barX1, 12, barW, false);
    drawHPBar(ctx, p2, barX2, 12, barW, true);

    // Cooldowns
    drawCooldowns(ctx, p1, barX1, 44, false);
    drawCooldowns(ctx, p2, barX2 + barW, 44, true);

    // Timer
    const secs = Math.ceil(timerFrames / 60);
    ctx.font = `bold ${secs <= 10 ? 42 : 36}px Cinzel`;
    ctx.textAlign = 'center';
    ctx.fillStyle = secs <= 10 ? '#ff4444' : '#ffffff';
    ctx.shadowColor = secs <= 10 ? '#ff0000' : '#8855ff';
    ctx.shadowBlur = 15;
    ctx.fillText(secs, CANVAS_W / 2, 36);
    ctx.shadowBlur = 0;

    // Round dots
    ctx.font = 'bold 13px Inter';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`Round ${round}`, CANVAS_W / 2, 56);

    // Win dots (P1 left, P2 right of timer)
    for (let i = 0; i < 2; i++) {
        const filled1 = i < p1Wins, filled2 = i < p2Wins;
        const dx = 28;
        ctx.beginPath();
        ctx.arc(CANVAS_W/2 - 60 - i*dx, 38, 7, 0, Math.PI*2);
        ctx.fillStyle = filled1 ? '#f0a500' : 'rgba(255,255,255,0.2)'; ctx.fill();
        ctx.beginPath();
        ctx.arc(CANVAS_W/2 + 60 + i*dx, 38, 7, 0, Math.PI*2);
        ctx.fillStyle = filled2 ? '#ff6b6b' : 'rgba(255,255,255,0.2)'; ctx.fill();
    }

    // Key hints (small, bottom)
    ctx.font = '11px Inter'; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.textAlign = 'left';
    ctx.fillText('P1: WASD move | F G H T skills', 14, CANVAS_H - 8);
    ctx.textAlign = 'right';
    ctx.fillText('P2: Arrows move | Num 1 2 3 4 skills', CANVAS_W - 14, CANVAS_H - 8);
}

// ── Loading Screen ───────────────────────────────────────────
function drawLoading(ctx, progress, t) {
    ctx.fillStyle = '#030310'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    title(ctx, 'HERO CLASH', CANVAS_W/2, CANVAS_H/2 - 50, 72, t);

    // Progress bar
    const bw = 400, bh = 8, bx = (CANVAS_W-bw)/2, by = CANVAS_H/2 + 20;
    ctx.fillStyle = '#1a1228'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
    ctx.fillStyle = '#8855ff'; ctx.beginPath(); ctx.roundRect(bx, by, bw*progress, bh, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '14px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Loading…', CANVAS_W/2, by + 30);
}

// ── Main Menu ────────────────────────────────────────────────
function drawMainMenu(ctx, mx, my, t) {
    // Background
    const bg = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 50, CANVAS_W/2, CANVAS_H/2, 600);
    bg.addColorStop(0,'#1a0a3a'); bg.addColorStop(1,'#030310');
    ctx.fillStyle = bg; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    title(ctx, '⚔  HERO CLASH  ⚔', CANVAS_W/2, 180, 68, t);

    ctx.font = '16px Inter'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,180,255,0.55)';
    ctx.fillText('2D Fighting Game — Use character skills to dominate your opponent', CANVAS_W/2, 240);

    const cx = CANVAS_W/2, bw = 240, bh = 54;
    const btns = {
        play: btn(ctx,'▶  PLAY',  cx-bw/2, 290, bw, bh, isOver(mx,my, cx-bw/2,290,bw,bh), '#7744ee'),
        shop: btn(ctx,'🛒  SHOP', cx-bw/2, 360, bw, bh, isOver(mx,my, cx-bw/2,360,bw,bh), '#d4ac0d'),
    };

    // Version
    ctx.font='12px Inter'; ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.textAlign='center';
    ctx.fillText('v1.0  |  P1: WASD+FGHT  |  P2: Arrows+Num1234', CANVAS_W/2, CANVAS_H-16);

    return btns;
}

// ── Character Select ─────────────────────────────────────────
function drawCharSelect(ctx, sel, mx, my) {
    ctx.fillStyle='#080618'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    ctx.font='bold 32px Cinzel'; ctx.textAlign='center'; ctx.fillStyle='#c0a0ff';
    ctx.fillText('SELECT YOUR FIGHTER', CANVAS_W/2, 46);

    const chars  = Object.keys(CHAR_DEFS);
    const sides  = [{ label:'P1', cx:CANVAS_W*0.25, color:'#f0a500' }, { label:'P2', cx:CANVAS_W*0.75, color:'#ff6b6b' }];

    const btns = {};

    sides.forEach((side, pi) => {
        const selected = pi === 0 ? sel.p1 : sel.p2;

        ctx.font='bold 14px Inter'; ctx.textAlign='center'; ctx.fillStyle=side.color;
        ctx.fillText(`PLAYER ${pi+1}`, side.cx, 82);

        // Character cards
        chars.forEach((ctype, ci) => {
            const def = CHAR_DEFS[ctype];
            const skin = SKINS[ctype][getEquipped(ctype)];
            const cardW=220, cardH=160;
            const cx = side.cx - cardW/2 + (ci - chars.length/2 + 0.5)*240;
            const cy = 110;
            const hover = isOver(mx, my, cx, cy, cardW, cardH);
            const isSelected = selected === ctype;

            ctx.fillStyle = isSelected ? 'rgba(120,60,255,0.35)' : hover ? 'rgba(80,40,160,0.25)' : 'rgba(20,10,40,0.7)';
            ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, 8); ctx.fill();
            ctx.strokeStyle = isSelected ? side.color : hover ? 'rgba(120,60,255,0.6)' : 'rgba(80,50,120,0.4)';
            ctx.lineWidth = isSelected ? 2.5 : 1.5;
            ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, 8); ctx.stroke();

            // Character preview (rectangle)
            const cw=def.width*0.7, ch=def.height*0.7, pcx=cx+cardW/2, pcy=cy+80;
            ctx.fillStyle = skin.primary; ctx.fillRect(pcx-cw/2, pcy-ch/2, cw, ch);
            ctx.strokeStyle = skin.accent; ctx.lineWidth=2; ctx.strokeRect(pcx-cw/2, pcy-ch/2, cw, ch);

            ctx.font='bold 16px Cinzel'; ctx.textAlign='center'; ctx.fillStyle='#fff';
            ctx.fillText(def.name, cx+cardW/2, cy+140);
            ctx.font='11px Inter'; ctx.fillStyle='rgba(200,180,255,0.6)';
            ctx.fillText(def.title, cx+cardW/2, cy+158);

            if (!btns[`p${pi+1}`]) btns[`p${pi+1}`] = {};
            btns[`p${pi+1}`][ctype] = { x:cx, y:cy, w:cardW, h:cardH };
        });

        // Selected character info
        if (selected) {
            const def = CHAR_DEFS[selected];
            ctx.font='13px Inter'; ctx.textAlign='center';
            ctx.fillStyle='rgba(200,180,255,0.7)';
            def.desc.split('\n').forEach((line, li) => ctx.fillText(line, side.cx, 295 + li*18));

            // Skills list
            ctx.font='bold 11px Inter'; ctx.fillStyle='rgba(255,255,255,0.5)';
            ctx.fillText('SKILLS:', side.cx, 345);
            def.skills.forEach((sid, si) => {
                const sk = SKILL_DEFS[sid];
                ctx.fillStyle = sk.color; ctx.font='11px Inter';
                ctx.fillText(`${sk.icon} ${sk.name}: ${sk.desc}`, side.cx, 362 + si*14);
            });
        }
    });

    // Difficulty
    ctx.font='bold 14px Inter'; ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText('DIFFICULTY (vs AI)', CANVAS_W/2, 290);
    const diffs = ['easy','medium','hard'];
    diffs.forEach((d, di) => {
        const dw=120,dh=38, dx=CANVAS_W/2-180+di*190, dy=300;
        const isSelD = sel.difficulty === d;
        const hov    = isOver(mx,my,dx,dy,dw,dh);
        const dc     = d==='easy'?'#2ecc71':d==='medium'?'#f39c12':'#e74c3c';
        ctx.fillStyle = isSelD?dc+'55':hov?dc+'33':'rgba(30,20,50,0.7)';
        ctx.beginPath(); ctx.roundRect(dx,dy,dw,dh,6); ctx.fill();
        ctx.strokeStyle = isSelD?dc:hov?dc+'88':'rgba(100,80,140,0.4)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(dx,dy,dw,dh,6); ctx.stroke();
        ctx.fillStyle='#fff'; ctx.font='bold 14px Inter';
        ctx.fillText(AI_DIFFS[d].label, dx+dw/2, dy+dh/2+5);
        btns[`diff_${d}`] = {x:dx,y:dy,w:dw,h:dh};
    });

    // Map select
    ctx.font='bold 14px Inter'; ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText('MAP', CANVAS_W/2, 365);
    MAPS.forEach((map,mi) => {
        const mw=130,mh=32,mx2=CANVAS_W/2-280+mi*150,my2=372;
        const isSelM = sel.mapId===map.id;
        const hov    = isOver(mx,my,mx2,my2,mw,mh);
        ctx.fillStyle = isSelM?'rgba(120,60,255,0.4)':hov?'rgba(80,40,160,0.25)':'rgba(20,10,40,0.7)';
        ctx.beginPath(); ctx.roundRect(mx2,my2,mw,mh,5); ctx.fill();
        ctx.strokeStyle=isSelM?'#8855ff':hov?'rgba(120,60,255,0.5)':'rgba(80,50,120,0.3)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(mx2,my2,mw,mh,5); ctx.stroke();
        ctx.fillStyle='#fff'; ctx.font='12px Inter'; ctx.fillText(map.name, mx2+mw/2, my2+mh/2+4);
        btns[`map_${map.id}`]={x:mx2,y:my2,w:mw,h:mh};
    });

    // Ready button (if both selected)
    if (sel.p1 && sel.p2) {
        const rx=CANVAS_W/2-130,ry=430,rw=260,rh=52;
        btns.ready = btn(ctx,'⚔  FIGHT!',rx,ry,rw,rh,isOver(mx,my,rx,ry,rw,rh),'#f0a500');
    }
    // Back
    btns.back = btn(ctx,'← Back', 20, CANVAS_H-54, 100,38, isOver(mx,my,20,CANVAS_H-54,100,38),'#555');

    return btns;
}

// ── Round End overlay ────────────────────────────────────────
function drawRoundEnd(ctx, winnerLabel, winnerColor, round) {
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    ctx.font='bold 52px Cinzel'; ctx.textAlign='center';
    ctx.fillStyle=winnerColor; ctx.shadowColor=winnerColor; ctx.shadowBlur=30;
    ctx.fillText(`Round ${round}`, CANVAS_W/2, CANVAS_H/2-30);
    ctx.font='bold 34px Cinzel'; ctx.fillStyle='#fff'; ctx.shadowBlur=0;
    ctx.fillText(winnerLabel, CANVAS_W/2, CANVAS_H/2+20);
}

// ── Game Over ────────────────────────────────────────────────
function drawGameOver(ctx, winnerLabel, winnerColor, p1Wins, p2Wins, goldEarned, mx, my) {
    ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    ctx.font='bold 58px Cinzel'; ctx.textAlign='center';
    ctx.fillStyle=winnerColor; ctx.shadowColor=winnerColor; ctx.shadowBlur=30;
    ctx.fillText('⚔ VICTORY ⚔', CANVAS_W/2, 180);

    ctx.font='bold 32px Cinzel'; ctx.fillStyle='#fff'; ctx.shadowBlur=0;
    ctx.fillText(winnerLabel, CANVAS_W/2, 240);

    ctx.font='24px Inter'; ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.fillText(`Score: ${p1Wins} — ${p2Wins}`, CANVAS_W/2, 290);

    if (goldEarned > 0) {
        ctx.font='bold 20px Inter'; ctx.fillStyle='#f0a500';
        ctx.fillText(`+ ${goldEarned} Gold Earned!`, CANVAS_W/2, 330);
    }

    const btns = {
        again: btn(ctx,'▶ Play Again', CANVAS_W/2-260, 390, 240, 52, isOver(mx,my,CANVAS_W/2-260,390,240,52),'#7744ee'),
        shop:  btn(ctx,'🛒 Shop',       CANVAS_W/2+20,  390, 240, 52, isOver(mx,my,CANVAS_W/2+20,390,240,52),'#d4ac0d'),
        menu:  btn(ctx,'← Main Menu',  CANVAS_W/2-120, 460, 240, 42, isOver(mx,my,CANVAS_W/2-120,460,240,42),'#555'),
    };
    return btns;
}

// ── Shop ─────────────────────────────────────────────────────
function drawShop(ctx, shopState, mx, my) {
    ctx.fillStyle='#080618'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

    ctx.font='bold 36px Cinzel'; ctx.textAlign='center'; ctx.fillStyle='#f0a500';
    ctx.fillText('🛒  SHOP', CANVAS_W/2, 50);

    ctx.font='bold 20px Inter'; ctx.fillStyle='#f0a500'; ctx.textAlign='center';
    ctx.fillText(`💰 ${getGold()} Gold`, CANVAS_W/2, 82);

    // Char tabs
    const tabs  = Object.keys(CHAR_DEFS);
    const btns  = {};
    tabs.forEach((ctype, ti) => {
        const tw=200, th=40, tx=CANVAS_W/2-220+ti*230, ty=104;
        const isActive = shopState.tab === ctype;
        const hov = isOver(mx,my,tx,ty,tw,th);
        ctx.fillStyle = isActive?'rgba(120,60,255,0.4)':hov?'rgba(80,40,160,0.25)':'rgba(20,10,40,0.7)';
        ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,6); ctx.fill();
        ctx.strokeStyle=isActive?'#8855ff':'rgba(80,50,120,0.4)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,6); ctx.stroke();
        ctx.fillStyle=isActive?'#fff':'rgba(200,180,255,0.6)'; ctx.font='bold 16px Cinzel'; ctx.textAlign='center';
        ctx.fillText(CHAR_DEFS[ctype].name, tx+tw/2, ty+th/2+5);
        btns[`tab_${ctype}`]={x:tx,y:ty,w:tw,h:th};
    });

    // Skin grid
    const skins  = SKINS[shopState.tab];
    const equipped = getEquipped(shopState.tab);
    skins.forEach((sk, si) => {
        const cols = 2;
        const cardW=240, cardH=160, pad=30;
        const col=si%cols, row=Math.floor(si/cols);
        const cx=CANVAS_W/2-cardW-pad/2+col*(cardW+pad);
        const cy=168+row*(cardH+20);
        const owned = isSkinOwned(shopState.tab, si);
        const isEq  = equipped===si;
        const hov   = isOver(mx,my,cx,cy,cardW,cardH);

        ctx.fillStyle = isEq?'rgba(100,50,200,0.4)':hov?'rgba(60,30,120,0.3)':'rgba(20,10,40,0.7)';
        ctx.beginPath(); ctx.roundRect(cx,cy,cardW,cardH,8); ctx.fill();
        ctx.strokeStyle=isEq?sk.accent:owned?'rgba(100,80,140,0.5)':'rgba(60,40,80,0.3)'; ctx.lineWidth=isEq?2:1;
        ctx.beginPath(); ctx.roundRect(cx,cy,cardW,cardH,8); ctx.stroke();

        // Preview box
        const pw=50,ph=70,px2=cx+30,py2=cy+45;
        ctx.fillStyle=sk.primary; ctx.fillRect(px2,py2,pw,ph);
        ctx.strokeStyle=sk.accent; ctx.lineWidth=2; ctx.strokeRect(px2,py2,pw,ph);

        ctx.font='bold 15px Inter'; ctx.textAlign='left'; ctx.fillStyle='#fff';
        ctx.fillText(sk.name, cx+95, cy+55);

        if (isEq) {
            ctx.font='bold 12px Inter'; ctx.fillStyle=sk.accent;
            ctx.fillText('✓ EQUIPPED', cx+95, cy+78);
        } else if (owned) {
            const eb=btn(ctx,'Equip',cx+95,cy+70,110,30,hov,sk.accent);
            btns[`equip_${shopState.tab}_${si}`]={x:cx+95,y:cy+70,w:110,h:30};
        } else {
            const canAfford = getGold()>=sk.price;
            const eb=btn(ctx,`Buy ${sk.price}g`,cx+95,cy+70,130,30,hov&&canAfford, canAfford?'#f0a500':'#666');
            if (canAfford) btns[`buy_${shopState.tab}_${si}`]={x:cx+95,y:cy+70,w:130,h:30};
            if (!canAfford){ctx.font='11px Inter';ctx.fillStyle='rgba(255,100,100,0.7)';ctx.fillText('Not enough gold',cx+95,cy+108);}
        }
    });

    btns.back = btn(ctx,'← Back', 20, CANVAS_H-54, 120,40, isOver(mx,my,20,CANVAS_H-54,120,40),'#555');
    return btns;
}

// ── Pause overlay ────────────────────────────────────────────
function drawPaused(ctx, mx, my) {
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    ctx.font='bold 52px Cinzel'; ctx.textAlign='center'; ctx.fillStyle='#fff';
    ctx.fillText('PAUSED', CANVAS_W/2, CANVAS_H/2-40);
    const btns = {
        resume: btn(ctx,'▶ Resume',   CANVAS_W/2-130, CANVAS_H/2+10, 260,50, isOver(mx,my,CANVAS_W/2-130,CANVAS_H/2+10,260,50),'#7744ee'),
        quit:   btn(ctx,'✕ Quit',     CANVAS_W/2-130, CANVAS_H/2+70, 260,50, isOver(mx,my,CANVAS_W/2-130,CANVAS_H/2+70,260,50),'#e74c3c'),
    };
    return btns;
}
