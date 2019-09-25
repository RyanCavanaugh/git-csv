module.exports = {
  client: {
    includes: ["./graphql/*.gql"],
    service: {
      name: 'github',
      localSchemaFile: './github.json'
    }
  }
};
