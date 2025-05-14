import path from "node:path";
import { fileURLToPath } from "node:url";
import { locatePath, locatePathSync, type Options as LocatePathOptions } from "locate-path";

export const findUpStop: unique symbol = Symbol("findUpStop");
export type Match = string | typeof findUpStop | undefined;

export type Options = {
	/**
	 A directory path where the search halts if no matches are found before reaching this point.

	 Default: Root directory
	 */
	readonly stopAt?: string;

	limit?: number;
} & LocatePathOptions;

export function toPath(urlOrPath: string | URL): string {
	return urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;
}

export async function findUpMultiple(
	name: string | readonly string[] | ((directory: string) => Match | Promise<Match>),
	options: Options = {},
): Promise<string[]> {
	let directory = path.resolve(toPath(options.cwd ?? ""));
	const { root } = path.parse(directory);
	const stopAt = path.resolve(directory, toPath(options.stopAt ?? root));
	const limit = options.limit ?? Number.POSITIVE_INFINITY;
	const patterns = (typeof name === "function" ? [] : [name]).flat() as string[];

	async function runMatcher(locateOptions: LocatePathOptions & { cwd: string }): Promise<Match> {
		if (typeof name !== "function") {
			return locatePath(patterns, locateOptions);
		}
		const found = await name(locateOptions.cwd);
		if (typeof found === "string") {
			return locatePath([found], locateOptions);
		}
		return found;
	}

	const matches: string[] = [];
	while (true) {
		const foundPath = await runMatcher({ ...options, cwd: directory });

		if (foundPath === findUpStop) break;
		if (typeof foundPath === "string") matches.push(path.resolve(directory, foundPath));
		if (directory === stopAt || matches.length >= limit) break;
		directory = path.dirname(directory);
	}

	return matches;
}

export function findUpMultipleSync(
	name: string | readonly string[] | ((directory: string) => Match),
	options: Options = {},
): string[] {
	let directory = path.resolve(toPath(options.cwd ?? ""));
	const { root } = path.parse(directory);
	const stopAt = path.resolve(directory, toPath(options.stopAt ?? root));
	const limit = options.limit ?? Number.POSITIVE_INFINITY;
	const patterns = (typeof name === "function" ? [] : [name]).flat() as string[];

	function runMatcher(locateOptions: LocatePathOptions & { cwd: string }): Match {
		if (typeof name !== "function") {
			return locatePathSync(patterns, locateOptions);
		}
		const found = name(locateOptions.cwd);
		if (typeof found === "string") {
			return locatePathSync([found], locateOptions);
		}
		return found;
	}

	const matches: string[] = [];
	while (true) {
		const foundPath = runMatcher({ ...options, cwd: directory });

		if (foundPath === findUpStop) break;
		if (typeof foundPath === "string") matches.push(path.resolve(directory, foundPath));
		if (directory === stopAt || matches.length >= limit) break;
		directory = path.dirname(directory);
	}

	return matches;
}

export async function findUp(
	matcher: string | readonly string[] | ((directory: string) => Match | Promise<Match>),
	options?: Options,
): Promise<string | undefined> {
	const matches = await findUpMultiple(matcher, { ...options, limit: 1 });
	return matches[0];
}

export function findUpSync(
	matcher: string | readonly string[] | ((directory: string) => Match),
	options?: Options,
): string | undefined {
	const matches = findUpMultipleSync(matcher, { ...options, limit: 1 });
	return matches[0];
}
