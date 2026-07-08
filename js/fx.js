// fx.js — Particles, screen shake, flash effects

// ── Particles ────────────────────────────────────────────────
const particles = [];

function spawnHitParticles(x, y, color, dmg = 10) {
    const count = Math.min(8 + Math.floor(dmg / 4), 20);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: 2 + Math.random() * 3,
            color,
        });
    }
}

function spawnDustParticles(x, y) {
    for (let i = 0; i < 4; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2,
            life: 20,
            maxLife: 20,
            size: 2 + Math.random() * 2,
            color: 'rgba(200,180,255,0.6)',
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x    += p.vx;
        p.y    += p.vy;
        p.vy   += 0.15;          // gravity on particles
        p.vx   *= 0.92;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles(ctx) {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ── Screen Shake ─────────────────────────────────────────────
let shakeIntensity = 0;
let shakeX = 0, shakeY = 0;

function triggerScreenShake(intensity) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
}

function updateScreenShake() {
    if (shakeIntensity > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
        shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
        shakeIntensity *= 0.78;
        if (shakeIntensity < 0.3) { shakeIntensity = 0; shakeX = 0; shakeY = 0; }
    }
}

// ── Pop-up text (KO!, PERFECT!, etc.) ─────────────────────────
const popups = [];

function spawnPopup(text, x, y, color = '#ffffff', size = 36) {
    popups.push({ text, x, y, vy: -3, life: 80, maxLife: 80, color, size });
}

function updatePopups() {
    for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.y    += p.vy;
        p.vy   *= 0.95;
        p.life--;
        if (p.life <= 0) popups.splice(i, 1);
    }
}

function drawPopups(ctx) {
    for (const p of popups) {
        const alpha = Math.min(1, p.life / 20);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font        = `bold ${p.size}px Cinzel, serif`;
        ctx.textAlign   = 'center';
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 20;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
    }
}

// ── Lightning flash (Storm Peak) ─────────────────────────────
let lightningAlpha = 0;
let lightningTimer = 0;

function updateLightning(mapHasLightning, lightInterval) {
    if (!mapHasLightning) { lightningAlpha = 0; return; }
    lightningTimer++;
    if (lightningTimer >= (lightInterval || 200)) {
        lightningTimer = 0;
        lightningAlpha = 0.6;
    }
    lightningAlpha *= 0.85;
}

function drawLightning(ctx, canvasW, canvasH) {
    if (lightningAlpha < 0.01) return;
    ctx.fillStyle = `rgba(180,220,255,${lightningAlpha})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
}
