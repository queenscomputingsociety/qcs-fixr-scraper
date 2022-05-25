const showBanner = require("node-banner");
const creds = require("../creds");
const { processData } = require("./processData");
const { removeAllFilesInDirectory } = require("./removeAllFiles");
const { scrape } = require("./scrape");

const main = async () => {
  await showBanner(
    "FIXR  SCRAPER",
    "Queen's Computing Society, Queen's University Belfast\n 2022 - James McFarland."
  );
  await removeAllFilesInDirectory(creds.downloadDir);
  await scrape(true);
  await processData();
};

module.exports = { main };
