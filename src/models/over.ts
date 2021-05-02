import { Batsman } from './batsman';

export class Over {
    over: number;
    bowler: string;
    batsmen: Batsman[] = [ new Batsman(), new Batsman()];

    wickets: number;
    runs: number;
    extras: number;
    wides: number;
    legside: number;
    noBalls: number;
    stumps: number;
    bowled: number;
    catches: number;
    mancad: number;
    runout: number;
    ballCount: number;
    balls: string[] = [];
    
    constructor(init?: Partial<Over>) {
        Object.assign(this, init);
    }

        public initialize(): void {

            this.wickets = 0;
            this.runs = 0;
            this.extras = 0;
            this.wides = 0;
            this.legside = 0;
            this.noBalls = 0;
            this.stumps = 0;
            this.bowled = 0;
            this.catches = 0;
            this.mancad = 0;
            this.runout = 0;
            this.ballCount = 0;
        }
}