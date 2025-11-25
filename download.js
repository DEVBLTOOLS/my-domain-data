const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const { JSDOM } = require('jsdom');

async function fetchList() {
  try {
    const USER = process.env.NAMEJET_USERNAME;
    const PASS = process.env.NAMEJET_PASSWORD;

    // Step 1: GET the login page to capture hidden fields & cookies
    const getResp = await axios.get('https://www.namejet.com/login.sn?sendBack=/', {
      headers: {
        'User‑Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/92.0.4515.159 Safari/537.36'
      },
      withCredentials: true
    });

    const dom = new JSDOM(getResp.data);
    const doc = dom.window.document;
    const viewstate = doc.querySelector('input[name="__VIEWSTATE"]').value;
    const eventvalidation = doc.querySelector('input[name="__EVENTVALIDATION"]').value;

    // Step 2: POST login
    const postData = {
      '__VIEWSTATE': viewstate,
      '__EVENTVALIDATION': eventvalidation,
      'ctl00$MainContent$Login1$UserName': USER,
      'ctl00$MainContent$Login1$Password': PASS,
      'ctl00$MainContent$Login1$LoginButton': 'Log In'
    };

    const loginResp = await axios.post('https://www.namejet.com/login.sn?sendBack=/',
      qs.stringify(postData),
      {
        headers: {
          'Content‑Type': 'application/x-www-form-urlencoded',
          'User‑Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) // etc'
        },
        withCredentials: true
      });

    // Step 3: Download CSV
    const csvResp = await axios.get('https://www.namejet.com/file_dl.sn?file=deletinglist.csv', {
      headers: {
        'User‑Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) // etc'
      },
      responseType: 'arraybuffer',
      withCredentials: true
    });

    fs.writeFileSync('deletinglist.csv', csvResp.data);
    console.log('Downloaded deletinglist.csv');

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error('Forbidden: check credentials and ensure the endpoint is accessible.');
    } else {
      console.error('Fetch error:', error);
    }
    process.exit(1);
  }
}

fetchList();
