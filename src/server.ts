import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.log(`demo-shop-api listening on http://localhost:${port}`);
});
