import * as express from "express";
import { IScoresheetParser } from '../models/parser.interface';
import { ScoresheetParser } from '../models/scoresheet.parser';

export const scoresheet = (app: express.Application) => {

    const parser: IScoresheetParser = new ScoresheetParser();

    // home page    
    app.get("/scoresheet/*", (req, res) => {

        // const url: string = 'https://actionsport.spawtz.com/Leagues/IndoorCricket/Scoresheet.aspx?FixtureId=1801555';
        const url = req.originalUrl.replace('/scoresheet/', '');

        
        parser.parse(url).then(scoresheet => {
            res.send({ code: 200, data: scoresheet });
        }).catch(err => {
            res.send('Error parsing scoresheet');
        });

    });

    // about page    
    app.get("/about", (req: any, res) => {
        res.send({ code: 200, data: "/ABOUT Works" })
    });
};