import { Batsman } from './batsman';
import { Bowler } from './bowler';
import { Over } from './over';

export class Innings {
    overs: Over[] = [];
    batsmen: Batsman[] = [];
    bowlers: Bowler[] = [];
    
    constructor(init?: Partial<Innings>) {
        Object.assign(this, init);
    }
}