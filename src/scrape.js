const puppeteer = require("puppeteer");
const creds = require("../creds");
const path = require("path");
const fse = require("fs-extra")

require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });

const scrape = async (headlessMode) => {
  console.log("[SCRP] Starting browser");

  const browser = await puppeteer.launch({ headless: headlessMode });
  const page = await browser.newPage();
  await page.goto("https://organiser.fixr.co");
  await page.waitForSelector("input[type='email']")
  console.log("[SCRP] Logging in");
  await page.click("input[type='email']");
  await page.keyboard.type(creds.email);
  await page.click("input[type='password']");
  await page.keyboard.type(creds.password);
  await page.click("button[type='submit']");

  await page.waitForNetworkIdle();


  page.on('response', async (response) => {

    let filePath = path.resolve(`./${creds.downloadDir}/output.json`);
    await fse.outputFile(filePath, await response.buffer());
    await browser.close();
  });
  console.log("[SCRP] Downloading file");
  await page.goto(
    `https://api.fixr.co/api/v2/organiser/accounts/${creds.accountId}/events/${creds.eventId}/attendees?limit=${creds.maxAttendees}`
  );
  console.log("[SCRP] Done");
  return
};

module.exports = {
  scrape,
};
