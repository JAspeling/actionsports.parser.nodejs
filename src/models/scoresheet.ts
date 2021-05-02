import { Innings } from './innings';
import { SkinData } from './skin';

export class Scoresheet {
    skinsData: SkinData[] = [];

    innings: Innings[] = [
        new Innings(),
        new Innings()
    ];

    constructor(init?: Partial<Scoresheet>) {
        Object.assign(this, init);
    }
}
