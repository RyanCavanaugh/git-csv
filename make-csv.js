"use strict";
var fs = require('fs');
var path = require('path');
function timestampToDate(s) {
    return new Date(s).toLocaleDateString();
}
var CSV = (function () {
    function CSV() {
        this.colNames = [];
        this.producers = [];
    }
    CSV.prototype.addColumn = function (name, funcOrKey) {
        this.colNames.push(name);
        this.producers.push(funcOrKey);
    };
    CSV.quote = function (s) {
        return '"' + s.replace(/"/g, "'").replace(/^--/, ' --') + '"';
    };
    CSV.prototype.generate = function (arr) {
        var _this = this;
        var result = [];
        result.push(this.colNames.join(','));
        arr.forEach(function (entry) {
            var cells = [];
            _this.producers.forEach(function (key) {
                if (typeof key === 'string') {
                    cells.push(entry[key]);
                }
                else {
                    cells.push(key(entry));
                }
            });
            result.push(cells.map(CSV.quote).join(','));
        });
        return result;
    };
    return CSV;
}());
var LabelSynonyms = {
    "Working as Intended": "By Design",
    "Design Limitation": "By Design",
    "Too Complex": "Declined",
    "Out of Scope": "Declined",
    "Migrate-a-thon": "Misc"
};
var LabelPriority = [
    "Misc",
    "Website Logo",
    "Design Notes",
    "Duplicate",
    "Fixed",
    "By Design",
    "Declined",
    "Won't Fix",
    "Accepting PRs",
    "External",
    "Question",
    "Bug",
    "Suggestion",
    "Needs Proposal",
    "Needs More Info",
    "Awaiting More Feedback",
    "In Discussion",
    "Docs",
    "Discussion",
    "Infrastructure",
    "Spec"
];
function bestLabel(issue) {
    var realLabels = issue.labels.map(function (lbl) {
        return LabelSynonyms[lbl] || lbl;
    });
    for (var _i = 0, LabelPriority_1 = LabelPriority; _i < LabelPriority_1.length; _i++) {
        var lbl = LabelPriority_1[_i];
        if (realLabels.indexOf(lbl) >= 0) {
            return lbl;
        }
    }
    return undefined;
}
function merge(base, extras) {
    Object.keys(base).forEach(function (k) { return extras[k] = base[k]; });
    return extras;
}
function getActivityRecords(issue) {
    var result = [];
    var base = {
        issueId: issue.issue.number,
        pullRequest: issue.issue.pull_request
    };
    issue.comments.forEach(function (comment) {
        result.push(merge(base, {
            activity: "comment",
            actor: comment.user.login,
            date: new Date(comment.created_at),
            length: comment.body.length
        }));
    });
    issue.events.forEach(function (event) {
        result.push(merge(base, {
            activity: event.event,
            actor: event.actor ? event.actor.login : '(none)',
            date: new Date(event.created_at),
            length: 0
        }));
    });
    result.push(merge(base, {
        activity: 'created',
        actor: issue.issue.created_by || '(none)',
        date: new Date(issue.issue.created_at),
        length: 0
    }));
    return result;
}
var data = JSON.parse(fs.readFileSync('issue-index.json', 'utf-8'));
var issues = new CSV();
issues.addColumn('Issue ID', function (i) { return i.number.toString(); });
issues.addColumn('Title', function (i) { return i.title; });
issues.addColumn('Created Date', function (i) { return timestampToDate(i.created_at); });
issues.addColumn('Created By', function (i) { return i.created_by || '(none)'; });
issues.addColumn('Type', function (i) { return i.pull_request ? "PR" : "Issue"; });
issues.addColumn('State', function (i) { return i.state; });
issues.addColumn('Label', function (i) { return i.pull_request ? "PR" : (bestLabel(i) || (i.state === 'closed' ? 'Closed' : 'Unlabeled')); });
fs.writeFile('issues.csv', issues.generate(data).join('\r\n'), 'utf-8');
var activity = new CSV();
activity.addColumn('Issue ID', function (i) { return i.issueId.toString(); });
activity.addColumn('Type', function (i) { return i.pullRequest ? "PR" : "Issue"; });
activity.addColumn('Activity', function (i) { return i.activity; });
activity.addColumn('User', function (i) { return i.actor; });
activity.addColumn('Date', function (i) { return i.date.toLocaleDateString(); });
activity.addColumn('Length', function (i) { return i.length.toString(); });
var activities = [];
data.forEach(function (issue) {
    var file = path.join(__dirname, 'data', issue.number + ".json");
    var fileData = JSON.parse(fs.readFileSync(file, 'utf-8'));
    getActivityRecords(fileData).forEach(function (rec) { return activities.push(rec); });
});
fs.writeFile('activity.csv', activity.generate(activities).join('\r\n'), 'utf-8');
