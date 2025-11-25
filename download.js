const axios = require('axios');
const qs = require('qs');
const fs = require('fs');

async function fetchList() {
  const USER = process.env.NAMEJET_USERNAME;
  const PASS = process.env.NAMEJET_PASSWORD;

  if (!USER || !PASS) {
    console.error('Error: NAMEJET_USERNAME or NAMEJET_PASSWORD not set');
    process.exit(1);
  }

  try {
    // 1. GET login page to get cookies
    const getResp = await axios.get('https://www.namejet.com/login.sn?sendBack=/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      withCredentials: true,
      maxRedirects: 5
    });

    // Extract cookies from response, axios stores them in its internal jar but not actual readable, 
    // so we just reuse axios instance with same config.

    // 2. POST login
    const form = {
      loginUsername: USER,
      loginPassword: PASS,
      sendBack: '/',           // if the form includes this hidden or query param
      autoSignIn: 'on'         // optional: use "on" if you want to remember me (if form allows)
    };

    const loginResp = await axios.post(
      'https://www.namejet.com/login.sn?sendBack=/',
      qs.stringify(form),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        withCredentials: true,
        maxRedirects: 5
      }
    );

    // 3. After login, download the CSV file
    const csvResp = await axios.get(
      'https://www.namejet.com/file_dl.sn?file=deletinglist.csv',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        responseType: 'arraybuffer',
        withCredentials: true,
        maxRedirects: 5
      }
    );

    fs.writeFileSync('deletinglist.csv', csvResp.data);
    console.log('✅ deletinglist.csv saved successfully');

  } catch (err) {
    if (err.response) {
      console.error(`HTTP ${err.response.status}: ${err.response.statusText}`);
    } else {
      console.error('Error: ', err.message);
    }
    process.exit(1);
  }
}

fetchList();
