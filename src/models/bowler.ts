export class Bowler {
    name: string;
    balls: string[] = [];
    score: number;
    extras: number;

    wickets: number;

    constructor(init?: Partial<Bowler>) {
        Object.assign(this, init);
    }

    public initialize() {

        this.score = 0;
        this.extras = 0;
        this.wickets = 0;
    }
}