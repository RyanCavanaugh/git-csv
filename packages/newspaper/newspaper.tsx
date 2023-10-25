import * as React from "preact";
import * as path from "path";
import * as fs from "fs/promises";
import * as ssr from "preact-render-to-string";
import * as marked from "marked";
import * as io from "@ryancavanaugh/git-csv-graphql-io";

// Run last 3 days
const cutoffDate = (new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
const rootDir = path.join(__dirname, "../../../data/ts-all/microsoft/TypeScript");
marked.use({
    async: false,
    gfm: true
});
const renderMarkdown = (s: string) => marked.marked(s);

main();

async function main() {
    const items = await loadIssues();
    fs.writeFile("report.html", ssr.render(<HTML issues={items} />));
}

function isRecentTimelineItem(item: io.TimelineItem) {
    if ('createdAt' in item) {
        return +(new Date(item.createdAt)) > +cutoffDate;
    }
    return false;
}

async function loadIssues() {
    const itemsToRender: IssueProps[] = [];
    const issues = await fs.readdir(path.join(rootDir, "issue"));
    issues.reverse();
    for (const file of issues) {
        const filePath = path.join(rootDir, "issue", file);
        const data: io.Issue = JSON.parse(await fs.readFile(filePath, "utf-8"));
        if (data.timelineItems.edges.some(e => e && isRecentTimelineItem(e.node))) {
            // itemsToRender.push(data);
            itemsToRender.push({
                title: data.title,
                url: data.url,
                number: data.number.toString(),
                events: data.timelineItems.edges.map((e: any) => e.node)
            });
            console.log(data.title);
        }
        if (itemsToRender.length === 10) break;
    }
    return itemsToRender;
}

type HtmlProps = {
    issues: IssueProps[];
}

function HTML(top: HtmlProps) {
    return <html>
        <title>TypeScript Daily Report for {(new Date()).toLocaleDateString()}</title>
        <link rel="stylesheet" href="./style.css" />
        <body>
            {...top.issues.map((i, k) => <Issue key={k} {...i} />)}
        </body>
    </html>
}

type IssueProps = {
    number: string;
    url: string;
    title: string;
    events: io.TimelineItem[];
}
function Issue(props: IssueProps) {
    const eventsToShow = [...props.events];
    // Find the first new event; remove everything before the one before that
    for (let i = 1; i < eventsToShow.length; i++) {
        if (isRecentTimelineItem(eventsToShow[i])) {
            eventsToShow.splice(0, i - 1);
            console.log(i);
            break;
        }
    }

    return <div class="issue">
        <h1><a href={props.url}><span class="number-ref">#{props.number}</span></a> {props.title}</h1>
        <div class="events">
            {...eventsToShow.map((e, k) => <Event key={k} {...e} />)}
        </div>
    </div>;
}

function getActor(item: io.TimelineItem) {
    if ("author" in item) {
        return item.author?.login ?? "ghost";
    }
    if ("actor" in item) {
        return item.actor?.login ?? "ghost";
    }
    return "ghost";
}

function Event(props: io.TimelineItem) {
    const author = getActor(props);
    const date = "createdAt" in props ? new Date(props.createdAt) : null;
    const dateDisplay = date ? <a href="">at <span class="date">{date.toLocaleDateString()} {date.toLocaleTimeString()}</span></a> : null;
    const authorDisplay = author ? <Avatar user={author} /> : null;

    const verb = getSimpleVerb(props);
    if (verb) {
        return <SimpleAction {...props} />
    }

    return <div class="event">
        <span class="byline">
            {authorDisplay}
            {authorDisplay ? '\xA0' : null}
            {dateDisplay}
        </span>
        &nbsp;
        {props.__typename === "IssueComment" ? <Comment {...props} /> : null}
    </div>;
}

function getSimpleVerb(props: io.TimelineItem) {
    switch (props.__typename) {
        case "ClosedEvent": return "closed";
        case "ReopenedEvent": return "reopened";
        case "LabeledEvent": return <>added label <span class="label">{props.label.name}</span></>;
        case "UnlabeledEvent": return <>removed label <span class="label">{props.label.name}</span></>;
        case "LockedEvent": return "locked";
    }
    return null;
}

function Avatar(props: { user: string }) {
    return <span class="author"><img src={`https://github.com/${props.user}.png?size=40`} />@{props.user}</span>;
}

function DateDisplay(props: { date: Date | null }) {
    if (props.date === null) return null;
    return <span class="timestamp">at&nbsp;{props.date.toLocaleDateString()}</span>;
}
function SimpleAction(props: io.TimelineItem) {
    const author = getActor(props);
    const date = "createdAt" in props ? new Date(props.createdAt) : null;

    return <div class="event">
        <span class="byline">
            <Avatar user={author} /> {getSimpleVerb(props)} <DateDisplay date={date} />
        </span>
    </div>;
}

function Comment(props: io.IssueCommentEvent) {
    return <div class="comment-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(props.body) }} />;
}

function LabelEventDisplay(props: io.TimelineItem & { __typename: "LabeledEvent" | "UnlabeledEvent"}) {
    return <span>{props.__typename === "LabeledEvent" ? "added" : "removed"} <span class="label">{props.label.name}</span></span>;
}
