// data.js — All static game data

// ── Canvas dimensions ──────────────────────────────────────
const CANVAS_W = 1200;
const CANVAS_H = 600;
const GROUND_Y = 508;

// ── Physics ────────────────────────────────────────────────
const PHYSICS = {
    GRAVITY: 0.65, JUMP_FORCE: -15.5,
    MOVE_SPEED: 5.5, FRICTION: 0.72, MAX_FALL: 22,
};

// ── Character definitions ──────────────────────────────────
const CHAR_DEFS = {
    warrior: {
        name: 'Warrior', title: 'The Iron Knight',
        desc: 'Tanky and powerful.\nExcels at sustained combat.',
        width: 58, height: 82, maxHp: 120,
        color: '#3a7bd5', accent: '#f0a500',
        startFacing: true,
        skills: ['heavy_strike','shield_bash','battle_cry','charge'],
        controls: { left:'KeyA', right:'KeyD', jump:'KeyW', s1:'KeyF', s2:'KeyG', s3:'KeyH', s4:'KeyT' },
    },
    assassin: {
        name: 'Assassin', title: 'The Shadow Blade',
        desc: 'Swift and deadly.\nMasters of hit-and-run tactics.',
        width: 44, height: 90, maxHp: 90,
        color: '#c0392b', accent: '#ff6b6b',
        startFacing: false,
        skills: ['quick_slash','shadow_step','poison_blade','death_mark'],
        controls: { left:'ArrowLeft', right:'ArrowRight', jump:'ArrowUp', s1:'Numpad1', s2:'Numpad2', s3:'Numpad3', s4:'Numpad4' },
    },
};

// ── Skill definitions ──────────────────────────────────────
// cooldown / duration in FRAMES (60fps). activeStart/End = hitbox window.
const SKILL_DEFS = {
    heavy_strike: {
        name:'Heavy Strike', key:'F', icon:'⚔',
        damage:28, cooldown:50, duration:32,
        activeStart:12, activeEnd:22,
        hitboxW:85, hitboxH:65, knockX:8, knockY:-5,
        color:'#f0a500', desc:'Powerful sword strike',
    },
    shield_bash: {
        name:'Shield Bash', key:'G', icon:'🛡',
        damage:15, cooldown:90, duration:28,
        activeStart:8, activeEnd:18,
        hitboxW:65, hitboxH:72, knockX:14, knockY:-3,
        color:'#d4ac0d', interrupt:true, desc:'Push back + interrupt enemy skill',
    },
    battle_cry: {
        name:'Battle Cry', key:'H', icon:'🔥',
        damage:0, cooldown:360, duration:60,
        activeStart:0, activeEnd:0,
        hitboxW:0, hitboxH:0, knockX:0, knockY:0,
        color:'#ff4400',
        buff:{ type:'damage', mult:1.5, frames:300 },
        desc:'+50% damage for 5 seconds',
    },
    charge: {
        name:'Charge', key:'T', icon:'💨',
        damage:22, cooldown:180, duration:22,
        activeStart:0, activeEnd:22,
        hitboxW:75, hitboxH:82, knockX:11, knockY:-8,
        color:'#5599ff', dashSpeed:20, desc:'Dash forward dealing damage',
    },
    quick_slash: {
        name:'Quick Slash', key:'1', icon:'⚡',
        damage:9, cooldown:25, duration:28,
        activeStart:4, activeEnd:25,
        hitboxW:68, hitboxH:70, knockX:3, knockY:-2,
        color:'#ff4444', hits:3, hitInterval:7, desc:'3 rapid slashes',
    },
    shadow_step: {
        name:'Shadow Step', key:'2', icon:'👤',
        damage:24, cooldown:150, duration:28,
        activeStart:10, activeEnd:22,
        hitboxW:55, hitboxH:80, knockX:6, knockY:-5,
        color:'#9b59b6', dashSpeed:22, invincible:true, desc:'Dash through enemy + invincible',
    },
    poison_blade: {
        name:'Poison Blade', key:'3', icon:'☠',
        damage:12, cooldown:280, duration:32,
        activeStart:10, activeEnd:22,
        hitboxW:70, hitboxH:75, knockX:4, knockY:-2,
        color:'#2ecc71', poison:{ dps:5, frames:240 }, desc:'Poison enemy for 4 seconds',
    },
    death_mark: {
        name:'Death Mark', key:'4', icon:'💀',
        damage:45, cooldown:900, duration:42,
        activeStart:15, activeEnd:32,
        hitboxW:85, hitboxH:90, knockX:12, knockY:-10,
        color:'#c0392b', execBonus:0.5, desc:'Massive damage. +50% if enemy HP < 30%',
    },
};

// ── Skins ──────────────────────────────────────────────────
const SKINS = {
    warrior: [
        { name:'Steel Knight', primary:'#3a7bd5', accent:'#f0a500', price:0   },
        { name:'Fire Lord',    primary:'#d44000', accent:'#ff8800', price:200  },
        { name:'Shadow King',  primary:'#2a2240', accent:'#9b59b6', price:200  },
        { name:'Gold Emperor', primary:'#8b6914', accent:'#ffd700', price:500  },
    ],
    assassin: [
        { name:'Crimson',      primary:'#c0392b', accent:'#ff6b6b', price:0   },
        { name:'Void Walker',  primary:'#1a0a2e', accent:'#8a2be2', price:200  },
        { name:'White Ghost',  primary:'#909098', accent:'#ffffff', price:200  },
        { name:'Forest Shade', primary:'#1a4420', accent:'#44dd44', price:500  },
    ],
};

// ── Maps ────────────────────────────────────────────────────
const MAPS = [
    {
        id:'arena',   name:'Mystic Arena',
        skyTop:'#040412', skyBot:'#1e0a3c',
        groundFill:'#221535', glowColor:'rgba(130,60,255,0.28)',
        lineColor:'rgba(170,90,255,0.9)', runeColor:'rgba(140,70,255,0.18)',
        platforms:[], lightning:false,
    },
    {
        id:'dojo',    name:'Shadow Dojo',
        skyTop:'#0a0500', skyBot:'#1a0800',
        groundFill:'#2a1500', glowColor:'rgba(200,100,0,0.25)',
        lineColor:'rgba(255,140,0,0.8)', runeColor:'rgba(180,80,0,0.18)',
        platforms:[], lightning:false,
    },
    {
        id:'peak',    name:'Storm Peak',
        skyTop:'#050a14', skyBot:'#0a1e28',
        groundFill:'#102030', glowColor:'rgba(50,150,220,0.25)',
        lineColor:'rgba(100,200,255,0.8)', runeColor:'rgba(60,150,200,0.15)',
        platforms:[], lightning:true, lightInterval:200,
    },
    {
        id:'ruins',   name:'Ancient Ruins',
        skyTop:'#1a0a00', skyBot:'#2a1500',
        groundFill:'#3a2010', glowColor:'rgba(180,120,50,0.22)',
        lineColor:'rgba(200,150,80,0.7)', runeColor:'rgba(160,110,40,0.18)',
        platforms:[
            { x:80,  y:390, w:180, h:16 },
            { x:940, y:390, w:180, h:16 },
        ],
        lightning:false,
    },
];

// ── AI difficulty ──────────────────────────────────────────
const AI_DIFFS = {
    easy:   { label:'Easy',   react:90, skillChance:0.25 },
    medium: { label:'Medium', react:45, skillChance:0.55 },
    hard:   { label:'Hard',   react:18, skillChance:0.85 },
};
