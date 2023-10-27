import * as React from "preact";
import * as path from "path";
import * as fs from "fs/promises";
import * as ssr from "preact-render-to-string";
import * as io from "@ryancavanaugh/git-csv-graphql-io";

const peopleToIgnore = ["typescript-bot", "RyanCavanaugh", "ghost"];

// Run last 5 days
const cutoffDate = (new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
const rootDir = path.join(__dirname, "../../../data/recent/microsoft/TypeScript");

main();

async function main() {
    const items = await loadIssues();
    fs.writeFile(path.join(__dirname, "../report.html"), ssr.render(<HTML issues={items} />));
}

function isRecentTimelineItem(item: io.TimelineItem) {
    if ('createdAt' in item) {
        if (peopleToIgnore.includes(getActor(item))) return false;
        return +(new Date(item.createdAt)) > +cutoffDate;
    }
    return false;
}

async function loadIssues() {
    const itemsToRender: IssueProps[] = [];
    const issues = await fs.readdir(rootDir);
    issues.reverse();
    for (const file of issues) {
        const filePath = path.join(rootDir, file);
        const data: io.Issue = JSON.parse(await fs.readFile(filePath, "utf-8"));
        if (data.timelineItems.nodes.some(e => e && isRecentTimelineItem(e))) {
            // itemsToRender.push(data);
            itemsToRender.push({
                title: data.title,
                url: data.url,
                number: data.number.toString(),
                events: data.timelineItems.nodes.filter(notNull),
                updatedAt: data.updatedAt,
                reactions: data.reactionGroups,
                state: data.closed ? "OPEN" as const : "CLOSED" as const
            });
        }
    }
    itemsToRender.sort((a, b) => {
        const aTime = +(new Date(getLatestUnignoredItem(a).createdAt));
        const bTime = +(new Date(getLatestUnignoredItem(b).createdAt));
        return bTime - aTime;
    });
    return itemsToRender;
}

function getLatestUnignoredItem(issue: IssueProps): io.TimelineItem & { createdAt: string } {
    const unfiltered = issue.events.filter(t => isRecentTimelineItem(t));
    return unfiltered[unfiltered.length - 1] as any;
}

type HtmlProps = {
    issues: IssueProps[];
}

function HTML(top: HtmlProps) {
    return <html>
        <title>TypeScript Daily Report for {(new Date()).toLocaleDateString()}</title>
        <link rel="stylesheet" href="./style.css" />
        <body>
            <div id="main">
                {...top.issues.map((i, k) => <Issue key={k} {...i} />)}
            </div>
        </body>
    </html>
}

type IssueProps = {
    number: string;
    state: "OPEN" | "CLOSED" | "MERGED";
    url: string;
    title: string;
    events: io.TimelineItem[];
    updatedAt: string;
    reactions: io.Reactions;
}
function Issue(props: IssueProps) {
    const eventsToShow = [...props.events];
    // Find the first new event; remove everything before the one before that
    for (let i = 1; i < eventsToShow.length; i++) {
        if (isRecentTimelineItem(eventsToShow[i])) {
            eventsToShow.splice(0, i - 1);
            break;
        }
    }

    return <div class="issue">
        <h1><a href={props.url}><Symbol {...props} /> <span class="number-ref">#{props.number}</span></a> {props.title}</h1>
        <ReactionBar reactions={props.reactions} />
        <div class="events">
            {...eventsToShow.map((e, k) => <Event key={k} {...e} />)}
        </div>
    </div>;
}

function Symbol(props: IssueProps) {
    if (props.url.includes("/issues/")) {
        return <span class={props.state}>⊚</span>;
    } else {
        return <span class={props.state}>∏</span>;
    }
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

function TimeDisplay({ date }: { date: Date}) {
    const diff = Date.now() - +date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.ceil(minutes / 60);
    const days = Math.ceil(hours / 24);
    let text;
    if (minutes < 60) {
        text = `${minutes} minutes ago`;
    } else if (hours < 24) {
        text = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        text = `${days} day${days > 1 ? 's' : ''} ago`
    } else {
        text = `on ${date.toLocaleDateString()}`;
    }
    return <span title={date.toLocaleDateString() + " " + date.toLocaleTimeString()}>{text}</span>;
}

function ReactionBar(props: { reactions: io.Reactions }) {
    const parts: React.JSX.Element[] = [];
    const lookup: any = {
        "THUMBS_UP": "👍",
        "THUMBS_DOWN": "👎",
        "HEART": "❤️",
        "HOORAY": "🎉",
        "EYES": "👀",
        "ROCKET": "🚀",
        "CONFUSED": "😕",
        "LAUGH": "😆"
    }
    for (const p of props.reactions) {
        if (p.reactors.totalCount > 0) {
            parts.push(<span class="reaction-group">
                <span class="emoji">{lookup[p.content] ?? p.content}</span>
                <span class="count">{p.reactors.totalCount}</span>
            </span>);
        }
    }
    if (parts.length === 0) return <></>;
    return <div class="reaction-bar">{...parts}</div>;
}

function LinkTo(props: { item: io.TimelineItem, children: any }) {
    if ('url' in props.item) {
        return <a href={props.item.url}>{props.children}</a>
    }
    return props.children;
}

function Event(props: io.TimelineItem) {
    const author = getActor(props);
    const date = "createdAt" in props ? new Date(props.createdAt) : null;
    const dateDisplay = date ? <LinkTo item={props}><TimeDisplay date={date} /></LinkTo> : null;
    const authorDisplay = author ? <Avatar user={author} /> : null;

    const verb = getSimpleVerb(props);
    if (verb) {
        return <SimpleAction {...props} />
    }
    if (props.__typename === "LabeledEvent" || props.__typename == "UnlabeledEvent") {
        return <LabelEventDisplay {...props} />;
    }

    return <div class="event">
        <span class="oneliner">
            {authorDisplay}
            {authorDisplay ? '\xA0' : null}
            {dateDisplay}
        </span>
        {props.__typename === "IssueComment" ? <Comment {...props} /> : null}
    </div>;
}

function getSimpleVerb(props: io.TimelineItem) {
    switch (props.__typename) {
        case "ClosedEvent": return "closed";
        case "ReopenedEvent": return "reopened";
        case "LockedEvent": return "locked";
        case "MilestonedEvent": return "milestoned";
        case "AssignedEvent": return "assigned";
        case "UnassignedEvent": return "unassigned";
    }
    return null;
}

function Avatar(props: { user: string }) {
    return <span class="author"><img src={`https://github.com/${props.user}.png?size=40`} />@{props.user}</span>;
}

function DateDisplay(props: { date: Date | null }) {
    if (props.date === null) return null;
    return <span class="timestamp"><TimeDisplay date={props.date} /></span>;
}

function SimpleAction(props: io.TimelineItem) {
    const author = getActor(props);
    const date = "createdAt" in props ? new Date(props.createdAt) : null;

    return <div class="event">
        <span class="oneliner">
            <Avatar user={author} />
            &nbsp;
            {getSimpleVerb(props)}
            &nbsp;
            <DateDisplay date={date} />
        </span>
    </div>;
}

function Comment(props: io.IssueCommentEvent) {
    return <>
        <div class="comment-body" dangerouslySetInnerHTML={{ __html: props.bodyHTML }} />
        <ReactionBar reactions={props.reactionGroups} />
    </>;
}

function LabelEventDisplay(props: io.TimelineItem & { __typename: "LabeledEvent" | "UnlabeledEvent" }) {
    const style: any = {
        backgroundColor: '#' + props.label.color
    };
    const luminance =
        parseInt(props.label.color.substring(0, 2), 16) * 0.212 +
        parseInt(props.label.color.substring(2, 4), 16) * 0.715 +
        parseInt(props.label.color.substring(4, 6), 16) * 0.07;
    if (luminance > 128) {
        style.color = 'black';
    }
    return <div class="event">
        <span class="oneliner">
            <Avatar user={props.actor.login} />
            &nbsp;
            {props.__typename === "LabeledEvent" ? "added" : "removed"}
            &nbsp;
            <span class="label" style={style}>{props.label.name}</span>
            &nbsp;
            <DateDisplay date={new Date(props.createdAt)} />
        </span>
    </div>;
}

function notNull<T>(x: T | null): x is T {
    return x !== null;
}
