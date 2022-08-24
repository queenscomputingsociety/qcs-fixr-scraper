const { parse } = require("csv-parse");
require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { googleSheets } = require("./sheets");

const processData = async () => {
  console.log("[PD] Reading CSV...");
  fs.readdir(config.downloadDir, (err, files) => {
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

      fs.createReadStream(path.join(config.downloadDir, file)).pipe(parser);
    }
  });
};

module.exports = {
  processData,
};
