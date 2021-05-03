import * as express from 'express';

import { IScoresheetParser } from '../models/parser.interface';
import { ScoresheetParser } from '../models/scoresheet.parser';

export const parse = (app: express.Application) => {

    const parser: IScoresheetParser = new ScoresheetParser();

    app.post("/parse", (req, res) => {

        // const url: string = 'https://actionsport.spawtz.com/Leagues/IndoorCricket/Scoresheet.aspx?FixtureId=1801555';

        const body = req.body;
        const url = body.url;

        parser.parse(url)
            .then(scoresheet => {
                res.send({ code: 200, data: scoresheet });
            }).catch(err => {
                res.send({ code: 500, data: 'Error parsing scoresheet', error: err });
            });

    });
};