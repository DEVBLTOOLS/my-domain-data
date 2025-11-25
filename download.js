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

  // Go to login page
  await page.goto('https://www.namejet.com/login.sn?sendBack=/', { waitUntil: 'networkidle2' });

  // Fill login form
  await page.type('input[name="loginUsername"]', USER);
  await page.type('input[name="loginPassword"]', PASS);

  // Optionally check "Remember me"
  const autoSignIn = await page.$('input[name="autoSignIn"]');
  if (autoSignIn) {
    await autoSignIn.click();
  }

  // Submit the form
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // Navigate to the CSV download URL
  const downloadUrl = 'https://www.namejet.com/file_dl.sn?file=deletinglist.csv';
  const view = await page.goto(downloadUrl, { waitUntil: 'networkidle2' });

  // Get CSV content
  const buffer = await view.buffer();
  fs.writeFileSync('deletinglist.csv', buffer);
  console.log('Downloaded deletinglist.csv');

  await browser.close();
})().catch(error => {
  console.error('Error in Puppeteer script:', error);
  process.exit(1);
});
