const { GoogleSpreadsheet } = require("google-spreadsheet");
const { checkQUBStatus, generateValidQUBEmail } = require("./QUBUtils");
const googleCredentials = require("../google-credentials.json");
const creds = require("../creds");
require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });

const googleSheets = async (fixrData) => {
  console.log(`[GS] Processing ${fixrData.length} entries`);

  console.log(`[GS] Authenticating...`);
  const doc = new GoogleSpreadsheet(creds.sheetId);
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
    //   await sheet.addRows(newEntries);
  } else {
    console.log("[GS] No rows to add!");
  }
};

module.exports = { googleSheets };
