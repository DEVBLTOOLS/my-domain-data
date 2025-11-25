const fs = require('fs');
const axios = require('axios');
const qs = require('qs');
const { JSDOM } = require('jsdom');

async function main() {
  const USER = process.env.NAMEJET_USERNAME;
  const PASS = process.env.NAMEJET_PASSWORD;

  const client = axios.create({
    baseURL: 'https://www.namejet.com',
    withCredentials: true,
  });

  // 1. GET login page
  const loginPage = await client.get('/login.sn?sendBack=/index.jsp');
  const dom = new JSDOM(loginPage.data);
  const doc = dom.window.document;

  // 2. Extract hidden fields
  const viewstate = doc.querySelector('input[name="__VIEWSTATE"]').value;
  const eventvalidation = doc.querySelector('input[name="__EVENTVALIDATION"]').value;

  // 3. POST login
  const form = {
    __VIEWSTATE: viewstate,
    __EVENTVALIDATION: eventvalidation,
    'ctl00$MainContent$Login1$UserName': USER,
    'ctl00$MainContent$Login1$Password': PASS,
    'ctl00$MainContent$Login1$LoginButton': 'Log In'
  };

  await client.post('/login.sn?sendBack=/index.jsp', qs.stringify(form), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  // 4. Download CSV
  const csvResp = await client.get('/file_dl.sn?file=deletinglist.csv', {
    responseType: 'arraybuffer'
  });

  // 5. Save CSV
  fs.writeFileSync('deletinglist.csv', csvResp.data);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
