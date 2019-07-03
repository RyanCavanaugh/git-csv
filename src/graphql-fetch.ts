import path = require('path');
import fs = require('fs-extra');
import axios from "axios";

const repoRoot = path.join(__dirname, "../");

async function doGraphQL(query: string, variables: object): Promise<unknown> {
    const token = await fs.readFile(path.join(repoRoot, "../api-auth-token.txt"), { encoding: "utf-8" });
    const url = `https://api.github.com/graphql`;
    // const data = { query: query + "\nvariables " + JSON.stringify(variables, undefined, 2) };
    const data = { query, variables };
    // data.query = data.query.replace(/\r?\n/g, '\n');
    console.log(JSON.stringify(data, undefined, 2));
    const result = await axios(url, {
        headers: {
            "Authorization": `bearer ${token}`,
            "User-Agent": "RyanCavanaugh/git-csv"
        },
        method: "POST",
        data
    });
    if (result.status !== 200) {
        throw new Error(result.statusText);
    }
    return result.data;
}

async function queryRepoIssues(issuesPerPage: number, cursor: string | null) {
    const definition = await fs.readFile(path.join(repoRoot, "graphql/issues.gql"), { encoding: "utf-8" });
    const query = `query GetRepoIssues($issuesPerPage: Int, $cursor: String = null) { ...repoIssues }`;
    const variables = { issuesPerPage, cursor: cursor };
    const data = await doGraphQL(definition + '\n' + query + definition, variables);
    console.log(JSON.stringify(data, undefined, 2));
}

queryRepoIssues(2, null).then(() => {
    console.log("done");
});
