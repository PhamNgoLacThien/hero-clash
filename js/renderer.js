/* ============================================================
   renderer.js — All Canvas Drawing Functions
   Handles background, characters, effects, and ground.
   ============================================================ */

// ── Stars (generated once, animated each frame) ────────────
let stars = [];

function initStars(canvasW, canvasH) {
    stars = [];
    for (let i = 0; i < 160; i++) {
        stars.push({
            x:         Math.random() * canvasW,
            y:         Math.random() * canvasH * 0.7,
            size:      Math.random() * 1.6 + 0.3,
            baseAlpha: Math.random() * 0.55 + 0.2,
            phase:     Math.random() * Math.PI * 2,
            speed:     Math.random() * 0.025 + 0.008,
        });
    }
}

// ── Background ─────────────────────────────────────────────
function drawBackground(ctx, canvasW, canvasH) {
    const sky = ctx.createLinearGradient(0, 0, 0, canvasH * 0.9);
    sky.addColorStop(0,    '#040412');
    sky.addColorStop(0.35, '#0a0a28');
    sky.addColorStop(0.75, '#160830');
    sky.addColorStop(1,    '#1e0a3c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Twinkling stars
    stars.forEach(s => {
        s.phase += s.speed;
        const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 228, 196, ${alpha})`;
        ctx.fill();
    });

    // Moon
    const moonX = canvasW * 0.83, moonY = 72, moonR = 36;
    ctx.save();
    const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.2);
    halo.addColorStop(0,   'rgba(255,245,180,0.18)');
    halo.addColorStop(0.5, 'rgba(220,200,120,0.06)');
    halo.addColorStop(1,   'rgba(200,170,80,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(252,242,190,0.92)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 12, moonY - 4, moonR - 4, 0, Math.PI * 2);
    ctx.fillStyle = '#09091e';
    ctx.fill();
    ctx.restore();

    // Mountain silhouettes
    ctx.fillStyle = 'rgba(16,8,36,0.82)';
    ctx.beginPath();
    ctx.moveTo(0,       canvasH * 0.58);
    ctx.lineTo(90,      canvasH * 0.38);
    ctx.lineTo(190,     canvasH * 0.52);
    ctx.lineTo(310,     canvasH * 0.32);
    ctx.lineTo(430,     canvasH * 0.48);
    ctx.lineTo(560,     canvasH * 0.28);
    ctx.lineTo(680,     canvasH * 0.44);
    ctx.lineTo(820,     canvasH * 0.35);
    ctx.lineTo(950,     canvasH * 0.50);
    ctx.lineTo(1080,    canvasH * 0.38);
    ctx.lineTo(canvasW, canvasH * 0.58);
    ctx.closePath();
    ctx.fill();
}

// ── Ground ─────────────────────────────────────────────────
function drawGround(ctx, canvasW, canvasH, groundY) {
    const glow = ctx.createLinearGradient(0, groundY - 30, 0, groundY + 5);
    glow.addColorStop(0, 'rgba(130,60,255,0)');
    glow.addColorStop(1, 'rgba(130,60,255,0.28)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, groundY - 30, canvasW, 34);

    const ground = ctx.createLinearGradient(0, groundY, 0, canvasH);
    ground.addColorStop(0,    '#221535');
    ground.addColorStop(0.08, '#160e28');
    ground.addColorStop(1,    '#0a0818');
    ctx.fillStyle = ground;
    ctx.fillRect(0, groundY, canvasW, canvasH - groundY);

    // Glowing edge
    ctx.save();
    ctx.shadowColor = 'rgba(160,80,255,1)';
    ctx.shadowBlur  = 18;
    ctx.strokeStyle = 'rgba(170,90,255,0.9)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvasW, groundY);
    ctx.stroke();
    ctx.restore();

    // Rune pattern
    ctx.strokeStyle = 'rgba(140,70,255,0.18)';
    ctx.lineWidth   = 1;
    for (let rx = 60; rx < canvasW; rx += 110) {
        ctx.beginPath();
        ctx.moveTo(rx,      groundY + 12);
        ctx.lineTo(rx + 30, groundY + 4);
        ctx.lineTo(rx + 60, groundY + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx + 30, groundY + 4);
        ctx.lineTo(rx + 30, groundY + 22);
        ctx.stroke();
    }
}

// ── Draw Character — simple colored rectangle ──────────────
function drawCharacter(ctx, char, groundY) {
    // Drop shadow
    const heightAbove = groundY - char.feetY;
        char.width * 0.38 * scale, 7 * scale,
        0, 0, Math.PI * 2
    );
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fill();
    ctx.restore();
}

// ── Warrior Drawing ────────────────────────────────────────
// Always drawn facing RIGHT; flip transform handles left-facing.
function drawWarrior(ctx, char) {
    const x = char.x;
    const y = char.y + char.idleBob;
    const w = char.width;
    const h = char.height;

    ctx.save();

    // Flip horizontally if facing left
    if (!char.facingRight) {
        ctx.translate(char.centerX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-char.centerX, 0);
    }

    // ── Legs (animated when running) ──
    const legSwing = char.state === 'running'
        ? Math.sin(char.stepTimer * 0.22) * 9
        : 0;

    ctx.fillStyle = char.darkColor;
    // Left leg
    ctx.fillRect(x + 9,      y + h - 28, 17, 20 + legSwing);
    // Right leg (opposite phase)
    ctx.fillRect(x + w - 26, y + h - 28, 17, 20 - legSwing);

    // Boots
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(x + 7,      y + h - 10, 21, 10);
    ctx.fillRect(x + w - 28, y + h - 10, 21, 10);
    // Boot highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + 8,      y + h - 10, 19, 3);
    ctx.fillRect(x + w - 27, y + h - 10, 19, 3);

    // ── Shield (left/front side) ──
    ctx.fillStyle = '#6b4e12';
    ctx.fillRect(x - 8, y + 22, 14, 38);
    // Shield face
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x - 7, y + 23, 12, 36);
    // Shield border
    ctx.strokeStyle = '#d4ac0d';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 7, y + 23, 12, 36);
    // Shield emblem (gold circle)
    ctx.fillStyle = '#f0a500';
    ctx.beginPath();
    ctx.arc(x - 1, y + 41, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8';
    ctx.beginPath();
    ctx.arc(x - 2, y + 40, 2, 0, Math.PI * 2);
    ctx.fill();

    // ── Torso ──
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(x + 6, y + 20, w - 12, h - 48);

    // Chest plate
    ctx.fillStyle = '#5b8dd9';
    ctx.fillRect(x + 10, y + 24, w - 20, 24);
    // Chest highlight
    ctx.fillStyle = 'rgba(200, 230, 255, 0.22)';
    ctx.fillRect(x + 12, y + 25, w - 24, 7);
    // Chest detail lines
    ctx.strokeStyle = 'rgba(30, 60, 130, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10 + (w - 20) / 2, y + 24);
    ctx.lineTo(x + 10 + (w - 20) / 2, y + 48);
    ctx.stroke();

    // Shoulder pauldrons
    ctx.fillStyle = '#4a7ac5';
    ctx.fillRect(x + 2,      y + 20, 10, 10);
    ctx.fillRect(x + w - 12, y + 20, 10, 10);

    // ── Sword (right side) ──
    // Handle
    ctx.fillStyle = '#5a3810';
    ctx.fillRect(x + w - 2, y + 30, 7, 12);
    // Cross-guard
    ctx.fillStyle = '#c0a000';
    ctx.fillRect(x + w - 6, y + 30, 14, 5);
    // Blade
    ctx.fillStyle = '#c8d0d8';
    ctx.fillRect(x + w,     y + 10, 5, 22);
    // Blade shine
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + w,     y + 10, 2, 22);
    // Blade tip
    ctx.beginPath();
    ctx.moveTo(x + w,     y + 10);
    ctx.lineTo(x + w + 5, y + 10);
    ctx.lineTo(x + w + 2, y + 2);
    ctx.closePath();
    ctx.fillStyle = '#c8d0d8';
    ctx.fill();

    // ── Helmet ──
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(x + 8, y + 2, w - 16, 20);
    // Helmet top ridge
    ctx.fillStyle = '#2a6bc0';
    ctx.fillRect(x + 8, y + 2, w - 16, 5);
    // Gold crest on top
    ctx.fillStyle = '#f0a500';
    ctx.fillRect(x + (w / 2) - 3, y - 4, 6, 8);
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    // Visor (dark slit)
    ctx.fillStyle = '#0d1a2e';
    ctx.fillRect(x + 11, y + 12, w - 22, 7);
    // Eye glow (blue)
    ctx.fillStyle = 'rgba(80, 180, 255, 0.9)';
    ctx.fillRect(x + 13, y + 13, 9, 5);
    ctx.fillRect(x + w - 22, y + 13, 9, 5);
    // Eye glow bloom
    ctx.save();
    ctx.shadowColor = 'rgba(80, 180, 255, 1)';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = '#80d0ff';
    ctx.fillRect(x + 14, y + 14, 7, 3);
    ctx.fillRect(x + w - 21, y + 14, 7, 3);
    ctx.restore();

    // Cheek guards
    ctx.fillStyle = '#2c5f9e';
    ctx.fillRect(x + 8,      y + 14, 6, 12);
    ctx.fillRect(x + w - 14, y + 14, 6, 12);

    ctx.restore(); // End flip transform
}

// ── Assassin Drawing ────────────────────────────────────────
function drawAssassin(ctx, char) {
    const x = char.x;
    const y = char.y + char.idleBob;
    const w = char.width;
    const h = char.height;

    ctx.save();

    // Flip if facing left
    if (!char.facingRight) {
        ctx.translate(char.centerX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-char.centerX, 0);
    }

    // ── Cape / cloak behind ──
    ctx.fillStyle = '#5a1818';
    ctx.beginPath();
    ctx.moveTo(x + 4,  y + 16);
    ctx.lineTo(x - 8,  y + h - 15);
    ctx.lineTo(x + 10, y + h - 22);
    ctx.closePath();
    ctx.fill();

    // ── Legs ──
    const legSwing = char.state === 'running'
        ? Math.sin(char.stepTimer * 0.24) * 9
        : 0;
    ctx.fillStyle = '#6b1c1c';
    ctx.fillRect(x + 7,      y + h - 28, 13, 20 + legSwing);
    ctx.fillRect(x + w - 20, y + h - 28, 13, 20 - legSwing);

    // Dark boots
    ctx.fillStyle = '#181010';
    ctx.fillRect(x + 5,      y + h - 10, 17, 10);
    ctx.fillRect(x + w - 22, y + h - 10, 17, 10);

    // ── Body ──
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(x + 4, y + 18, w - 8, h - 46);

    // Dark tunic detail
    ctx.fillStyle = char.darkColor;
    ctx.fillRect(x + 6, y + 22, w - 12, 20);
    // Red cloth highlight
    ctx.fillStyle = 'rgba(220, 80, 80, 0.18)';
    ctx.fillRect(x + 8, y + 24, w - 16, 6);
    // Center belt/sash
    ctx.fillStyle = '#3d0a0a';
    ctx.fillRect(x + 4, y + 42, w - 8, 6);
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(x + w / 2 - 4, y + 41, 8, 8);

    // ── Back dagger ──
    ctx.fillStyle = '#808080';
    ctx.fillRect(x - 4, y + 26, 3, 22);
    ctx.fillStyle = '#5a3810';
    ctx.fillRect(x - 5, y + 36, 5, 5);

    // ── Front dagger (right hand) ──
    ctx.fillStyle = '#b0b8c0';
    ctx.fillRect(x + w, y + 24, 4, 26);
    // Dagger blade shine
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + w, y + 24, 2, 26);
    // Dagger guard
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(x + w - 4, y + 32, 12, 4);
    // Dagger handle
    ctx.fillStyle = '#3d0a0a';
    ctx.fillRect(x + w, y + 36, 4, 8);

    // ── Hood ──
    // Hood back shadow
    ctx.fillStyle = '#4a1010';
    ctx.beginPath();
    ctx.arc(x + w / 2 + 3, y + 10, w / 2 + 2, Math.PI, 2 * Math.PI);
    ctx.fillRect(x + 1, y + 8, w + 4, 14);
    ctx.fill();
    // Hood main
    ctx.fillStyle = '#7b241c';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 10, w / 2 - 1, Math.PI, 2 * Math.PI);
    ctx.fillRect(x + 2, y + 9, w - 4, 14);
    ctx.fill();
    // Hood highlight
    ctx.fillStyle = 'rgba(200, 80, 80, 0.15)';
    ctx.fillRect(x + 6, y + 9, w - 12, 4);

    // Face shadow inside hood
    ctx.fillStyle = '#1c0404';
    ctx.fillRect(x + 4, y + 8, w - 8, 16);

    // ── Glowing red eyes ──
    ctx.save();
    ctx.shadowColor = 'rgba(255, 30, 30, 0.9)';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = '#ff3333';
    ctx.beginPath();
    ctx.arc(x + 11, y + 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 11, y + 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur  = 0;
    // Eye core
    ctx.fillStyle = '#ffaaaa';
    ctx.beginPath();
    ctx.arc(x + 11, y + 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 11, y + 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // End flip transform
}

// ── Draw a Character (shadow + body) ──────────────────────
function drawCharacter(ctx, char, groundY) {
    drawShadow(ctx, char, groundY);

    if (char.type === 'warrior') {
        drawWarrior(ctx, char);
    } else {
        drawAssassin(ctx, char);
    }
}

// ── Master Render Function ─────────────────────────────────
function render(ctx, canvasW, canvasH, groundY, characters) {
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawBackground(ctx, canvasW, canvasH);
    drawGround(ctx, canvasW, canvasH, groundY);
    characters.forEach(c => drawCharacter(ctx, c, groundY));
}
