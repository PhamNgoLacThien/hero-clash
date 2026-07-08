/* ============================================================
   renderer.js — All Canvas Drawing Functions
   ============================================================ */

// ── Stars ──────────────────────────────────────────────────
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

    // Stars
    stars.forEach(s => {
        s.phase += s.speed;
        const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,228,196,${alpha})`;
        ctx.fill();
    });

    // Moon
    const moonX = canvasW * 0.83, moonY = 72, moonR = 36;
    ctx.save();
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(252,242,190,0.92)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 12, moonY - 4, moonR - 4, 0, Math.PI * 2);
    ctx.fillStyle = '#09091e';
    ctx.fill();
    ctx.restore();

    // Mountains
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
}

// ── Draw Character — 2 khối chữ nhật đơn giản ─────────────
function drawCharacter(ctx, char, groundY) {
    // Shadow
    const heightAbove = groundY - char.feetY;
    const sScale = Math.max(0.15, 1 - heightAbove / 280);
    ctx.beginPath();
    ctx.ellipse(char.centerX, groundY - 3, char.width * 0.4 * sScale, 6 * sScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.04, 0.25 * sScale)})`;
    ctx.fill();

    // Thân khối màu
    const dy = char.y + char.idleBob;
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(char.x, dy, char.width, char.height);

    // Viền màu accent
    ctx.strokeStyle = char.accentColor;
    ctx.lineWidth   = 3;
    ctx.strokeRect(char.x, dy, char.width, char.height);

    // Mũi tên chỉ hướng (trên đỉnh khối)
    const dir = char.facingRight ? 1 : -1;
    const ax  = char.centerX + dir * char.width * 0.22;
    ctx.fillStyle = char.accentColor;
    ctx.beginPath();
    ctx.moveTo(ax,             dy - 12);
    ctx.lineTo(ax - dir * 9,   dy - 3);
    ctx.lineTo(ax + dir * 9,   dy - 3);
    ctx.closePath();
    ctx.fill();

    // Tên nhân vật
    ctx.fillStyle    = 'rgba(255,255,255,0.85)';
    ctx.font         = 'bold 13px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(char.name, char.centerX, dy + char.height + 6);
}

// ── Master Render ──────────────────────────────────────────
function render(ctx, canvasW, canvasH, groundY, characters) {
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawBackground(ctx, canvasW, canvasH);
    drawGround(ctx, canvasW, canvasH, groundY);
    characters.forEach(c => drawCharacter(ctx, c, groundY));
}
