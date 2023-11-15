import * as fs from 'fs/promises';
import * as url from 'url';
import * as path from 'path';
import axios from 'axios';
import { sleep } from './utils.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const queriesRoot = path.join(__dirname, "../queries");

export async function query(definitionFileName: string, variables: object | null) {
    let retryCount = 5;
    while (retryCount > 0) {
        try {
            return await doGraphQL(definitionFileName, variables);
        } catch (e: any) {
            if (e.response && e.response.status === 403) {
                // Abuse detection; back off
                console.log("Backing off from abuse detection");
                await sleep(60 * 1000);
                continue;
            }
            console.log(`Error during timeline fetch: ${e.message}; retry`);
            if (e.response) {
                console.log(`  data: ${JSON.stringify(e.response.data, undefined, 2)}`);
                console.log(`  status: ${e.response.status}`);
                console.log(`  headers: ${JSON.stringify(e.response.headers, undefined, 2)}`);
            }
            await sleep(3000);
            if (--retryCount === 0) {
                console.log(`Fatal error`);
                await fs.writeFile(`last-query.txt`, doGraphQL.lastQueryData, { encoding: "utf-8" });
                process.exit(-1);
            }
        }
    }

}

async function doGraphQL(definitionFileName: string, variables: object | null): Promise<unknown> {
    if (doGraphQL.lastRateLimit) {
        if (doGraphQL.lastRateLimit.cost * 10 > doGraphQL.lastRateLimit.remaining) {
            const reset = new Date(doGraphQL.lastRateLimit.resetAt);
            console.log(`Waiting until ${reset.toLocaleTimeString()} for rate limit to reset`);
            await sleep(+reset - +(new Date()));
        }
    }

    const importedGqls = new Map<string, true>();

    const lines = [`# import ${definitionFileName}`];
    for (let i = 0; i < lines.length; i++) {
        const match = /^# import (.+)$/.exec(lines[i]);
        if (match !== null) {
            const importTarget = match[1];
            if (importedGqls.has(importTarget)) continue;
            importedGqls.set(importTarget, true);
            const importedContent = await fs.readFile(path.join(queriesRoot, importTarget), { encoding: "utf-8" });
            const importedLines = importedContent.split(/\r?\n/g);
            lines.splice(i, 1, ...importedLines);
            i--;
        }
    }
    const query = lines.join("\n");
    const token = (await fs.readFile(path.join(__dirname, "../../../../api-auth-token.txt"), { encoding: "utf-8" })).trim();
    const url = `https://api.github.com/graphql`;
    const data = (variables === null) ? { query } : { query, variables };

    doGraphQL.lastQueryData = JSON.stringify(data, undefined, 2);
    const result = await axios(url, {
        headers: {
            "Authorization": `bearer ${token}`,
            "User-Agent": "RyanCavanaugh/git-csv"
        },
        method: "POST",
        data
    });

    if (result.status !== 200) {
        console.error(result.statusText);
        throw new Error(result.statusText);
    }
    if (result.data && result.data.data && "rateLimit" in result.data.data) {
        doGraphQL.lastRateLimit = result.data.data.rateLimit;
    }
    return result.data.data;
}
doGraphQL.lastRateLimit = undefined as undefined | { cost: number; remaining: number; resetAt: string };
doGraphQL.lastQueryData = "";
