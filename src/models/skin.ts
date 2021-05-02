export class Skin {
    constructor(init?: Partial<Skin>) {
        Object.assign(this, init);
    }
    score: number;
    state: 'win' | 'draw' | 'lose';
    points: number;
}

export class SkinData {
    team: string;
    skins: number[] = [];
    
    constructor(init?: Partial<SkinData>) {
        Object.assign(this, init);
    }
}