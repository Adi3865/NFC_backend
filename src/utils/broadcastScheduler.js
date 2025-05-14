const broadcastService = require("../services/broadcastService");

/**
 * Schedule function to run periodically and process broadcasts
 */
const scheduleTask = () => {
  // Check if we're in test environment - don't run tasks
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.log("Scheduling broadcast processing task (every 15 minutes)...");

  // Process scheduled broadcasts every 15 minutes
  setInterval(async () => {
    try {
      console.log("Running scheduled broadcast processing task...");
      const results = await broadcastService.processScheduledBroadcasts();

      if (results.length > 0) {
        console.log(`Processed ${results.length} scheduled broadcasts`);
      }
    } catch (error) {
      console.error("Error processing scheduled broadcasts:", error);
    }
  }, 15 * 60 * 1000); // 15 minutes
};

module.exports = { scheduleTask };
