const schedule = require("node-schedule");
const creds = require("../creds");
const { main } = require("./app");

process.on("SIGINT", function () {
  schedule.gracefulShutdown().then(() => process.exit(0));
});

//Run at minute 0 of every hour
schedule.scheduleJob(`0 */${creds.runEvery} * * *`, () => {
  console.log("Starting run at " + new Date());
  main();
});

//Run it once on startup
main();
