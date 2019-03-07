import fs = require("fs");
import path = require("path");

const dataRoot = path.join(__dirname, "../data");

/*
 *
 *
 *
 *
 *
*/

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

namespace TsTriage {
    const root = create<any>().describe("All");
    const report = {
        bugs: 0,
        suggestions: 0,
        needsInvestigation: 0,
        untriagedSuggestions: 0,
        docs: 0,
        spec: 0,
        website: 0,
        websiteLogo: 0,
        discussion: 0,
        infra: 0,
        meta: 0,
        designNotes: 0,
        needsMoreInfo: 0,
        external: 0
    };
    const untriagedList: any[] = [];

    root.catch((item, err) => {
        console.log(`Matched too many: #${item.issue.number} ${item.issue.title}`);
        for (const pred of err.predicates) {
            console.log(` -> ${pred.description || pred.toString()}`);
        }
    });

    const closed = root.addPath(isClosed).describe("Closed");
    const open = root.otherwise().describe("Open");
    root.addTerminalAction(throwImpossible);

    const pr = open.addPath(isPullRequest).describe("PRs");
    const issue = open.otherwise().describe("Open Issues");

    const bug = issue.addPath(hasLabel("Bug")).describe("Bugs");
    bug.addTerminalAction(() => report.bugs++);

    const suggestionPendingLabels = ["Needs Proposal", "Awaiting More Feedback", "Needs More Info"];
    const suggestion = issue.addPath(hasLabel("Suggestion")).describe("Suggestions");
    const docket = suggestion.addPath(hasLabel("In Discussion")).describe("In Discussion");
    const pending = suggestion.addPath(hasAnyLabel(...suggestionPendingLabels)).describe("Pending");
    suggestion.otherwise().describe("Untriaged Suggestion").addAlwaysAction(() => report.untriagedSuggestions++)
    suggestion.addAlwaysAction(() => report.suggestions++);


    issue.addPath(hasLabel("Needs Investigation")).addAlwaysAction(() => report.needsInvestigation++);

    const meta = create<any>().describe("Meta & Infra");
    meta.addPath(hasLabel("Meta-Issue"));
    meta.addPath(hasLabel("Infrastructure"));
    meta.addPath(hasLabel("Design Notes"));
    meta.addPath(hasLabel("Discussion"));
    issue.addPathTo(meta.groupingPredicate, meta);

    const docs = create<any>().describe("Docs & Website");
    docs.addPath(hasLabel("Website"));
    docs.addPath(hasLabel("Website Logo"));
    docs.addPath(hasLabel("Spec"));
    docs.addPath(hasLabel("Docs"));
    issue.addPathTo(docs.groupingPredicate, docs);

    const noise = create<any>().describe("Noise");
    const noiseLabels = ["Question", "Working as Intended", "Design Limitation", "Duplicate", "By Design"];
    noiseLabels.forEach(label => noise.addPath(hasLabel(label)));
    issue.addPathTo(noise.groupingPredicate, noise);

    issue.addPath(hasLabel("External")).describe("External").addAlwaysAction(() => report.external++);

    issue.addPath(needsMoreInfoButNotSuggestion).addAlwaysAction(() => report.needsMoreInfo++);

    const untriaged = issue.otherwise().describe("Untriaged");
    untriaged.addPath(hasAnyLabel("Needs Proposal", "In Discussion")).addAlwaysAction(item => {
        console.log(`Issue missing Suggestion label: #${item.issue.number} - ${item.issue.title}`);
    });
    untriaged.addTerminalAction(issue => untriagedList.push(issue));

    const fileNames = fs.readdirSync(dataRoot);
    for (const fn of fileNames) {
        if (fn === "issue-index.json") continue;
        const issue = JSON.parse(fs.readFileSync(path.join(dataRoot, fn), { encoding: "utf-8" }));
        root.process(issue);
    }

    for (const untr of untriagedList) {
        console.log(`Untriaged: #${untr.issue.number} - ${untr.issue.title}`);
    }
    // console.log(JSON.stringify(report, undefined, 2));
    console.log(`${untriagedList.length} untr, ${report.bugs} bugs, ${report.suggestions} suggestions (${report.untriagedSuggestions} untriaged)`);

    fs.writeFileSync("viz.txt", visualizeNodeTree(root), { encoding: "utf-8" });
}
