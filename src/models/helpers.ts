import { BallType } from './balltype';

export class BallHelper {
    static determineType(ball: string): BallType {
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

    static getBallValue(td: HTMLTableCellElement): string {
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

    static isExtra(ball: string): boolean {
        const ballType: BallType = this.determineType(ball.toUpperCase());
        return (
            ballType === BallType.NoBall ||
            ballType === BallType.Wide
        )
    }

    static isWicket(ball: string): boolean {
        const ballType: BallType = this.determineType(ball.toUpperCase());
        return (
            ballType === BallType.Bowled ||
            ballType === BallType.Runout ||
            ballType === BallType.Stumped ||
            ballType === BallType.Catch ||
            ballType === BallType.Mancad)
    }
}