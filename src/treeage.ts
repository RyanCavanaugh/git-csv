import fs = require("fs");
import path = require("path");

const dataRoot = path.join(__dirname, "../data");

export function visualizeNodeTree(root: Node<any>): string {
    const seenNodes: Node<any>[] = [];

    const lines: string[] = [];
    lines.push(`digraph treeage {`);
    lines.push(`    graph [splines = ortho];`);
    lines.push(`    node [shape = record];`);
    recordNode(root as ImplementedNode<any>);
    lines.push(`}`);
    return lines.join("\r\n");

    function recordNode(node: ImplementedNode<any>): string {
        const existing = seenNodes.indexOf(node);
        if (existing >= 0) {
            return `node_${existing}`;
        }

        const nodeName = `node_${seenNodes.push(node) - 1}`;
        lines.push(`    ${nodeName} [label="${node.description} (${node.hitCount})"];`)
        for (const path of node.paths) {
            const target = path[1] as ImplementedNode<any>;
            const targetName = recordNode(target);
            const pred = path[0] as any;
            lines.push(`    ${nodeName} -> ${targetName} [label="${pred.description || ""}"];`);
        }
        if (node.otherwiseNode) {
            const targetName = recordNode(node.otherwiseNode as ImplementedNode<any>);
            lines.push(`    ${nodeName} -> ${targetName} [label="else"];`);
        }

        return nodeName;
    }
}

type FirstParameterOf<T> = T extends (arg: infer A) => unknown ? A : never;

export type Predicate<T> = {
    (item: T): boolean;
    description?: string;
};

export type Action<T> = (item: T) => void;
export interface Node<T> {
    /**
     * Creates a new node and add a predicated link to it.
     * Returns the new node.
     */
    addPath(predicate: Predicate<T>): Node<T>;
    /**
     * Adds a predicated link to the specified node.
     */
    addPathTo(predicate: Predicate<T>, target: Node<T>): void;
    /**
     * Adds an action to occur on this node if none of its links are followed.
     */
    addTerminalAction(action: Action<T>): void;
    /**
     * Adds an action to always occur on this node if it is traversed.
     */
    addAlwaysAction(action: Action<T>): void;
    /**
     * Creates a node that is traversed to if no other links are traversed.
     */
    otherwise(): Node<T>;
    /**
     * Process this item by following any matched links and executing any actions.
     */
    process(item: T, catchHandler?: any): void;
    /**
     * Adds a description to this node.
     * Returns the same node.
     */
    describe(name: string): Node<T>;

    /**
     * Attaches a handler to be invoked if a node fails to follow a defined traversal of the graph.
     */
    catch(handler: (erroringItem: T, error: TreeageError) => void): void;

    /**
     * Returns true if this node has any paths which would be traversed for this item.
     */
    groupingPredicate(item: T): boolean;

    readonly description: string;
    readonly hitCount: number;
    readonly terminalHitCount: number;
}

export type ImplementedNode<T> = Node<T> & {
    paths: ReadonlyArray<[Predicate<T>, Node<T>]>;
    terminalActions: ReadonlyArray<Action<T>>;
    actions: ReadonlyArray<Action<T>>;
    otherwiseNode: Node<T> | undefined;
}

export type TreeageError = MultiplePathsMatchedError;

export type MultiplePathsMatchedError = {
    type: "multi-path",
    predicates: ReadonlyArray<Predicate<any>>
};

interface NodeOptions {
    pathMode: "first" | "single" | "multiple";
}

function assertNever(x: never) {
    throw new Error(`Impossible value ${x} observed`);
}

export function createGroupNode<T>() {
    const node = create<T>();

    const preds: Predicate<T>[] = [];

    function addGroupChild(predicate: Predicate<T>) {
        preds.push(predicate);
    }

    function predicate(item: T) {

    }

    return {
        node,
        predicate,
        addGroupChild
    };
}

export function create<T>(): Node<T> {
    const options: NodeOptions = {
        pathMode: "single"
    };
    const paths: [Predicate<T>, Node<T>][] = [];
    const terminalActions: Action<T>[] = [];
    const actions: Action<T>[] = [];
    let catchHandler: undefined | FirstParameterOf<Node<T>["catch"]> = undefined;
    let description = "(unnamed)";
    let otherwiseNode: Node<T> | undefined = undefined;

    let hitCount = 0;
    let terminalHitCount = 0;

    function describe(name: string) {
        description = name;
        return impl;
    }

    function process(item: T, parentCatcher: typeof catchHandler = undefined): void {
        hitCount++;

        let alreadyMatched = false;
        const matchedPaths: typeof paths = [];
        for (const path of paths) {
            if (path[0](item)) {
                matchedPaths.push(path);
            }
        }

        if (matchedPaths.length > 0) {
            switch (options.pathMode) {
                case "first":
                    matchedPaths[0][1].process(item, catchHandler || parentCatcher);
                    break;
                case "multiple":
                    for (const p of matchedPaths) {
                        p[1].process(item, catchHandler || parentCatcher);
                    }
                    break;
                case "single":
                    if (matchedPaths.length !== 1) {
                        const err: TreeageError = {
                            type: "multi-path",
                            predicates: matchedPaths.map(m => m[0])
                        };
                        const catchFunc = catchHandler || parentCatcher;
                        if (catchFunc) {
                            catchFunc(item, err);
                        } else {
                            console.log(JSON.stringify(err, undefined, 2));
                            throw err;
                        }
                    } else {
                        matchedPaths[0][1].process(item, catchHandler || parentCatcher);
                    }
                    break;
                default:
                    assertNever(options.pathMode);
                    break;
            }
        } else {
            if (otherwiseNode) {
                otherwiseNode.process(item, catchHandler || parentCatcher);
            } else {
                terminalHitCount++;
                for (const term of terminalActions) {
                    term(item);
                }
            }
        }

        for (const always of actions) {
            always(item);
        }
    }

    function addPath(predicate: Predicate<T>): Node<T> {
        const target = create<T>();
        if (predicate.description) {
            target.describe(predicate.description);
        }

        paths.push([predicate, target]);
        return target;
    }

    function addPathTo(predicate: Predicate<T>, target: Node<T>) {
        paths.push([predicate, target]);
    }

    function addTerminalAction(action: Action<T>) {
        terminalActions.push(action);
    }

    function addAlwaysAction(action: Action<T>) {
        actions.push(action);
    }

    function otherwise() {
        if (otherwiseNode) throw new Error("Cannot call 'otherwise' twice on this node");
        return otherwiseNode = create<T>();
    }

    function catchImpl(handler: (item: T, error: TreeageError) => void) {
        catchHandler = handler;
    }

    function groupingPredicate(item: T) {
        return paths.some(p => p[0](item));
    }
    Object.defineProperties(groupingPredicate, {
        description: {
            get() {
                return paths.map(p => p[0].description || "??").join(" or ");
            }
        }
    });

    const impl: ImplementedNode<T> = {
        addPath,
        addPathTo,
        addTerminalAction,
        addAlwaysAction,
        otherwise,
        describe,
        paths,
        actions,
        terminalActions,
        process,
        groupingPredicate,
        catch: catchImpl,

        get description() {
            return description;
        },
        get otherwiseNode() {
            return otherwiseNode;
        },
        get hitCount() {
            return hitCount;
        },
        get terminalHitCount() {
            return terminalHitCount;
        }
    };
    return impl;
}


function hasLabel(name: string): Predicate<any> {
    function hasLabelImpl(item: any) {
        return item.issue.labels.some((i: any) => i.name === name);
    }
    hasLabelImpl.description = `[${name}]`;

    return hasLabelImpl;
}

function hasAnyLabel(...names: string[]): Predicate<any> {
    function hasAnyLabelImpl(item: any) {
        for (const name of names) {
            for (const lab of item.issue.labels) {
                if (lab.name === name) return true;
            }
        }
        return false;
    }

    hasAnyLabelImpl.description = `${names.join(' or ')}`;
    return hasAnyLabelImpl;
}

function never() {
    return false;
}
never.description = "(not reachable)";

function isOpen(issue: any) {
    return issue.issue.state === "open";
}
isOpen.description = "Is open";

function isClosed(issue: any) {
    return issue.issue.state === "closed";
}
isClosed.description = "Is closed";

function throwImpossible() {
    debugger;
    throw new Error("Should not be able to reach this tree point");
}
throwImpossible.description = "(assert)";

function isPullRequest(issue: any) {
    return !!issue.issue.pull_request;
}
isPullRequest.description = "Is PR";

function needsMoreInfoButNotSuggestion(item: any) {
    return hasLabel("Needs More Info")(item) && !hasLabel("Suggestion")(item);
}
needsMoreInfoButNotSuggestion.description = "Needs More Info but not Suggestion";

function nonLinkingReference(issueNumber: string | number, title: string) {
    return `[#${issueNumber} ${title}](https://github.com/Microsoft/TypeScript/${enc("issues")}/${issueNumber})`;
    function enc(s: string) {
        return s.split("").map(c => "%" + c.charCodeAt(0).toString(16)).join("");
    }
}

function addReportListItem(issue: any, target: string[]) {
    target.push(` * ${nonLinkingReference(issue.number, issue.title)}`);
}

function unwindIssueToDate(issueToUnwind: StoredIssue, date: Date): StoredIssue | undefined {
    // Hasn't been born yet
    if (new Date(issueToUnwind.issue.created_at) > date) return undefined;

    const issue: StoredIssue = JSON.parse(JSON.stringify(issueToUnwind));

    // For each thing that occurred after the specified date, attempt to undo it
    const eventTimeline = issue.events.slice().reverse();
    for (const event of eventTimeline) {
        if (new Date(event.created_at) > date) {
            issue.events.splice(issue.events.indexOf(event), 1);
            switch (event.event) {
                case "closed":
                    issue.issue.state = "open";
                    break;
                case "reopened":
                    issue.issue.state = "closed";
                    break;
                case "labeled":
                    const match = issue.issue.labels.filter(x => x.name === event.label.name)[0];
                    if (match !== undefined) {
                        issue.issue.labels.splice(issue.issue.labels.indexOf(match), 1);
                    } else {
                        // If the label that was added has since been deleted,
                        // it won't appear in the current list.
                    }
                    break;
                case "unlabeled":
                    issue.issue.labels.push({ ...event.label, url: "https://example.com" });
                    break;
                case "locked":
                    issue.issue.locked = false;
                    break;
                case "unlocked":
                    issue.issue.locked = true;
                    break;
            }
        }
    }

    // Remove comments issued after the date
    issue.comments = issue.comments.filter(c => new Date(c.created_at) > date);
    issue.reactions = issue.reactions && issue.reactions.filter(r => new Date(r.created_at) > date);

    return issue;
}

function createTriager() {
    const root = create<StoredIssue>().describe("All");

    const reportSections = {
        bugs: [] as string[],
        untriaged: [] as string[],
        mislabelled: [] as string[],
        pendingSuggestions: [] as string[],
        untriagedSuggestions: [] as string[],
        needsSuggestionLabel: [] as string[],
        noise: [] as string[]
    };

    root.catch((item, err) => {
        reportSections.mislabelled.push(...[
            ` * ${nonLinkingReference(item.issue.number, item.issue.title)}`,
            ...err.predicates.map(pred =>
                `   * ${pred.description || pred.toString()}`
            )
        ]);
    });

    root.addPath(isClosed).describe("Closed");
    const open = root.otherwise().describe("Open");
    root.addTerminalAction(throwImpossible);

    open.addPath(isPullRequest).describe("PRs");
    const issue = open.otherwise().describe("Open Issues");

    issue.addPath(hasLabel("Bug")).describe("Bugs").addAlwaysAction(item => {
        addReportListItem(item.issue, reportSections.bugs);
    });

    const suggestionPendingLabels = ["Needs Proposal", "Awaiting More Feedback", "Needs More Info"];
    const suggestion = issue.addPath(hasLabel("Suggestion")).describe("Suggestions");
    const docket = suggestion.addPath(hasLabel("In Discussion")).describe("In Discussion");
    suggestion.addPath(hasAnyLabel(...suggestionPendingLabels)).describe("Pending").addAlwaysAction((item) => {
        addReportListItem(item.issue, reportSections.pendingSuggestions);
    });
    suggestion.otherwise().describe("Untriaged Suggestion").addAlwaysAction((item) => {
        addReportListItem(item.issue, reportSections.untriagedSuggestions);
    });

    issue.addPath(hasLabel("Needs Investigation"));

    const meta = create<StoredIssue>().describe("Meta, Infra, & Notes");
    meta.addPath(hasLabel("Meta-Issue"));
    meta.addPath(hasLabel("Infrastructure"));
    meta.addPath(hasLabel("Design Notes"));
    meta.addPath(hasLabel("Discussion"));
    meta.addPath(hasLabel("Planning"));
    issue.addPathTo(meta.groupingPredicate, meta);

    const docs = create<StoredIssue>().describe("Docs & Website");
    docs.addPath(hasLabel("Website"));
    docs.addPath(hasLabel("Website Logo"));
    docs.addPath(hasLabel("Spec"));
    docs.addPath(hasLabel("Docs"));
    issue.addPathTo(docs.groupingPredicate, docs);

    const noise = create<StoredIssue>().describe("Noise");
    const noiseLabels = ["Question", "Working as Intended", "Design Limitation", "Duplicate", "By Design"];
    noiseLabels.forEach(label => noise.addPath(hasLabel(label)));
    issue.addPathTo(noise.groupingPredicate, noise);
    noise.addAlwaysAction(item => {
        addReportListItem(item.issue, reportSections.noise);
    });

    issue.addPath(hasLabel("External"));

    issue.addPath(needsMoreInfoButNotSuggestion);

    const untriaged = issue.otherwise().describe("Untriaged");
    untriaged.addPath(hasAnyLabel("Needs Proposal", "In Discussion")).addAlwaysAction(item => {
        addReportListItem(item.issue, reportSections.needsSuggestionLabel);
    });
    untriaged.addTerminalAction(item => {
        addReportListItem(item.issue, reportSections.untriaged);
    });

    return { root, reportSections };
}

function runReport() {
    const { root, reportSections } = createTriager();

    const fileNames = fs.readdirSync(dataRoot);
    for (const fn of fileNames) {
        if (fn === "issue-index.json") continue;
        const issue = JSON.parse(fs.readFileSync(path.join(dataRoot, fn), { encoding: "utf-8" }));
        root.process(issue);
    }

    fs.writeFileSync("viz.txt", visualizeNodeTree(root), { encoding: "utf-8" });

    const reportLines: string[] = [];
    for (const k of Object.keys(reportSections)) {
        const list = (reportSections as any)[k];
        reportLines.push(` ## ${k} (${list.length})`);
        reportLines.push(...list);
        reportLines.push("");
    }
    fs.writeFileSync("report.md", reportLines.join("\r\n"), { encoding: "utf-8" });
}

function getReportDates(): Date[] {
    const result: Date[] = [];
    let startDate = new Date("1/1/2015");
    while (startDate < new Date()) {
        result.push(startDate);
        startDate = new Date(+startDate + 1000 * 60 * 60 * 24 * 7);
    }
    return result;
}

function runHistoricalReport() {
    const dates = getReportDates();
    const rows = dates.map(date => ({
        date,
        triager: createTriager()
    }));

    const fileNames = fs.readdirSync(dataRoot);
    fileNames.sort();

    for (const fn of fileNames) {
        if (fn === "issue-index.json") continue;
        const issue = JSON.parse(fs.readFileSync(path.join(dataRoot, fn), { encoding: "utf-8" }));
        for (const row of rows) {
            const oldIssue = unwindIssueToDate(issue, row.date);
            if (oldIssue !== undefined) {
                row.triager.root.process(oldIssue);
            }
        }
    }

    const columns = ["untriaged", "bugs", "noise", "mislabelled", "pendingSuggestions"];
    console.log(["date", ...columns].join(","));
    for (const row of rows) {
        const csv = [row.date.toLocaleDateString(), ...columns.map(c => (row.triager.reportSections as any)[c].length)].join(",");
        console.log(csv);
    }
}

runHistoricalReport();