import { Bowler } from './bowler';

export class Batsman {
    name: string;
    balls: string[] = [];
    score: number;

    faced: number;
    extras: number;

    wickets: number;

    strikeRate: number;

    bowlers: Bowler[] = [];
    
    constructor(init?: Partial<Batsman>) {
        Object.assign(this, init);
    }

    initialize(): void {
        this.score = 0;
        this.faced = 0;
        this.extras = 0;

        this.wickets = 0;
        this.strikeRate = 0;
    }
}