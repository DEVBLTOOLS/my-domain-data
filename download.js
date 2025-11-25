const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const { JSDOM } = require('jsdom');

async function fetchList() {
  const USER = process.env.NAMEJET_USERNAME;
  const PASS = process.env.NAMEJET_PASSWORD;

  if (!USER || !PASS) {
    console.error('Error: NAMEJET_USERNAME or NAMEJET_PASSWORD not set');
    process.exit(1);
  }

  try {
    // Step 1: GET login page
    const getResp = await axios.get('https://www.namejet.com/login.sn?sendBack=/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
      },
      withCredentials: true,
      maxRedirects: 5
    });

    const dom = new JSDOM(getResp.data);
    const doc = dom.window.document;
    const viewstate = doc.querySelector('input[name="__VIEWSTATE"]')?.value;
    const eventvalidation = doc.querySelector('input[name="__EVENTVALIDATION"]')?.value;

    if (!viewstate || !eventvalidation) {
      console.error('Error: Hidden fields not found in login page');
      process.exit(1);
    }

    // Step 2: POST login
    const postData = {
      __VIEWSTATE: viewstate,
      __EVENTVALIDATION: eventvalidation,
      'ctl00$MainContent$Login1$UserName': USER,
      'ctl00$MainContent$Login1$Password': PASS,
      'ctl00$MainContent$Login1$LoginButton': 'Log In'
    };

    const loginResp = await axios.post(
      'https://www.namejet.com/login.sn?sendBack=/',
      qs.stringify(postData),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
        },
        withCredentials: true,
        maxRedirects: 5
      }
    );

    // Step 3: Download CSV
    const csvResp = await axios.get(
      'https://www.namejet.com/file_dl.sn?file=deletinglist.csv',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
        },
        responseType: 'arraybuffer',
        withCredentials: true,
        maxRedirects: 5
      }
    );

    fs.writeFileSync('deletinglist.csv', csvResp.data);
    console.log('✅ Successfully downloaded deletinglist.csv');

  } catch (error) {
    if (error.response) {
      console.error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    } else {
      console.error('Fetch error:', error.message || error);
    }
    process.exit(1);
  }
}

fetchList();
