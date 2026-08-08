import { PocketStripServer } from "./server";

let pocketstripApp;

(() => {
    const pocketStrip = new PocketStripServer();
    pocketStrip.setupSwaggerDocs();
    pocketStrip.setupCorsConfig();
    pocketStrip.setupRoutes();

    pocketstripApp = pocketStrip.getApp();
   
})();

export default {
    port: 4000,
    fetch: pocketstripApp.fetch,
    pocketstripApp,
}