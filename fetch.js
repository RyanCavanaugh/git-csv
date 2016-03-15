"use strict";
var fs = require('fs');
var https = require('https');
var oath = JSON.parse(fs.readFileSync('../search-auth.json', 'utf-8'));
var rateLimit;
function githubRequest(prefix, owner, repo, path, params, format, done) {
    if (format === undefined)
        format = 'text/json';
    rateLimit--;
    if (rateLimit === 0) {
        console.log('Aborting because we are about to hit the rate limit. Try again later.');
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
function getPagedData(prefix, owner, repo, path, params, format, done) {
    var myParams = JSON.parse(JSON.stringify(params));
    var per_page = +params['per_page'];
    next(1);
    var result = [];
    function next(pageNumber) {
        myParams['page'] = pageNumber.toString();
        githubRequest(prefix, owner, repo, path, myParams, format, function (data) {
            var parsedData = JSON.parse(data);
            if (per_page === undefined)
                per_page = parsedData.length;
            result = result.concat(parsedData);
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
    params['sort'] = 'created';
    params['per_page'] = '100';
    params['state'] = 'all';
    getPagedData('repos', 'Microsoft', 'TypeScript', 'issues', params, undefined, function (data) {
        done(data);
    });
}
function reduceIssues(issues) {
    function reduce(i) {
        return {
            assignedTo: i.assignee ? i.assignee.login : '',
            body: i.body.substr(0, 250),
            comments: i.comments,
            createdAt: Date.parse(i.created_at),
            labels: i.labels,
            loggedByAvatar: i.user.avatar_url,
            loggedByName: i.user.login,
            milestone: i.milestone ? i.milestone.title : '',
            number: i.number,
            state: i.state,
            title: i.title,
            updatedAt: Date.parse(i.updated_at)
        };
    }
    return issues.map(reduce);
}
function fetchStars(done) {
    var params = {};
    params['per_page'] = '100';
    getPagedData('repos', 'Microsoft', 'TypeScript', 'stargazers', params, 'application/vnd.github.v3.star+json', function (data) {
        done(data);
    });
}
githubRequest('rate_limit', undefined, undefined, undefined, {}, undefined, function (rateLimitStr) {
    var rates = JSON.parse(rateLimitStr);
    rateLimit = rates['rate']['remaining'];
    console.log('Started up; remaining rate limit = ' + rateLimit);
    main();
});
function main() {
    /*
    fetchIssues(issues => {
        fs.writeFileSync('issues.json', JSON.stringify(reduceIssues(issues)), 'utf-8');
    });
    */
    fetchStars(function (stars) {
        var csv = stars
            .map(function (st) { return ({ user: st.user.login, date: (new Date(st.starred_at).toLocaleDateString()) }); })
            .map(function (entry) { return entry.user + ',' + entry.date; })
            .join('\r\n');
        fs.writeFileSync('stars.csv', 'User,Date\r\n' + csv, 'utf-8');
    });
}
