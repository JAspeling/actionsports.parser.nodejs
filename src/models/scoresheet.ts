import { Innings } from './innings';
import { Over } from './over';
import { Team } from './team';

export class Scoresheet {

    teams: Team[] = [];

    innings1: Innings = new Innings();
    innings2: Innings = new Innings();

    constructor(init?: Partial<Scoresheet>) {
        Object.assign(this, init);
    }
}
