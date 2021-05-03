import { JSDOM } from 'jsdom';

import { BallHelper } from './helpers';
import { Over } from './over';
import { IScoresheetParser } from './parser.interface';
import { Scoresheet } from './scoresheet';
import { SkinData } from './skin';
import { CustomError } from './traceable-error';

const got = require('got');
const jsdom = require("jsdom");

export class ScoresheetParser implements IScoresheetParser {

    public parse(url: string): Promise<Scoresheet> {


        let scoresheet = new Scoresheet();
        // const urlParams = new URLSearchParams(url);
        const _url = new URL(url);
        const params = new URLSearchParams(_url.search);

        scoresheet.fixtureId = params.get('FixtureId');

        return new Promise((resolve, reject) => {
            got(url).then(response => {
                const dom = new JSDOM(response.body);

                try {
                    this.validate(dom);
                    this.parseSkins(dom, scoresheet);

                    this.parseInnings(dom, scoresheet, 0);
                    this.parseInnings(dom, scoresheet, 1);

                    resolve(scoresheet);
                } catch (error) {
                    reject(error);
                }

            }).catch(err => {
                reject(err.message);
            });
        })
    }

    private validate(dom: JSDOM): void {
        var found = dom.window.document.querySelector('.Summary');

        if (!found) {
            throw new CustomError('Invalid scoresheet url');
        }
    }

    private parseSkins(dom: JSDOM, scoresheet: Scoresheet): void {
        try {
            scoresheet.skinsData.push(dom, this.parseSkinData(dom, 2));
            scoresheet.skinsData.push(dom, this.parseSkinData(dom, 3));
        } catch (error) {
            throw new CustomError('Failed to parse the skins section.', error);
        }
    }

    /**
     * Extracts the information on the skins table
     * @param rowIndex The index on the table for the current team.
     * @returns 
     */
    private parseSkinData(dom: JSDOM, rowIndex: number): SkinData {
        try {
            const result = new SkinData({
                team: this.parseTeamName(dom, rowIndex)
            });

            for (let index = 1; index <= 4; index++) {
                const score: string = dom.window.document.querySelectorAll('.Summary>tbody>tr')[rowIndex].querySelectorAll('td')[index].innerHTML;
                result.skins.push(+score);
            }

            return result;
        } catch (error) {
            throw new CustomError(`Failed to parse skin data for index ${rowIndex}`, error);
        }
    }

    /**
     * Querying the DOM for a team name in the .Summary table.
     * @param dom 
     * @param rowIndex 
     * @returns 
     */
    private parseTeamName(dom: JSDOM, rowIndex: number): string {
        try {
            return dom.window.document.querySelectorAll('.Summary>tbody>tr')[rowIndex].querySelectorAll('td')[0].innerHTML;
        } catch (error) {
            throw new CustomError(`Could not parse the team name for index ${rowIndex}`, error);
        }
    }

    /**
     * Parses the information for an innings.
     * @param scoresheet The scoresheet to add the information to
     * @param inningsIndex The index of the innings
     */
    private parseInnings(dom: JSDOM, scoresheet: Scoresheet, inningsIndex: number): void {
        try {
            const inningsTable: HTMLTableElement = dom.window.document.querySelectorAll('.OversTable')[inningsIndex];
            this.parseBowlers(scoresheet, inningsTable, inningsIndex);
            this.parseBatting(scoresheet, inningsTable, inningsIndex);
        } catch (error) {
            throw new CustomError(`Could not parse the innings for index ${inningsIndex}`, error);
        }
    }

    private parseBowlers(scoresheet: Scoresheet, inningsTable: HTMLTableElement, inningsIndex: number): void {
        // These are the rows containing the following information on the BOWLERS:
        // Over index
        // Bowler name.
        // There should be 4 rows, containing 4 bowlers per row.
        const bowlers: NodeListOf<HTMLTableRowElement> = inningsTable.querySelectorAll('tbody>tr:not(.BallRow):not(.SpacerRow):not(:first-child):not(:last-child)');

        const overs: Over[] = [];
        let currentBowler: number = 0;
        for (let bowler = 0; bowler < bowlers.length; bowler++) {
            const tr: HTMLTableRowElement = bowlers[bowler];

            for (let index = 0; index < tr.cells.length; index++) {
                const td: HTMLTableDataCellElement = tr.cells[index];
                if (td.textContent === 'Total') break;

                if (td.classList.contains('Blank')) {
                    continue;
                }

                if (td.classList.contains('OverNo')) {
                    if (!overs[currentBowler])
                        overs[currentBowler] = new Over();
                    overs[currentBowler].over = +td.textContent?.trim();
                    continue;
                }

                if (td.classList.contains('Bwl')) {
                    overs[currentBowler].bowler = td.textContent?.trim() || 'Unknown';
                    currentBowler++;
                    continue;
                }
            }
        }

        scoresheet.innings[inningsIndex].overs.push(...overs);
    }

    private parseBatting(scoresheet: Scoresheet, inningsTable: HTMLTableElement, inningsIndex: number): void {
        const batsmanRows: NodeListOf<HTMLTableRowElement> = inningsTable.querySelectorAll('tbody>tr.BallRow');

        // This will toggle between 1 and 2.
        let batsmanIndex: number = 1;
        let overIndex: number = 0;
        // let newOver = true;
        let overs = scoresheet.innings[inningsIndex].overs;
        let ballIndex: number = 0;

        // Iterate over all the batters
        for (let batterIndex = 0; batterIndex < batsmanRows.length; batterIndex++) {
            const tr: HTMLTableRowElement = batsmanRows[batterIndex];
            let batsmanName: string = tr.querySelector('.BatsmanCell').textContent.trim();

            // Iterate over the balls of each batter
            for (let index = 0; index < tr.cells.length; index++) {
                const td: HTMLTableDataCellElement = tr.cells[index];
                const currentOver = overs[overIndex];
                const currentBatsman = batsmanIndex === 1 ? currentOver.batsmen[0] : currentOver.batsmen[1];
                currentBatsman.name = batsmanName;

                // Contains the name of the batsman, not interested: already been set. Continue.
                if (td.classList.contains('BatsmanCell')) {
                    continue;
                }

                // Over finished.
                if (td.classList.contains('OverTotalCell')) {
                    // The over index has already been set on the TotalCell, don't want to override that logic.
                    if ((overIndex + 1) % 4 !== 0) {
                        overIndex++;
                    }
                    ballIndex = 0;

                    continue;
                }

                // Normal delivery.
                if (td.classList.contains('BallCell') || td.classList.contains('extraBall')) {
                    const ball = BallHelper.getBallValue(td);

                    currentBatsman.balls.push(ball === '' ? null : ball);

                    if (ball !== '') {
                        currentOver.balls[ballIndex] = ball;
                    }

                    ballIndex++;

                    continue;
                }

                // batsmen finished.
                if (td.classList.contains('TotalCell')) {
                    if (batsmanIndex === 1) {
                        batsmanIndex++;
                    } else {
                        batsmanIndex--;
                    }

                    // This is needed because the overs jump back and forth, 
                    // because we are iterating over the _batsmen_, not the overs.
                    // This gets the correct over index, depending on which batter we are using.
                    let startingOverIndex = 0;

                    if (batterIndex < 1)
                        startingOverIndex = 0;
                    else if (batterIndex < 3)
                        startingOverIndex = 2;
                    else if (batterIndex < 5)
                        startingOverIndex = 4;
                    else
                        startingOverIndex = 6;

                    overIndex = startingOverIndex * (overs.length / 8);

                    break;
                }
            }
        }
    }

    // private populateInningsBatsmenStats(scoresheet: Scoresheet) {
    //     scoresheet.innings[0].overs.forEach((over: Over) => {
    //         this.populateBatsmanInningsStats(scoresheet.innings[0], over, over.batsmen[0]);
    //         this.populateBatsmanInningsStats(scoresheet.innings[0], over, over.batsmen[1]);
    //     })

    //     scoresheet.innings[1].overs.forEach((over: Over) => {
    //         this.populateBatsmanInningsStats(scoresheet.innings[1], over, over.batsmen[0]);
    //         this.populateBatsmanInningsStats(scoresheet.innings[1], over, over.batsmen[1]);
    //     })
    // }

    // private populateBatsmanInningsStats(innings: Innings, over: Over, overBatsman: Batsman): void {
    //     let batsman = innings.batsmen.find(b => b.name === overBatsman.name);

    //     if (isNullOrUndefined(batsman)) {
    //         batsman = new Batsman();
    //         batsman.name = overBatsman.name;
    //         innings.batsmen.push(batsman);
    //         batsman.bowlers = [];
    //     }


    //     let bowler = batsman.bowlers.find(b => b.name === over.bowler);
    //     if (isNullOrUndefined(bowler)) {
    //         bowler = new Bowler();
    //         bowler.name = over.bowler;
    //         batsman.bowlers.push(bowler);
    //     }

    //     bowler.balls.push(...overBatsman.balls.filter(b => b !== ''))
    //     bowler.score += this.determineRunsFromBalls(overBatsman.balls);
    //     bowler.extras += overBatsman.balls.filter(b => BallHelper.isExtra(b)).length;
    //     bowler.wickets += overBatsman.balls.filter(b => BallHelper.isWicket(b)).length;

    //     batsman.balls.push(...overBatsman.balls.filter(b => b !== ''));
    //     batsman.faced += overBatsman.balls.filter(b => b !== '').length;
    //     batsman.extras += overBatsman.balls.filter(b => BallHelper.isExtra(b)).length;
    //     batsman.score += this.determineRunsFromBalls(overBatsman.balls);
    //     batsman.wickets += overBatsman.balls.filter(b => BallHelper.isWicket(b)).length;
    //     batsman.strikeRate = batsman.score / batsman.faced * 100;
    // }


    // private populateInningsBowlerStats(scoresheet: Scoresheet) {
    //     scoresheet.innings[0].overs.forEach((over: Over) => {
    //         this.populateBowlerInningsStats(scoresheet.innings[0], over);
    //     })

    //     scoresheet.innings[1].overs.forEach((over: Over) => {
    //         this.populateBowlerInningsStats(scoresheet.innings[1], over);
    //     })
    // }

    // private populateBowlerInningsStats(innings: Innings, over: Over): void {
    //     let bowler = innings.bowlers.find(b => b.name === over.bowler);

    //     if (isNullOrUndefined(bowler)) {
    //         bowler = new Bowler();
    //         bowler.name = over.bowler;
    //         innings.bowlers.push(bowler);
    //     }

    //     bowler.balls.push(...over.balls.filter(b => b !== ''))
    //     bowler.score += this.determineRunsFromBalls(over.balls);
    //     bowler.extras += over.balls.filter(b => BallHelper.isExtra(b)).length;
    //     bowler.wickets += over.balls.filter(b => BallHelper.isWicket(b)).length;
    // }

    // private determineExtras(over: Over): void {
    //     over.balls
    //         .filter(b => BallHelper.isExtra(b))
    //         .forEach((b) => over.extras++);
    // }

    // private determineRuns(over: Over): number {
    //     over.balls.forEach(ball => {
    //         if (BallHelper.isWicket(ball)) {
    //             over.runs -= 3;
    //         } else if (BallHelper.isExtra(ball)) {
    //             over.runs += 2;
    //         } else {
    //             over.runs += +ball;
    //         }
    //     });

    //     return over.runs;
    // }

    // private determineRunsFromBalls(balls: string[]): number {
    //     let runs: number = 0;
    //     balls.forEach(ball => {
    //         if (BallHelper.isWicket(ball)) {
    //             runs -= 3;
    //         } else if (BallHelper.isExtra(ball)) {
    //             runs += 2;
    //         } else {
    //             runs += +ball;
    //         }
    //     });

    //     return runs;
    // }

    // private populateSkinsOld(team: Team, rowIndex: number): void {
    //     team.skins = [];

    //     for (let index = 1; index <= 4; index++) {
    //         const score: string = this.dom.window.document.querySelectorAll('.Summary>tbody>tr')[rowIndex].querySelectorAll('td')[index].innerHTML;
    //         team.skins.push(new Skin({ score: +score }));
    //     }
    // }

    // private determineSkinPoints(team1: Team, team2: Team) {
    //     team1.skins.forEach((skin, index) => {
    //         if (skin.score > team2.skins[index].score) {
    //             skin.state = 'win';
    //             skin.points = 1;

    //             team2.skins[index].state = 'lose';
    //             team2.skins[index].points = 0;

    //         } else if (skin.score < team2.skins[index].score) {
    //             skin.state = 'lose';
    //             skin.points = 0;

    //             team2.skins[index].state = 'win';
    //             team2.skins[index].points = 1;
    //         } else {
    //             skin.state = 'draw';
    //             skin.points = 0;

    //             team2.skins[index].state = 'draw';
    //             team2.skins[index].points = 0;
    //         }
    //     })
    // }
}