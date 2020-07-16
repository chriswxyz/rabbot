type GachaBall = {
    gold: number;
    xp: number;
    items: GachaItem[]
}

type Consumable = {
    title: string;
    description: string;
};

type Weapon = {
    title: string;
    description: string;
};

type GachaItem = Consumable | Weapon;

export function crankGacha(): GachaBall {
    const gold = getGold();
    const xp = getXp();
    const items = pick(gachaItems, 3);

    return { gold, xp, items };
}

function getGold() {
    return Math.floor(Math.random() * 10);
}

function getXp() {
    return Math.floor(Math.random() * 100);
}

export function sample<T>(arr: T[]) {
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}

export function pick<T>(arr: T[], n: number): T[] {
    const res: T[] = [];
    for (let i = 0; i < n; i++) {
        let item = sample(arr);
        while (res.some(x => x == item)) {
            item = sample(arr);
        }
        res.push(item);
    }
    return res;
}


const gachaItems: GachaItem[] = [
    { title: 'Can of Dr. Pepper', description: 'A delicious beverage containing all 23 mysterious ingredients.' },
    { title: 'Health Potion', description: '' },
    { title: 'Taser', description: '' },
    { title: 'Deck of Playing Cards', description: '' },
    { title: 'Parachute Pants', description: '' },
    { title: 'Log', description: '' },
    { title: 'Bone Hammer', description: '' },
    { title: 'Canadian Flag', description: '' },
    { title: 'HORI Real Arcade Pro. 4 Premium VLX Arcade Stick', description: '' },
    { title: 'Bootleg Dragonball Z VHS', description: '' },
    { title: 'Bag of Cheetos', description: '' },
    { title: '55 Gallon Drum of Oil', description: '' }
]