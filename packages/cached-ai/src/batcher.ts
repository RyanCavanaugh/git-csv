interface BatchOptions {
    maxTotalSize: number;
    maxEntries: number;
    dispatch: (lines: string[], index: number) => void;
}

export function createBatcher(opts: BatchOptions) {
    let lines: string[] = [];
    let runningByteSize = 0;
    let index = 0;

    function addEntry(entry: string) {
        if (lines.length === opts.maxEntries) {
            flush();
        }
        if (entry.length + runningByteSize >= opts.maxTotalSize) {
            flush();
        }

        lines.push(entry);
        runningByteSize += entry.length + 1;
    }

    function done() {
        flush();
    }

    function flush() {
        if (lines.length > 0) {
            opts.dispatch(lines, index);
            index++;
        }
        runningByteSize = 0;
        lines = [];
    }

    return ({
        addEntry,
        done
    })
}
