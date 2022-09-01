
const fs = require("fs");
const path = require("path");
const config = require("../config");
require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });

const removeAllFilesInDirectory = async (dir) => {
  console.log(`[RAFD] Removing all files in directory "${config.downloadDir}"`);

  fs.mkdir(config.downloadDir, (err) => {
    return;
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

module.exports = {
  removeAllFilesInDirectory,
};
