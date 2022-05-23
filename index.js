const puppeteer = require("puppeteer");
const CREDS = require("./creds");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const googleCredentials = require("./google-credentials.json");
const showBanner = require("node-banner");
require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });

const removeAllFilesInDirectory = async (dir) => {
  console.log(`[RAFD] Removing all files in directory "${CREDS.downloadDir}"`);

  fs.mkdir(CREDS.downloadDir, (err) => {
    if (err.code == "EEXIST") return;
  });
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.log("Error deleting files::\n" + err);
      return;
    }

    for (const file of files) {
      fs.unlink(path.join(dir, file), (err) => {
        if (err) {
          console.log("Error deleting files::\n" + err.message);
          return;
        }
      });
    }
  });
  console.log(`[RAFD] Done`);
};

const scrape = async () => {
  console.log("[SCRP] Starting browser");

  const NAV_TIMEOUT = 1500;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://organiser.fixr.co");
  await page.waitForTimeout(NAV_TIMEOUT);

  console.log("[SCRP] Logging in");
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

  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: path.resolve(CREDS.downloadDir),
  });
  console.log("[SCRP] Navigating to event");
  await page.goto(
    `https://organiser.fixr.co/events/${CREDS.eventId}/attendees`
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

const processData = async () => {
  console.log("[PD] Reading CSV...");
  fs.readdir(CREDS.downloadDir, (err, files) => {
    if (err) {
      console.log("[PD] Error processing files (READDIR)");
      return;
    }

    console.log(
      `[PD] ${files.length} file${files.length === 1 ? "s" : ""} found`
    );
    for (const file of files) {
      const parser = parse({ columns: true, cast: true }, (err, records) => {
        0;
        if (err) {
          console.log("[PD] CSV Error" + err);
          return;
        }
        googleSheets(records);
      });

      fs.createReadStream(path.join(CREDS.downloadDir, file)).pipe(parser);
    }
  });
};

const googleSheets = async (fixrData) => {
  console.log(`[GS] Processing ${fixrData.length} entries`);

  console.log(`[GS] Authenticating...`);
  const doc = new GoogleSpreadsheet(CREDS.sheetId);
  await doc.useServiceAccountAuth(googleCredentials);
  await doc.loadInfo();
  let sheet = undefined;

  try {
    console.log(`[GS] Attemping to create sheet...`);
    sheet = await doc.addSheet({
      headerValues: [
        "Club/Soc",
        "First name",
        "Last name",
        "SN",
        "QUBSE",
        "IFNSEM",
      ],
      title: "DEV - Full list (for su)",
    });
  } catch {
    console.log(`[GS] Sheet exists... Using that instead`);
    sheet = await doc.sheetsByTitle["DEV - Full list (for su)"];
  }

  console.log(`[GS] Transforming FIXR data`);
  let fixrDataProcessed = [];
  for (const row of fixrData) {
    let candidate = {
      "Club/Soc": "Queen's Computing Society",
      "First name": row["First Name"],
      "Last name": row["Last Name"],
      SN: checkQUBStatus(row, "Question: Student Number", true),
      QUBSE: checkQUBStatus(row, "Question: QUB Email", true),
      IFNSEM: checkQUBStatus(row, "email", false),
    };

    if (candidate.IFNSEM === "NA" && candidate.QUBSE == "") {
      candidate.QUBSE = generateValidQUBEmail(candidate.SN, candidate.email);
    }

    if (
      (candidate.IFNSEM === "NA" && candidate.SN == undefined) ||
      (candidate.IFNSEM === "NA" && candidate.QUBSE == undefined) ||
      (candidate.SN === "NA" && candidate.IFNSEM === undefined)
    ) {
      console.log(
        `[GS-FXRPROC] ${candidate["First name"]} ${candidate["Last name"]} is invalid!`
      );
      console.log(
        candidate["First name"],
        candidate.SN,
        candidate.QUBSE,
        candidate.IFNSEM
      );
    } else {
      fixrDataProcessed.push(candidate);
    }
  }

  console.log(`[GS] Getting data from Google Sheets`);
  const googleData = await sheet.getRows();

  console.log(`[GS] Transforming Google data`);
  let googleDataProcessed = [];
  for (const row of googleData) {
    let sn = row["SN"];
    if (sn !== "NA") sn = parseInt(sn);
    googleDataProcessed.push({
      "Club/Soc": "Queen's Computing Society",
      "First name": row["First name"],
      "Last name": row["Last name"],
      SN: sn,
      QUBSE: row["QUBSE"],
      IFNSEM: row["IFNSEM"],
    });
  }

  let newEntries = [];

  console.log(`[GS] Computing differential...`);
  for (let i = 0; i < fixrDataProcessed.length; i++) {
    const fixrElement = fixrDataProcessed[i];

    if (
      googleDataProcessed.findIndex(
        (googleElement) =>
          (fixrElement.SN !== "NA" && googleElement.SN === fixrElement.SN) ||
          (fixrElement.IFNSEM !== "NA" &&
            googleElement.IFNSEM === fixrElement.IFNSEM)
      ) === -1
    ) {
      newEntries.push(fixrElement);
      console.log(
        `[+] ${fixrElement["First name"]} ${fixrElement["Last name"]}`
      );
    } else {
      // console.log(
      //   `[-] ${fixrElement["First name"]} ${fixrElement["Last name"]}`
      // );
    }
  }

  if (newEntries.length) {
    console.log(`[GS] Adding ${newEntries.length} entries!`);
    await sheet.addRows(newEntries);
  } else {
    console.log("[GS] No rows to add!");
  }
};

const checkQUBStatus = (entry, fieldName, showIfQUB) => {
  if (entry["Ticket Type Name"] === "Student Membership" && showIfQUB) {
    return entry[fieldName];
  }
  if (entry["Ticket Type Name"] !== "Student Membership" && !showIfQUB) {
    return entry[fieldName];
  }
  return "NA";
};

const generateValidQUBEmail = (studentNo) => `${studentNo}@ads.qub.ac.uk`;
const main = async () => {
  await showBanner(
    "FIXR  SCRAPER",
    "Queen's Computing Society, Queen's University Belfast\n 2022 - James McFarland."
  );
  await removeAllFilesInDirectory(CREDS.downloadDir);
  await scrape();
  await processData();
};

main();
// googleSheets([
//   {
//     "First Name": "Brendan",
//     "Last Name": "McLaughlin",
//     email: "brendanmcl17@gmail.com",
//     DOB: "2002-08-29",
//     Mobile: 447752020989,
//     "Sold At": "2021-12-22 19:37:24.467900+00:00",
//     "Entry Status": "",
//     "People In": "",
//     "Entry Time": "",
//     "Event ID": 28977274,
//     "Event Name": "Member Signup 2021/22",
//     "Ticket Type ID": 182115,
//     "Ticket Type Name": "Student Mfembership",
//     "Ticket Type Category": "Uncategorised",
//     Price: 3,
//     Currency: "GBP",
//     "Ticket Reference": "fMMBzmsLCQAQkNGhHtT8ym",
//     "Question: Enter Course": "CIT",
//     "Question: QUB Email:": "",
//     "Question: Student Number": 40328832,
//     "Question: Year": "1st",
//   },
//   {
//     "First Name": "Cáhan",
//     "Last Name": "Brolly",
//     email: "cahanbrolly@hotmail.co.uk",
//     DOB: "2001-03-07",
//     Mobile: 447526736763,
//     "Sold At": "2022-01-24 12:30:48.554918+00:00",
//     "Entry Status": "",
//     "People In": "",
//     "Entry Time": "",
//     "Event ID": 28977274,
//     "Event Name": "Member Signup 2021/22",
//     "Ticket Type ID": 182115,
//     "Ticket Type Name": "Student Membership",
//     "Ticket Type Category": "Uncategorised",
//     Price: 3,
//     Currency: "GBP",
//     "Ticket Reference": "7dD4VJm5kkpRA2Ym9P4Vsb",
//     "Question: Enter Course": "CS",
//     "Question: QUB Email:": "cbrolly07@qub.ac.uk",
//     "Question: Student Number": 40259048,
//     "Question: Year": "Placement",
//   },

//   {
//     "First Name": "Ur",
//     "Last Name": "Ma",
//     email: "urma@hotmail.co.uk",
//     DOB: "2001-03-07",
//     Mobile: 447526736763,
//     "Sold At": "2022-01-24 12:30:48.554918+00:00",
//     "Entry Status": "",
//     "People In": "",
//     "Entry Time": "",
//     "Event ID": 28977274,
//     "Event Name": "Member Signup 2021/22",
//     "Ticket Type ID": 182115,
//     "Ticket Type Name": "Student Membership",
//     "Ticket Type Category": "Uncategorised",
//     Price: 3,
//     Currency: "GBP",
//     "Ticket Reference": "7dD4VJm5kkpRA2Ym9P4Vsb",
//     "Question: Enter Course": "CS",
//     "Question: QUB Email:": "urma@qub.ac.uk",
//     "Question: Student Number": 12345678,
//     "Question: Year": "Placement",
//   },
//   {
//     "First Name": "Ur",
//     "Last Name": "da",
//     email: "urda@hotmail.co.uk",
//     DOB: "2001-03-07",
//     Mobile: 447526736763,
//     "Sold At": "2022-01-24 12:30:48.554918+00:00",
//     "Entry Status": "",
//     "People In": "",
//     "Entry Time": "",
//     "Event ID": 28977274,
//     "Event Name": "fMember Signup 2021/22",
//     "Ticket Type ID": 182115,
//     "Ticket Type Name": "Student Membership",
//     "Ticket Type Category": "Uncategorised",
//     Price: 3,
//     Currency: "GBP",
//     "Ticket Reference": "7dD4VJm5kkpRA2Ym9P4Vsb",
//     "Question: Enter Course": "CS",
//     "Question: QUB Email:": "urda@qub.ac.uk",
//     "Question: Student Number": 12345679,
//     "Question: Year": "Placement",
//   },
// ]);
