rmdir /s /q graphql_data
call tsc
call node bin/graphql-fetch.js
call node bin/graphql-treeage.js

