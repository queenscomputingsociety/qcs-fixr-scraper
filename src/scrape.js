const puppeteer = require("puppeteer");
const config = require("../config");
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
  await page.keyboard.type(config.email);
  await page.click("input[type='password']");
  await page.keyboard.type(config.password);
  await page.click("button[type='submit']");

  await page.waitForNetworkIdle();


  page.on('response', async (response) => {
    try {

      let filePath = path.resolve(`./${config.downloadDir}/output.json`);
      await fse.outputFile(filePath, await response.buffer());
      await browser.close();

    }
    catch {
      await scrape(headlessMode)
    }
  });
  console.log("[SCRP] Downloading file");
  await page.goto(
    `https://api.fixr.co/api/v2/organiser/accounts/${config.accountId}/events/${config.eventId}/attendees?limit=${config.maxAttendees}`
  );
  console.log("[SCRP] Done");
  console.log("[SCRP] Returning...");
  return

};

module.exports = {
  scrape,
};
