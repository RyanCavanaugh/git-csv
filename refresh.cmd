del data\issue-index.json
call tsc
call node bin/fetch.js
call node bin/make-csv.js
