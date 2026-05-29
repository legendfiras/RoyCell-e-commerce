import { app } from "./app";
import { config } from "./config";
import { connectDb } from "./db";

connectDb()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Roy Cell server running on port ${config.port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
