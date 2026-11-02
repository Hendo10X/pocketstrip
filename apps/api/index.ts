import { PocketStripServer } from "./server";

const pocketStrip = new PocketStripServer();
pocketStrip.setupSwaggerDocs();
pocketStrip.setupCorsConfig();
pocketStrip.setupRoutes();
pocketStrip.registerRoutes();

const pocketstripApp = pocketStrip.getApp();

export default {
    port: Number(process.env.PORT ?? 4000),
    fetch: pocketstripApp.fetch,
    pocketstripApp,
};
