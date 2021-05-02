import express from "express";
import { IScoresheetParser } from './models/parser.interface';
import * as routes from './routes/routes'

export class Main {
    private app = express();
    private port: number = 8080;


    constructor() {
        this.app.use(express.json());
    }

    public start(): void {
        this.registerRoutes();

        // start the Express server
        this.app.listen(this.port, () => {
            console.log(`server started at http://localhost:${this.port}`);
        });

    }

    private registerRoutes(): void {
        routes.scoresheet(this.app);
    }
}
