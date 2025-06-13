import httpServer from "./app.js";
import * as dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📸 BarqPix API is ready to handle requests`);
});
