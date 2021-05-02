import { Scoresheet } from './scoresheet';

export interface IScoresheetParser {
    parse(url: string): Promise<Scoresheet>;


}