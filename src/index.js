const schedule = require("node-schedule");
const config = require("../config");
const { main } = require("./app");

process.on("SIGINT", function () {
  schedule.gracefulShutdown().then(() => process.exit(0));
});

//Run at minute 0 of every hour
schedule.scheduleJob(`0 */${config.runEvery} * * *`, () => {
  console.log("Starting run at " + new Date());
  main();
  console.log("Run complete")
});

//Run it once on startup
main();
