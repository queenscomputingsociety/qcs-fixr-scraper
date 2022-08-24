const showBanner = require("node-banner");
const config = require("../config");
// const { processData } = require("./processData");
const { removeAllFilesInDirectory } = require("./removeAllFiles");
const { scrape } = require("./scrape");

const main = async () => {
  await showBanner(
    "FIXR  SCRAPER",
    "Queen's Computing Society, Queen's University Belfast\n 2022 - James McFarland."
  );
  await removeAllFilesInDirectory(config.downloadDir);
  await scrape(false);
  // await processData();
  return
};

module.exports = { main };
