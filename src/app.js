const showBanner = require("node-banner");
const config = require("../config");
const { removeAllFilesInDirectory } = require("./removeAllFiles");
const { scrape } = require("./scrape");
const { hook } = require("./hook");
const { sheetsv2 } = require("./sheets2");
const { uploadData } = require("./uploadData");

const main = async () => {
  await showBanner(
    "FIXR  SCRAPER",
    "Queen's Computing Society, Queen's University Belfast\n 2022 - James McFarland."
  );
  await removeAllFilesInDirectory(config.downloadDir);
  await scrape(true);
  const data = await hook();
  await uploadData(data)
  console.log("[APP] Run complete...")
  return
};

module.exports = { main };
