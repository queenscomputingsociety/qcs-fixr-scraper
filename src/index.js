const schedule = require("node-schedule");
const { main } = require("./app");

process.on("SIGINT", function () {
  schedule.gracefulShutdown().then(() => process.exit(0));
});

//Run at minute 0 of every hour
schedule.scheduleJob("0 */1 * * *", () => {
  console.log("Starting run at " + new Date());
  main();
});
