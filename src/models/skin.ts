export class Skin {
    constructor(init?: Partial<Skin>) {
        Object.assign(this, init);
    }
    score: number;
    state: 'win' | 'draw' | 'lose';
    points: number;
}