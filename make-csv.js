"use strict";
var fs = require('fs');
function simplify(i) {
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
var data = JSON.parse(fs.readFileSync('issues.json', 'utf-8')).filter(function (issue) { return (issue['pull_request'] === undefined); }).map(simplify);
data.sort(function (lhs, rhs) { return rhs.createdAt - lhs.createdAt; });
// Collect all the label names
var labels = {};
for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
    var issue = data_1[_i];
    for (var _a = 0, _b = issue.labels; _a < _b.length; _a++) {
        var label = _b[_a];
        labels[label.name] = label.name;
    }
}
var headers = [];
headers.push('Number', 'Title', 'State', 'Comments', 'Creator', 'Assignee', 'Created', 'Updated', 'Created-Month', 'Created-Year', 'Had-Template', 'Best-Label');
for (var _c = 0, _d = Object.keys(labels); _c < _d.length; _c++) {
    var label = _d[_c];
    headers.push(label);
    headers.push('Is ' + label);
}
var labelPriority = [
    'Bug',
    'Suggestion',
    'Question',
    'By Design',
    'Duplicate',
    'External',
    'Needs More Info',
    'Website Logo',
    'Discussion',
    'Docs',
    'Other'
];
var rows = [headers.join(',')];
for (var _e = 0, data_2 = data; _e < data_2.length; _e++) {
    var issue = data_2[_e];
    var created = new Date(issue.createdAt);
    var createdMonth = created.getMonth() + 1;
    var createdMonthString = created.getFullYear() + '-' + ((createdMonth < 10) ? '0' : '') + createdMonth;
    var cols = [
        issue.number.toString(),
        '"' + issue.title.replace(/"/g, "'") + '"',
        issue.state,
        issue.comments.toString(),
        issue.loggedByName,
        issue.assignedTo,
        created.toLocaleDateString(),
        new Date(issue.updatedAt).toLocaleDateString(),
        createdMonthString,
        created.getFullYear().toString(),
        issue.createdAt > Date.parse('Feb 17, 2016 11:41:00 AM PST') ? 'TRUE' : 'FALSE'
    ];
    var bestLabel = 'Other';
    var _loop_1 = function(label) {
        if (issue.labels.some(function (lab) { return lab.name === label; })) {
            bestLabel = label;
        }
    };
    for (var _f = 0, labelPriority_1 = labelPriority; _f < labelPriority_1.length; _f++) {
        var label = labelPriority_1[_f];
        _loop_1(label);
    }
    cols.push(bestLabel);
    var _loop_2 = function(label) {
        if (issue.labels.some(function (lab) { return lab.name === label; })) {
            cols.push('true');
            cols.push('1');
        }
        else {
            cols.push('false');
            cols.push('0');
        }
    };
    for (var _g = 0, _h = Object.keys(labels); _g < _h.length; _g++) {
        var label = _h[_g];
        _loop_2(label);
    }
    rows.push(cols.join(','));
}
fs.writeFile('issues.csv', rows.join('\r\n'));
