const puppeteer = require("puppeteer");
const CREDS = require("./creds");

const scrape = async () => {
  const NAV_TIMEOUT = 1500;

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://organiser.fixr.co");

  await page.click("#email96619420");
  await page.keyboard.type(CREDS.email);
  await page.click("#password1216985755");
  await page.keyboard.type(CREDS.password);
  await page.click(".sc-eldixR > button:nth-child(1)");

  await page.waitForTimeout(NAV_TIMEOUT);

  await page.click(
    "#__next > div.Authed__Container-sc-1n7tikr-0.dYShWU > div > div > div > div > div.Tabs__Container-sc-67699q-0.eQVUtD > div > div > div:nth-child(2) > div.AccountListItem__Children-sc-1yxd6jw-2.ecPrvq > button"
  );

  await page.waitForTimeout(NAV_TIMEOUT);
  await page.goto(`https://organiser.fixr.co/events/${CREDS.eventId}/attendees`);

  await page.click(
    "#__next > div.Authed__Container-sc-1n7tikr-0.dYShWU > div > div.Authed__Page-sc-1n7tikr-2.zrzQM > div > div > div.attendees__Surface-sc-1hdlitw-1.gkwjou > div.attendees__Grid-sc-1hdlitw-4.jzAZDs > div:nth-child(1) > div.styles__Header-sc-14d0z9v-2.cIaSFA > div.styles__ButtonsContainer-sc-14d0z9v-4.bvDOCk > button"
  );
  await page.click("div.sc-jJoQpE:nth-child(1)");


//   await browser.close();
};

scrape();
