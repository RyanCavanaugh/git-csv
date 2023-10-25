export type ColumnValueMaker<T> = string | ((x: T) => string);

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

