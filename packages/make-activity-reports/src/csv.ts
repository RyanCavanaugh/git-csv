import * as fs from 'node:fs/promises';

export type ColumnValueMaker<T> = (string & keyof T) | ((x: T) => (string | Promise<string>));

export function createTable<T>() {
	const colNames: string[] = [];
	const producers: ColumnValueMaker<T>[] = [];
	const rows: string[][] = [];

	async function writeToFile(fileName: string) {
		const output: string[] = [];
		output.push(colNames.map(quote).join(","));
		debugger;
		for (const row of rows) {
			output.push(row.map(quote).join(","));
		}
		await fs.writeFile(fileName, output.join("\n"), "utf-8");
	}

	function addColumn(name: string, funcOrKey: ColumnValueMaker<T>) {
		colNames.push(name);
		producers.push(funcOrKey);
	}

	async function processItem(item: T): Promise<void> {
		const cells: string[] = [];
		for (const key of producers) {
			if (typeof key === 'string') {
				cells.push(item[key] as string);
			} else {
				const val = await key(item);
				if (val === undefined) {
					throw new Error("Function" + key.toString() + " return undefined");
				}
				cells.push(val);
			}
		}
		rows.push(cells);
	}

	return {
		writeToFile,
		addColumn,
		processItem
	}
}

function quote(s: string): string {
	return '"' + s.replace(/"/g, "'").replace(/^--/, ' --') + '"';
}