import * as fs from 'node:fs/promises';

export type ColumnValueMaker<T> = (string & keyof T) | ((x: T) => string);

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

	function processItem(item: T): void {
		const cells: string[] = [];
		producers.forEach(key => {
			if (typeof key === 'string') {
				cells.push(item[key] as string);
			} else {
				const val = key(item);
				if (val === undefined) {
					throw new Error("Function" + key.toString() + " return undefined");
				}
				cells.push(val);
			}
		});
		rows.push(cells);
	}

	return {
		writeToFile,
		addColumn,
		processItem
	}
}

export class CSV<T> {
	colNames: string[] = [];
	producers: ColumnValueMaker<T>[] = [];

	addColumn(name: string, funcOrKey: ColumnValueMaker<T>) {
		this.colNames.push(name);
		this.producers.push(funcOrKey);
	}

	private static quote(s: string): string {
		return '"' + s.replace(/"/g, "'").replace(/^--/, ' --') + '"';
	}

	generate(arr: T[]): string[] {
		const result: string[] = [];

		result.push(this.colNames.join(','));

		arr.forEach((entry: any) => {
			const cells: string[] = [];
			this.producers.forEach(key => {
				if (typeof key === 'string') {
					cells.push(entry[key]);
				} else {
					const val = key(entry);
					if (val === undefined) {
						throw new Error("Function" + key.toString() + " return undefined");
					}
					cells.push(key(entry));
				}
			});

			result.push(cells.map(CSV.quote).join(','));
		});

		return result;
	}
}

function quote(s: string): string {
	return '"' + s.replace(/"/g, "'").replace(/^--/, ' --') + '"';
}