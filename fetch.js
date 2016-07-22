/// <reference path="github.d.ts" />
"use strict";
var fs = require('fs');
var https = require('https');
var path = require('path');
var dataPath = path.join(__dirname, "data");
var oath = JSON.parse(fs.readFileSync('../search-auth.json', 'utf-8'));
var rateLimit;
function minifyIssue(issue) {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        labels: issue.labels.map(function (x) { return x.name; }),
        state: issue.state,
        pull_request: !!issue.pull_request,
        created_at: issue.created_at,
        created_by: issue.user.login,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        assignees: issue.assignees.map(function (x) { return x.login; })
    };
}
function githubRequest(prefix, owner, repo, path, params, format, done) {
    if (format === undefined)
        format = 'text/json';
    rateLimit--;
    if (rateLimit === 0) {
        console.log('Aborting because we are about to hit the rate limit. Try again later.');
        return;
    }
    params['client_id'] = oath['client-id'];
    params['client_secret'] = oath['client-secret'];
    var parts = [prefix, owner, repo, path].filter(function (s) { return !!s; });
    var paramStr = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    var options = {
        host: 'api.github.com',
        path: '/' + parts.join('/') + '?' + paramStr,
        headers: {
            'User-Agent': 'RyanCavanaugh',
            'Accept': format
        },
        method: 'GET'
    };
    https.get(options, function (res) {
        var data = '';
        res.on('data', function (d) {
            data = data + d;
        });
        res.on('end', function () {
            done(data);
        });
    });
}
function getPagedData(prefix, owner, repo, path, params, format, per_page, done, transform) {
    var myParams = JSON.parse(JSON.stringify(params));
    next(1);
    var result = [];
    function next(pageNumber) {
        myParams['page'] = pageNumber.toString();
        myParams['per_page'] = per_page.toString();
        githubRequest(prefix, owner, repo, path, myParams, format, function (data) {
            var parsedData = JSON.parse(data);
            if (per_page === undefined)
                per_page = parsedData.length;
            result = result.concat(transform ? parsedData.map(transform) : parsedData);
            if (parsedData.length < per_page) {
                done(result);
            }
            else {
                next(pageNumber + 1);
            }
        });
    }
}
function fetchIssues(done) {
    var params = {};
    // Sort by issue 1, 2, 3, ... so that we don't have page overlap issues
    params['sort'] = 'created';
    params['direction'] = 'asc';
    params['state'] = 'all';
    getPagedData('repos', 'Microsoft', 'TypeScript', 'issues', params, undefined, 100, function (data) {
        done(data);
    }, minifyIssue);
}
function getDataFilePath(issue) {
    return path.join(dataPath, issue.number + ".json");
}
function parseTimestamp(t) {
    return +(new Date(t));
}
function fetchIssueData(issue, done) {
    var filename = getDataFilePath(issue);
    fs.exists(filename, function (exists) {
        if (exists) {
            fs.readFile(filename, 'utf-8', function (err, data) {
                var storedData = JSON.parse(data);
                if (storedData.fetchTimestamp >= parseTimestamp(issue.updated_at)) {
                    done();
                }
                else {
                    update();
                }
            });
        }
        else {
            update();
        }
    });
    function update() {
        var fetchTimestamp = Date.now();
        console.log("Download issue data for " + issue.number);
        getPagedData('repos', 'Microsoft', 'TypeScript', "issues/" + issue.number + "/comments", {}, undefined, 100, function (comments) {
            getPagedData('repos', 'Microsoft', 'TypeScript', "issues/" + issue.number + "/events", {}, undefined, 100, function (events) {
                var data = {
                    comments: comments,
                    events: events,
                    fetchTimestamp: fetchTimestamp,
                    issue: issue
                };
                fs.writeFile(filename, JSON.stringify(data, undefined, 2), 'utf-8', function (err) {
                    if (err)
                        throw err;
                    done();
                });
            });
        });
    }
}
function fetchIssuesData(data) {
    next();
    function next() {
        if (data.length === 0)
            return;
        var issue = data.pop();
        fetchIssueData(issue, next);
    }
}
function main() {
    var indexFilename = 'issue-index.json';
    console.log('Fetch issue index');
    fs.exists(indexFilename, function (exists) {
        if (exists) {
            console.log('Issue index exists already');
            fs.readFile(indexFilename, 'utf-8', function (err, data) {
                if (err)
                    throw err;
                fetchIssuesData(JSON.parse(data));
            });
        }
        else {
            fetchIssues(function (issues) {
                console.log('Downloading issue index');
                fs.writeFile(indexFilename, JSON.stringify(issues, undefined, 2), 'utf-8', function (err) {
                    if (err)
                        throw err;
                    fetchIssuesData(issues);
                });
            });
        }
    });
}
githubRequest('rate_limit', undefined, undefined, undefined, {}, undefined, function (rateLimitStr) {
    var rates = JSON.parse(rateLimitStr);
    rateLimit = rates['rate']['remaining'];
    console.log(rateLimitStr);
    console.log('Started up; remaining rate limit = ' + rateLimit);
    main();
});
