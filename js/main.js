// main.js — State machine + Game loop

// ── Canvas setup ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width = CANVAS_W; canvas.height = CANVAS_H;

function resizeCanvas() {
    // Tính scale giữ tỉ lệ 2:1, fill màn hình tối đa
    const scW = window.innerWidth  / CANVAS_W;
    const scH = window.innerHeight / CANVAS_H;
    const sc  = Math.min(scW, scH);
    const w   = Math.round(CANVAS_W * sc);
    const h   = Math.round(CANVAS_H * sc);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    // Fill phần còn lại bằng background của body
    document.body.style.background = '#030310';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
setupMouse(canvas);
initStars();

// ── States ────────────────────────────────────────────────────
const S = { LOADING:'loading', MENU:'menu', SELECT:'select', BATTLE:'battle',
            ROUND_END:'round_end', GAME_OVER:'game_over', SHOP:'shop', PAUSED:'paused' };

let state     = S.LOADING;
let stateData = {};
let frameT    = 0;       // global frame counter

// UI button registry (updated each frame)
let uiBtns = {};

// ── Transition helper ─────────────────────────────────────────
function goto(newState, data = {}) {
    state     = newState;
    stateData = data;
    if (newState === S.BATTLE)    startBattle(data);
    if (newState === S.ROUND_END) stateData._timer = 130;
}

// ── Battle setup ──────────────────────────────────────────────
function startBattle(data) {
    const { p1Type, p2Type, p2IsAI, difficulty, mapId } = data;
    const def1 = CHAR_DEFS[p1Type], def2 = CHAR_DEFS[p2Type];

    const p1 = new Character(160, GROUND_Y - def1.height, p1Type, false);
    const p2 = new Character(CANVAS_W - 160 - def2.width, GROUND_Y - def2.height, p2Type, p2IsAI);

    // Apply skins
    const sk1 = SKINS[p1Type][getEquipped(p1Type)];
    const sk2 = SKINS[p2Type][getEquipped(p2Type)];
    p1.primaryColor = sk1.primary; p1.accentColor = sk1.accent;
    p2.primaryColor = sk2.primary; p2.accentColor = sk2.accent;

    stateData = {
        ...data, p1, p2,
        timer:  60 * 60,   // 60 seconds
        round:  data.round  || 1,
        p1Wins: data.p1Wins || 0,
        p2Wins: data.p2Wins || 0,
        goldEarned: data.goldEarned || 0,
        map: MAPS.find(m => m.id === mapId) || MAPS[0],
        over: false,
    };
}

// ── Gold reward calculation ────────────────────────────────────
function calcGold(winner, p1, p2, difficulty) {
    if (!winner) return 0;
    const base = { easy:50, medium:100, hard:200 }[difficulty] || 50;
    const winner_ = winner === 'p1' ? p1 : p2;
    const perfect = winner_.hp === winner_.maxHp;
    return base + (perfect ? 50 : 0);
}

// ── Round end logic ────────────────────────────────────────────
function endRound() {
    const { p1, p2, round, p1Wins, p2Wins, difficulty, p2IsAI, goldEarned } = stateData;
    let winner = null;
    if (p1.isDead && !p2.isDead) winner = 'p2';
    else if (!p1.isDead && p2.isDead) winner = 'p1';
    else if (stateData.timer <= 0) winner = p1.hp >= p2.hp ? 'p1' : (p2.hp > p1.hp ? 'p2' : null);

    const nP1W = p1Wins + (winner==='p1'?1:0);
    const nP2W = p2Wins + (winner==='p2'?1:0);
    const matchOver = nP1W >= 2 || nP2W >= 2;

    // Gold: player wins (P2 is AI or player)
    let earnedThisRound = 0;
    if (winner && (!p2IsAI || winner==='p1')) {
        earnedThisRound = calcGold(winner, p1, p2, difficulty);
        addGold(earnedThisRound);
    }

    stateData.over = true;
    goto(S.ROUND_END, {
        ...stateData,
        winner, nP1W, nP2W, matchOver,
        nextRound: round + 1,
        goldEarned: (goldEarned||0) + earnedThisRound,
        winnerLabel: winner === 'p1' ? 'Player 1 Wins!' : winner === 'p2' ? (p2IsAI?'CPU Wins!':'Player 2 Wins!') : 'Draw!',
        winnerColor: winner === 'p1' ? '#f0a500' : winner === 'p2' ? '#ff6b6b' : '#888',
    });
}

// ── Update functions ──────────────────────────────────────────

function updateLoading() {
    stateData.progress = (stateData.progress||0) + 0.012;
    if (stateData.progress >= 1) goto(S.MENU);
}

function updateMenu() {
    if (Mouse.clicked) {
        if (uiBtns.play) { Mouse.clicked=false; goto(S.SELECT, { p1:'warrior', p2:'assassin', p2IsAI:true, difficulty:'medium', mapId:'arena' }); return; }
        if (uiBtns.shop) { Mouse.clicked=false; goto(S.SHOP, { tab:'warrior' }); return; }
    }
}

function updateSelect() {
    if (!Mouse.clicked) return;
    Mouse.clicked = false;
    const { p1, p2, difficulty, mapId } = stateData;

    // Character pick
    for (const ctype of Object.keys(CHAR_DEFS)) {
        if (uiBtns['p1']?.[ctype] && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns['p1'][ctype]))) {
            stateData.p1 = ctype; return;
        }
        if (uiBtns['p2']?.[ctype] && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns['p2'][ctype]))) {
            stateData.p2 = ctype; return;
        }
    }
    // Difficulty
    for (const d of ['easy','medium','hard']) {
        if (uiBtns[`diff_${d}`] && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns[`diff_${d}`]))) {
            stateData.difficulty = d; return;
        }
    }
    // Map
    for (const m of MAPS) {
        if (uiBtns[`map_${m.id}`] && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns[`map_${m.id}`]))) {
            stateData.mapId = m.id; return;
        }
    }
    // Fight
    if (uiBtns.ready && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.ready))) {
        goto(S.BATTLE, { p1Type:stateData.p1, p2Type:stateData.p2, p2IsAI:true, difficulty:stateData.difficulty, mapId:stateData.mapId });
        return;
    }
    // Back
    if (uiBtns.back && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.back))) {
        goto(S.MENU); return;
    }
}

function updateBattle() {
    const { p1, p2, map } = stateData;

    // Pause
    if (isJust('Escape')) { goto(S.PAUSED, { ...stateData, prev: S.BATTLE }); return; }

    // P1 skills
    const p1Ctrl = CHAR_DEFS[p1.type].controls;
    const p1Skls = CHAR_DEFS[p1.type].skills;
    [p1Ctrl.s1,p1Ctrl.s2,p1Ctrl.s3,p1Ctrl.s4].forEach((k,i)=>{ if(isJust(k)) p1.tryUseSkill(p1Skls[i]); });

    // P2 skills or AI
    if (!stateData.p2IsAI) {
        const p2Ctrl = CHAR_DEFS[p2.type].controls;
        const p2Skls = CHAR_DEFS[p2.type].skills;
        [p2Ctrl.s1,p2Ctrl.s2,p2Ctrl.s3,p2Ctrl.s4].forEach((k,i)=>{ if(isJust(k)) p2.tryUseSkill(p2Skls[i]); });
    } else {
        updateAI(p2, p1, stateData.difficulty);
    }

    // Update characters
    p1.update(GROUND_Y, CANVAS_W, p2, map.platforms);
    p2.update(GROUND_Y, CANVAS_W, p1, map.platforms);

    // Hit detection
    checkHitboxes(p1, p2);
    checkHitboxes(p2, p1);

    // Effects
    updateParticles(); updatePopups(); updateScreenShake();
    updateLightning(map.lightning, map.lightInterval);

    // Timer
    if (!stateData.over) stateData.timer--;

    // Check end
    if (!stateData.over && (p1.isDead || p2.isDead || stateData.timer <= 0)) {
        if (p1.isDead)    spawnPopup('K.O!', CANVAS_W/2, CANVAS_H/2-60, '#ff4444', 52);
        else if (stateData.timer <= 0) spawnPopup('TIME!', CANVAS_W/2, CANVAS_H/2-60, '#f0a500', 48);
        endRound();
    }
}

function updateRoundEnd() {
    stateData._timer--;
    if (stateData._timer <= 0) {
        if (stateData.matchOver) {
            goto(S.GAME_OVER, stateData);
        } else {
            // Next round
            goto(S.BATTLE, {
                p1Type: stateData.p1Type || stateData.p1?.type,
                p2Type: stateData.p2Type || stateData.p2?.type,
                p2IsAI: stateData.p2IsAI, difficulty: stateData.difficulty,
                mapId:  stateData.mapId || stateData.map?.id,
                round:  stateData.nextRound,
                p1Wins: stateData.nP1W, p2Wins: stateData.nP2W,
                goldEarned: stateData.goldEarned,
            });
        }
    }
}

function updateGameOver() {
    if (!Mouse.clicked) return;
    Mouse.clicked = false;
    if (uiBtns.again && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.again))) {
        goto(S.SELECT, { p1: stateData.p1Type||stateData.p1?.type, p2: stateData.p2Type||stateData.p2?.type, p2IsAI:true, difficulty:stateData.difficulty||'medium', mapId:stateData.mapId||stateData.map?.id||'arena' }); return;
    }
    if (uiBtns.shop && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.shop))) {
        goto(S.SHOP, { tab:'warrior' }); return;
    }
    if (uiBtns.menu && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.menu))) {
        goto(S.MENU); return;
    }
}

function updateShop() {
    if (!Mouse.clicked) return;
    Mouse.clicked = false;
    // Tab switch
    for (const ctype of Object.keys(CHAR_DEFS)) {
        if (uiBtns[`tab_${ctype}`] && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns[`tab_${ctype}`]))) {
            stateData.tab = ctype; return;
        }
    }
    // Buy / Equip
    for (const [k,r] of Object.entries(uiBtns)) {
        if (!isOver(Mouse.x,Mouse.y,...Object.values(r))) continue;
        if (k.startsWith('buy_')) {
            const [,type,idx] = k.split('_');
            const skin = SKINS[type][+idx];
            if (getGold() >= skin.price) { spendGold(skin.price); buySkin(type,+idx); equipSkin(type,+idx); }
            return;
        }
        if (k.startsWith('equip_')) {
            const [,type,idx] = k.split('_');
            equipSkin(type,+idx); return;
        }
    }
    if (uiBtns.back && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.back))) {
        goto(S.MENU); return;
    }
}

function updatePaused() {
    if (!Mouse.clicked) return;
    Mouse.clicked = false;
    if (uiBtns.resume && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.resume))) { state = S.BATTLE; return; }
    if (uiBtns.quit   && isOver(Mouse.x,Mouse.y,...Object.values(uiBtns.quit)))   { goto(S.MENU); return; }
}

// ── Render functions ──────────────────────────────────────────

function renderBattle() {
    const { p1, p2, map, timer, round, p1Wins, p2Wins } = stateData;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground(ctx, map);
    drawLightning(ctx, CANVAS_W, CANVAS_H);
    drawGround(ctx, map, map.platforms);
    drawChar(ctx, p1);
    drawChar(ctx, p2);
    drawParticles(ctx);
    drawPopups(ctx);
    ctx.restore();
    drawHUD(ctx, p1, p2, timer, round, p1Wins||stateData.nP1W||0, p2Wins||stateData.nP2W||0);
}

// ── Main loop ─────────────────────────────────────────────────
function loop() {
    frameT++;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    switch (state) {
        case S.LOADING:
            updateLoading();
            drawLoading(ctx, stateData.progress||0, frameT);
            break;
        case S.MENU:
            updateMenu();
            uiBtns = drawMainMenu(ctx, Mouse.x, Mouse.y, frameT);
            break;
        case S.SELECT:
            updateSelect();
            uiBtns = drawCharSelect(ctx, stateData, Mouse.x, Mouse.y);
            break;
        case S.BATTLE:
            updateBattle();
            renderBattle();
            break;
        case S.ROUND_END:
            updateRoundEnd();
            renderBattle();   // Show the battle frozen behind
            drawRoundEnd(ctx, stateData.winnerLabel, stateData.winnerColor, stateData.round);
            break;
        case S.GAME_OVER:
            updateGameOver();
            ctx.fillStyle='#08061a'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
            drawBackground(ctx, stateData.map||MAPS[0]);
            uiBtns = drawGameOver(ctx, stateData.winnerLabel, stateData.winnerColor,
                stateData.nP1W||0, stateData.nP2W||0, stateData.goldEarned||0, Mouse.x, Mouse.y);
            break;
        case S.SHOP:
            updateShop();
            uiBtns = drawShop(ctx, stateData, Mouse.x, Mouse.y);
            break;
        case S.PAUSED:
            updatePaused();
            renderBattle();
            uiBtns = drawPaused(ctx, Mouse.x, Mouse.y);
            break;
    }

    Mouse.clicked = false;
    requestAnimationFrame(loop);
}

loop();
