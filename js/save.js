// save.js — localStorage persistence (gold, owned skins, selected skins)

const Save = {
    _key: 'heroClash_v1',

    defaults() {
        return {
            gold: 0,
            owned: { warrior: [0], assassin: [0] },   // indices of owned skins
            equipped: { warrior: 0, assassin: 0 },     // equipped skin index
        };
    },

    load() {
        try {
            const raw = localStorage.getItem(this._key);
            if (!raw) return this.defaults();
            const parsed = JSON.parse(raw);
            
            // Bảo vệ nếu data cũ không có các trường mới (equipped, owned)
            if (!parsed.equipped) parsed.equipped = this.defaults().equipped;
            if (!parsed.owned) parsed.owned = this.defaults().owned;
            
            return { ...this.defaults(), ...parsed };
        } catch { return this.defaults(); }
    },


    save(data) {
        try { localStorage.setItem(this._key, JSON.stringify(data)); } catch {}
    },
};

// Live game save state (loaded once at startup, mutated during play)
let saveData = Save.load();

function getGold()              { return saveData.gold; }
function addGold(amount)        { saveData.gold += amount; Save.save(saveData); }
function spendGold(amount)      { saveData.gold = Math.max(0, saveData.gold - amount); Save.save(saveData); }
function isSkinOwned(type, idx) { return saveData.owned[type]?.includes(idx); }
function buySkin(type, idx)     { if (!saveData.owned[type]) saveData.owned[type] = [0]; saveData.owned[type].push(idx); Save.save(saveData); }
function equipSkin(type, idx)   { saveData.equipped[type] = idx; Save.save(saveData); }
function getEquipped(type)      { 
    if (!saveData || !saveData.equipped) return 0;
    return saveData.equipped[type] ?? 0; 
}

