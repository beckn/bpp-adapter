import { startAppServer } from "./src/server";


import AppError, { HandleError } from "./src/library/exception";
import Logger from "./src/library/logger";

async function start() {
  // 🦉 Array of entry point is being used to support more entry-points kinds like message queue, scheduled job,
  return Promise.all([startAppServer()]);
}

start()
  .then((startResponses) => {
    Logger.info(
      `The app has started successfully at http://localhost:${startResponses[0].port}`,
      { name: "Application" }
    );
  })
  .catch((error) => {
    // ️️️✅ Best Practice: A failure during startup is catastrophic and should lead to process exit (you may retry before)
    // Consequently, we flag the error as catastrophic
    HandleError(new AppError("startup failure", error.message, 500, false));
  });
