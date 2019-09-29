// Get dependencies: npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const pluginStealth = require('puppeteer-extra-plugin-stealth')
puppeteer.use(pluginStealth())


setInterval( ()=>{
// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })
  await page.goto('https://www.udemy.com/the-web-developer-bootcamp/')
  await page.waitFor(5000)
  await page.screenshot({ path: 'testresult.png', fullPage: true })
  await page.waitForSelector('.course-price-text > span + span > span');
  const price = await page.$eval('.course-price-text > span + span > span', e => e.innerText);
  console.log(price);
  await browser.close()
});

},1000);


