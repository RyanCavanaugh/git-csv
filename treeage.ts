export type Predicate<T> = (item: T) => boolean;
export type Action<T> = (item: T) => void;
export type Node<T> = {
    addPath(predicate: Predicate<T>): Node<T>;
    addTerminalAction(action: Action<T>): void;
    addAlwaysAction(action: Action<T>): void;
    otherwise(): Node<T>;
    process(item: T): void;
};

export type ImplementedNode<T> = Node<T> & {
    paths: ReadonlyArray<[Predicate<T>, Node<T>]>;
    terminalActions: ReadonlyArray<Action<T>>;
    actions: ReadonlyArray<Action<T>>;
}

export function create<T>(): Node<T> {
    const paths: [Predicate<T>, Node<T>][] = [];
    const terminalActions: Action<T>[] = [];
    const actions: Action<T>[] = [];
    let otherwiseNode: Node<T> | undefined = undefined;

    function process(item: T): void {
        let alreadyMatched = false;
        for (const path of paths) {
            if (path[0](item)) {
                if (alreadyMatched) {
                    // Error, can't match more than once
                } else {
                    path[1].process(item);
                }
            }
        }

        if (!alreadyMatched) {
            if (otherwiseNode) {
                otherwiseNode.process(item);
            } else {
                // Error, no fallback
            }
        }
    }

    function addPath(predicate: Predicate<T>): Node<T> {
        const target = create<T>();
        paths.push([predicate, target]);
        return create<T>();
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

    const impl: ImplementedNode<T> = {
        addPath,
        addTerminalAction,
        addAlwaysAction,
        otherwise,
        paths,
        actions,
        terminalActions,
        process
    };
    return impl;
}

const root = create<any>();

const bug = root.addPath(hasLabel("Bug"));
const suggestion = root.addPath(hasLabel("Suggestion"));

const report = createReportContext();
declare const items: any[];
for (const item of items) {
    root.process(report);
}


function hasLabel(name: string): Predicate<any> {
    return (item) => item.labels.some(i => i.name === name);
}

