import fs from "fs";
import path from "path";

export interface FindUpOptions {
	/** Starting directory (defaults to process.cwd()) */
	cwd?: string;
	/** Directory at which to stop (defaults to the filesystem root) */
	stopAt?: string;
	/** Maximum number of parent directories to traverse (defaults to Infinity) */
	limit?: number;
}

/**
 * Synchronously walk up from `cwd` (or process.cwd()) to find the first occurrence of `name`.
 *
 * @param name - A filename or array of filenames to look for in each directory.
 * @param options - Optional settings for where to start, stop, and how many levels to traverse.
 * @returns Absolute path to the found file, or `undefined` if not found.
 */
export function findUpSync(name: string | string[], options: FindUpOptions = {}): string | undefined {
	const names = Array.isArray(name) ? name : [name];
	let dir = path.resolve(options.cwd ?? process.cwd());
	const root = path.parse(dir).root;
	const stopDir = options.stopAt ? path.resolve(options.stopAt) : root;
	const limit = options.limit ?? Number.POSITIVE_INFINITY;
	let depth = 0;

	while (true) {
		for (const candidate of names) {
			const fullPath = path.join(dir, candidate);
			if (fs.existsSync(fullPath)) {
				return fullPath;
			}
		}

		if (dir === stopDir || depth >= limit) {
			break;
		}

		const parent = path.dirname(dir);
		if (parent === dir) {
			// Reached filesystem root
			break;
		}

		dir = parent;
		depth++;
	}

	return undefined;
}
