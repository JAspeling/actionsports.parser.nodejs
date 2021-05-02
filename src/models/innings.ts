import { Over } from './over';

export class Innings {
    overs: Over[] = [];
    
    constructor(init?: Partial<Innings>) {
        Object.assign(this, init);
    }
}