import { Main } from './main';

const app = new Main();

// process.env['HTTP_PROXY'] = 'http://bc-vip.intra.absa.co.za:8080';
// process.env['HTTPS_PROXY'] = 'http://bc-vip.intra.absa.co.za:8080';

app.start();
