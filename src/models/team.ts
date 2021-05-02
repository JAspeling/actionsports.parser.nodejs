import { Skin } from './skin';

export class Team {
    state: 'win' | 'draw' | 'lose';
    name: string;
    score: number;
    points: number;
    skins: Skin[] = [];


}
