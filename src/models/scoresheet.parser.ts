import { JSDOM } from 'jsdom';

import { isNullOrUndefined } from '../utils';
import { BallType } from './balltype';
import { Batsman } from './batsman';
import { Bowler } from './bowler';
import { Innings } from './innings';
import { Over } from './over';
import { IScoresheetParser } from './parser.interface';
import { Scoresheet } from './scoresheet';
import { Skin } from './skin';
import { Team } from './team';

const got = require('got');
const jsdom = require("jsdom");

export class ScoresheetParser implements IScoresheetParser {
    public parse(url: string): Promise<Scoresheet> {

        return new Promise((resolve, reject) => {
            got(url).then(response => {
                const dom = new JSDOM(response.body);

                const scoresheet = new Scoresheet();
                const team1 = new Team();
                const team2 = new Team();

                team1.name = this.getTeamName(dom, 2);
                team2.name = this.getTeamName(dom, 3);

                this.populateSkins(dom, team1, 2);
                this.populateSkins(dom, team2, 3);

                this.determineSkinPoints(team1, team2);
                this.determineScore(team1, team2);

                const oversTable1 = dom.window.document.querySelectorAll('.OversTable')[0]; // Team 1
                const oversTable2 = dom.window.document.querySelectorAll('.OversTable')[1]; // Team 2


                const innings1Bowlers: HTMLTableRowElement[] = oversTable1.querySelectorAll('tbody>tr:not(.BallRow):not(.SpacerRow):not(:first-child):not(:last-child)');
                const innings1Batters: HTMLTableRowElement[] = oversTable1.querySelectorAll('tbody>tr.BallRow');

                const innings2Bowlers: HTMLTableRowElement[] = oversTable2.querySelectorAll('tbody>tr:not(.BallRow):not(.SpacerRow):not(:first-child):not(:last-child)');
                const innings2Batters: HTMLTableRowElement[] = oversTable2.querySelectorAll('tbody>tr.BallRow');

                scoresheet.innings1.overs = this.populateInningsBowlers(innings1Bowlers);
                scoresheet.innings2.overs = this.populateInningsBowlers(innings2Bowlers);

                this.populateBatting(innings1Batters, scoresheet.innings1.overs);
                this.populateBatting(innings2Batters, scoresheet.innings2.overs);

                [...scoresheet.innings1.overs, ...scoresheet.innings2.overs].forEach(over => {
                    this.determineRuns(over);
                    this.determineExtras(over);
                });

                this.populateInningsBatsmenStats(scoresheet);
                this.populateInningsBowlerStats(scoresheet);

                scoresheet.teams.push(...[team1, team2])

                resolve(scoresheet);

            }).catch(err => {
                console.log(err);
            });
        })
    }

    private populateInningsBatsmenStats(scoresheet: Scoresheet) {
        scoresheet.innings1.overs.forEach((over: Over) => {
            this.populateBatsmanInningsStats(scoresheet.innings1, over, over.batsman1);
            this.populateBatsmanInningsStats(scoresheet.innings1, over, over.batsman2);
        })

        scoresheet.innings2.overs.forEach((over: Over) => {
            this.populateBatsmanInningsStats(scoresheet.innings2, over, over.batsman1);
            this.populateBatsmanInningsStats(scoresheet.innings2, over, over.batsman2);
        })
    }

    private populateBatsmanInningsStats(innings: Innings, over: Over, overBatsman: Batsman): void {
        let batsman = innings.batsmen.find(b => b.name === overBatsman.name);

        if (isNullOrUndefined(batsman)) {
            batsman = new Batsman();
            batsman.name = overBatsman.name;
            innings.batsmen.push(batsman);
            batsman.bowlers = [];
        }


        let bowler = batsman.bowlers.find(b => b.name === over.bowler);
        if (isNullOrUndefined(bowler)) {
            bowler = new Bowler();
            bowler.name = over.bowler;
            batsman.bowlers.push(bowler);
        }

        bowler.balls.push(...overBatsman.balls.filter(b => b !== ''))
        bowler.score += this.determineRunsFromBalls(overBatsman.balls);
        bowler.extras += overBatsman.balls.filter(b => this.isExtra(b)).length;
        bowler.wickets += overBatsman.balls.filter(b => this.isWicket(b)).length;
        
        batsman.balls.push(...overBatsman.balls.filter(b => b !== ''));
        batsman.faced += overBatsman.balls.filter(b => b !== '').length;
        batsman.extras += overBatsman.balls.filter(b => this.isExtra(b)).length;
        batsman.score += this.determineRunsFromBalls(overBatsman.balls);
        batsman.wickets += overBatsman.balls.filter(b => this.isWicket(b)).length;
        batsman.strikeRate = batsman.score / batsman.faced * 100;
    }


    private populateInningsBowlerStats(scoresheet: Scoresheet) {
        scoresheet.innings1.overs.forEach((over: Over) => {
            this.populateBowlerInningsStats(scoresheet.innings1, over);
        })

        scoresheet.innings2.overs.forEach((over: Over) => {
            this.populateBowlerInningsStats(scoresheet.innings2, over);
        })
    }

    private populateBowlerInningsStats(innings: Innings, over: Over): void {
        let bowler = innings.bowlers.find(b => b.name === over.bowler);

        if (isNullOrUndefined(bowler)) {
            bowler = new Bowler();
            bowler.name = over.bowler;
            innings.bowlers.push(bowler);
        }

        bowler.balls.push(...over.balls.filter(b => b !== ''))
        bowler.score += this.determineRunsFromBalls(over.balls);
        bowler.extras += over.balls.filter(b => this.isExtra(b)).length;
        bowler.wickets += over.balls.filter(b => this.isWicket(b)).length;
    }

    private populateBatting(batters: HTMLTableRowElement[], overs: Over[]): void {
        let batsmanIndex: number = 1;
        let batsmenFinished: boolean = false;
        let over: number = 0;
        let newOver = true;

        while (!batsmenFinished) {
            // Iterate over all the batters
            for (let batter = 0; batter < batters.length; batter++) {
                const tr: HTMLTableRowElement = batters[batter];
                let batterName: string;
                let ballCount = 0;
                // Iterate over individual batter
                for (let index = 0; index < tr.cells.length; index++) {
                    const td: HTMLTableDataCellElement = tr.cells[index];
                    const currentOver = overs[over];
                    const currentBatsman = batsmanIndex === 1 ? currentOver.batsman1 : currentOver.batsman2;

                    if (td.classList.contains('BatsmanCell')) {
                        batterName = td.textContent.trim();
                        continue;
                    }

                    if (newOver === true) {
                        if (batsmanIndex === 1) {
                            overs[over].batsman1.name = batterName;
                        } else {
                            overs[over].batsman2.name = batterName;
                        }

                        newOver = false;
                    }

                    if (td.classList.contains('BallCell') || td.classList.contains('extraBall')) {
                        const ball = this.getBall(td);

                        if (ball !== '') {
                            currentOver.balls[ballCount] = ball;
                        }

                        let currentBall = currentOver.balls[ballCount];

                        // other batsmen faced.
                        if (ball === '') {
                            currentBatsman.balls[ballCount] = '';
                            ballCount++;
                            continue;
                        }

                        switch (this.determineBallType(ball)) {
                            case BallType.NoBall: currentOver.noBalls++; break;
                            case BallType.Wide: currentOver.wides++; break;
                            case BallType.Runout: currentOver.runout++; break;
                            case BallType.Stumped: currentOver.stumps++; break;
                            case BallType.Bowled: currentOver.bowled++; break;
                            case BallType.Catch: currentOver.catches++; break;
                            case BallType.Mancad: currentOver.mancad++; break;
                        }

                        if (this.isWicket(currentBall)) {
                            currentOver.wickets++;
                            currentBatsman.wickets++;
                        }
                        if (this.isExtra(currentBall)) {
                            currentBatsman.extras++;
                        }
                        currentBatsman.balls[ballCount] = currentBall || '';
                        currentBatsman.faced = currentBatsman.balls.filter(b => b !== '').length;
                        currentBatsman.score = this.determineRunsFromBalls(currentBatsman.balls);
                        currentBatsman.strikeRate = currentBatsman.score / currentBatsman.faced * 100;


                        ballCount++;
                        continue;
                    }

                    if (td.classList.contains('OverTotalCell')) {
                        // Over finished.
                        if ((over + 1) % 4 !== 0) {
                            ballCount = 0;
                            over++;
                        }
                        currentOver.ballCount = currentOver.balls.length;

                        newOver = true;

                        continue;
                    }

                    if (td.classList.contains('TotalCell')) {
                        // batsmen finished.
                        if (batsmanIndex === 1) {
                            batsmanIndex++;
                        } else {
                            batsmanIndex--;
                        }
                        if (batter < 1) {
                            over = 0;
                        } else if (batter < 3) {
                            over = 4;
                        } else if (batter < 5) {
                            over = 8
                        } else {
                            over = 12
                        }
                        newOver = true;

                        break;
                    }
                }
            }

            batsmenFinished = true;
        }
    }

    private determineBallType(ball: string): BallType {
        ball = ball.toUpperCase();

        if (ball === 'B') return BallType.Bowled;
        if (ball.includes('NB')) return BallType.NoBall;

        if (ball.includes('W')) return BallType.Wide;
        if (ball === 'LS') return BallType.Wide;

        if (ball === 'RO' || ball === 'R') return BallType.Runout;
        if (ball === 'C') return BallType.Catch;
        if (ball === 'MC') return BallType.Mancad;
        if (ball === 'ST') return BallType.Stumped;
    }

    private determineExtras(over: Over): void {
        over.balls
            .filter(b => this.isExtra(b))
            .forEach((b) => over.extras++);
    }

    private determineRuns(over: Over): number {
        over.balls.forEach(ball => {
            if (this.isWicket(ball)) {
                over.runs -= 3;
            } else if (this.isExtra(ball)) {
                over.runs += 2;
            } else {
                over.runs += +ball;
            }
        });

        return over.runs;
    }

    private determineRunsFromBalls(balls: string[]): number {
        let runs: number = 0;
        balls.forEach(ball => {
            if (this.isWicket(ball)) {
                runs -= 3;
            } else if (this.isExtra(ball)) {
                runs += 2;
            } else {
                runs += +ball;
            }
        });

        return runs;
    }

    private isWicket(ball: string): boolean {
        const ballType: BallType = this.determineBallType(ball.toUpperCase());
        return (
            ballType === BallType.Bowled ||
            ballType === BallType.Runout ||
            ballType === BallType.Stumped ||
            ballType === BallType.Catch ||
            ballType === BallType.Mancad)
    }

    private isExtra(ball: string): boolean {
        const ballType: BallType = this.determineBallType(ball.toUpperCase());
        return (
            ballType === BallType.NoBall ||
            ballType === BallType.Wide
        )
    }

    private getBall(td: HTMLTableCellElement): string {
        const ball = td.textContent?.trim().toUpperCase();
        // No ball
        if (ball.includes('NB')) {
            return 'NB';
        } else if (ball.includes('RO') || ball === 'R') {
            // Runout
            return 'RO';
        } else if (ball.includes('ST')) {
            // Stumped
            return 'ST';
        } else if (ball.includes('B')) {
            // Bowled
            return 'B';
        } else if (ball.includes('W')) {
            // Wide
            return 'W';
        } else if (ball.includes('C')) {
            // Catch
            return 'C';
        } else {
            // Normal runs
            return ball;
        }
    }

    private populateInningsBowlers(innings1Bowlers: HTMLTableRowElement[]): Over[] {
        const overs: Over[] = [];
        let currentBowler: number = 0;
        for (let bowler = 0; bowler < innings1Bowlers.length; bowler++) {
            const tr: HTMLTableRowElement = innings1Bowlers[bowler];

            for (let index = 0; index < tr.cells.length; index++) {
                const td: HTMLTableDataCellElement = tr.cells[index];
                if (td.textContent === 'Total') break;

                if (td.classList.contains('Blank')) {
                    continue;
                }

                if (td.classList.contains('OverNo')) {
                    if (!overs[currentBowler])
                        overs[currentBowler] = new Over();
                    overs[currentBowler].index = +td.textContent?.trim();
                    continue;
                }

                if (td.classList.contains('Bwl')) {
                    overs[currentBowler].bowler = td.textContent?.trim() || 'Unknown';
                    currentBowler++;
                    continue;
                }
            }
        }

        return overs;
    }

    private getTeamName(dom: any, rowIndex: number): string {
        return dom.window.document.querySelectorAll('.Summary>tbody>tr')[rowIndex].querySelectorAll('td')[0].innerHTML
    }

    private populateSkins(dom: any, team: Team, rowIndex: number): void {
        team.skins = [];

        for (let index = 1; index <= 4; index++) {
            const score: string = dom.window.document.querySelectorAll('.Summary>tbody>tr')[rowIndex].querySelectorAll('td')[index].innerHTML;
            team.skins.push(new Skin({ score: +score }));
        }
    }

    private determineSkinPoints(team1: Team, team2: Team) {
        team1.skins.forEach((skin, index) => {
            if (skin.score > team2.skins[index].score) {
                skin.state = 'win';
                skin.points = 1;

                team2.skins[index].state = 'lose';
                team2.skins[index].points = 0;

            } else if (skin.score < team2.skins[index].score) {
                skin.state = 'lose';
                skin.points = 0;

                team2.skins[index].state = 'win';
                team2.skins[index].points = 1;
            } else {
                skin.state = 'draw';
                skin.points = 0;

                team2.skins[index].state = 'draw';
                team2.skins[index].points = 0;
            }
        })
    }

    private determineScore(team1: Team, team2: Team): void {
        team1.score = team1.skins.map(skin => skin.score).reduce((accumulator, currentValue) => accumulator += currentValue);
        team2.score = team2.skins.map(skin => skin.score).reduce((accumulator, currentValue) => accumulator += currentValue);

        team1.points = team1.score > team2.score ? 4 : 0;
        team2.points = team1.score < team2.score ? 4 : 0;

        team1.skins.filter(skin => skin.state === 'win').map(skin => skin.points).forEach(point => team1.points += point);
        team2.skins.filter(skin => skin.state === 'win').map(skin => skin.points).forEach(point => team2.points += point);
    }
}