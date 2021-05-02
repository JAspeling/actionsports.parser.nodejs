import { Bowler } from './bowler';

export class Batsman {
    name: string;
    balls: string[] = [];
    score: number = 0;

    faced: number = 0;
    extras: number = 0;

    wickets: number = 0;

    strikeRate: number = 0;

    bowlers: Bowler[];
    
    constructor(init?: Partial<Batsman>) {
        Object.assign(this, init);
    }
}