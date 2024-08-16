import { processMoreBatches } from "./process-more-batches.js";

async function go() {
    const result = await processMoreBatches();
    if (result === "waiting") {
        console.log(`[${(new Date()).toLocaleTimeString()}] Wait 5 minutes.`);
        setTimeout(go, 5 * 60 * 1000)
    } else {
        console.log("Done!");
    }
}

go();
