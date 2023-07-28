import "dotenv/config";
import { app } from "./app.js";

const port = Number.parseInt(process.env.API_PORT ?? "3000");

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
