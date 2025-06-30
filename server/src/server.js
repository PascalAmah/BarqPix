import httpServer from "./app.js";
import * as dotenv from "dotenv";
import { photoController } from "./controllers/photoController.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const CLEANUP_INTERVAL = 30 * 60 * 1000;

const scheduleCleanup = () => {
  setInterval(async () => {
    await photoController.cleanupExpiredQuickShares();
  }, CLEANUP_INTERVAL);

  console.log(
    `🧹 Scheduled quick share cleanup every ${CLEANUP_INTERVAL / 60000} minutes`
  );
};

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📸 BarqPix API is ready to handle requests`);

  scheduleCleanup();
});
