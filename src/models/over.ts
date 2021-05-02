import { Batsman } from './batsman';

export class Over {
    index: number;
    bowler: string;
    batsman1: Batsman = new Batsman();
    batsman2: Batsman = new Batsman();

    wickets: number = 0;
    runs: number = 0;
    extras: number = 0;
    wides: number = 0;
    legside: number = 0;
    noBalls: number = 0;
    stumps: number = 0;
    bowled: number = 0;
    catches: number = 0;
    mancad: number = 0;
    runout: number = 0;
    ballCount: number = 0;
    balls: string[] = [];

    
    constructor(init?: Partial<Over>) {
        Object.assign(this, init);
    }
}