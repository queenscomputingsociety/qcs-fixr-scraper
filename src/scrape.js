const puppeteer = require("puppeteer");
const creds = require("../creds");
const path = require("path");

require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });

const scrape = async (headlessMode) => {
  console.log("[SCRP] Starting browser");

  const NAV_TIMEOUT = 3000;

  const browser = await puppeteer.launch({ headless: headlessMode });
  const page = await browser.newPage();
  await page.goto("https://organiser.fixr.co");
  await page.waitForTimeout(NAV_TIMEOUT);

  console.log("[SCRP] Logging in");
  await page.click("#email96619420");
  await page.keyboard.type(creds.email);
  await page.click("#password1216985755");
  await page.keyboard.type(creds.password);
  await page.click(".sc-eldixR > button:nth-child(1)");

  await page.waitForTimeout(NAV_TIMEOUT);

  await page.click(
    "#__next > div.Authed__Container-sc-1n7tikr-0.dYShWU > div > div > div > div > div.Tabs__Container-sc-67699q-0.eQVUtD > div > div > div:nth-child(2) > div.AccountListItem__Children-sc-1yxd6jw-2.ecPrvq > button"
  );

  await page.waitForTimeout(NAV_TIMEOUT);

  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: path.resolve(creds.downloadDir),
  });
  console.log("[SCRP] Navigating to event");
  await page.goto(
    `https://organiser.fixr.co/events/${creds.eventId}/attendees`
  );

  console.log("[SCRP] Downloading file");
  await page.waitForTimeout(NAV_TIMEOUT);
  await page.click(
    "#__next > div.Authed__Container-sc-1n7tikr-0.dYShWU > div > div.Authed__Page-sc-1n7tikr-2.zrzQM > div > div > div.attendees__Surface-sc-1hdlitw-1.gkwjou > div.attendees__Grid-sc-1hdlitw-4.jzAZDs > div:nth-child(1) > div.styles__Header-sc-14d0z9v-2.cIaSFA > div.styles__ButtonsContainer-sc-14d0z9v-4.bvDOCk > button"
  );
  await page.waitForTimeout(NAV_TIMEOUT);
  await page.click("div.sc-jJoQpE:nth-child(1)");
  console.log("[SCRP] Waiting for download");

  await page.waitForTimeout(NAV_TIMEOUT);
  await browser.close();
  console.log("[SCRP] Done");
};

module.exports = {
  scrape,
};
