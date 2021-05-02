export class Bowler {
    name: string;
    balls: string[] = [];
    score: number = 0;
    extras: number = 0;

    wickets: number = 0;

    constructor(init?: Partial<Bowler>) {
        Object.assign(this, init);
    }
}