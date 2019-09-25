const fs = require('fs');
module.exports = {
  client: {
    includes: ["./graphql/*.gql"],
    service: {
      name: 'github',
      url: 'https://api.github.com/graphql',
      headers: {
        authorization: 'Bearer ' + fs.readFileSync('../api-auth-token.txt', { encoding: "utf-8" })
      },
    }
  }
};
