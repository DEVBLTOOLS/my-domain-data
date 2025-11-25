const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const USER = process.env.NAMEJET_USERNAME;
  const PASS = process.env.NAMEJET_PASSWORD;

  if (!USER || !PASS) {
    console.error('Missing NameJet credentials');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Increase default timeout
  await page.setDefaultNavigationTimeout(60000);
  await page.setDefaultTimeout(60000);

  console.log('→ Go to login page');
  await page.goto('https://www.namejet.com/login.sn?sendBack=/', { waitUntil: 'networkidle2' });

  // Wait for either username field or some indication of login form
  const userSelector = 'input[name="loginUsername"]';
  const altSelector = 'input[name="loginUsername"], input[name="username"], input[type="text"]';

  try {
    await page.waitForSelector(altSelector, { visible: true, timeout: 15000 });
    console.log('Login form detected');
  } catch (err) {
    console.error('Login form not detected. Current page URL:', page.url());
    // Dump html for debugging:
    const html = await page.content();
    fs.writeFileSync('login_page_dump.html', html);
    console.error('Saved login_page_dump.html for inspection');
    await browser.close();
    process.exit(1);
  }

  console.log('→ Fill login fields');
  await page.type('input[name="loginUsername"]', USER);
  await page.type('input[name="loginPassword"]', PASS);

  // If there's a remember‑me checkbox
  const rememberSel = 'input[name="autoSignIn"]';
  const rememberElem = await page.$(rememberSel);
  if (rememberElem) {
    console.log('Clicking remember me');
    await rememberElem.click();
  }

  console.log('→ Submit login form');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('Logged in, current URL:', page.url());

  console.log('→ Navigate to CSV download');
  const downloadUrl = 'https://www.namejet.com/file_dl.sn?file=deletinglist.csv';
  const view = await page.goto(downloadUrl, { waitUntil: 'networkidle2' });

  console.log('Download URL status:', view.status());

  if (view.status() !== 200) {
    console.error('Download failed, status code:', view.status());
    await browser.close();
    process.exit(1);
  }

  const buffer = await view.buffer();
  fs.writeFileSync('deletinglist.csv', buffer);
  console.log('✅ deletinglist.csv saved successfully');

  await browser.close();
})();
