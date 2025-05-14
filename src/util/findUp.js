const path = require("path");
const { fileURLToPath } = require("url");
const { locatePath, locatePathSync } = require("locate-path");

function toPath(urlOrPath) {
	return urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;
}

const findUpStop = Symbol("findUpStop");

async function findUpMultiple(name, options = {}) {
	let directory = path.resolve(toPath(options.cwd) ?? "");
	const { root } = path.parse(directory);
	const stopAt = path.resolve(directory, toPath(options.stopAt) ?? root);
	const limit = options.limit ?? Number.POSITIVE_INFINITY;
	const patterns = [name].flat();

	async function runMatcher(locateOptions) {
		if (typeof name !== "function") {
			return locatePath(patterns, locateOptions);
		}
		const found = await name(locateOptions.cwd);
		if (typeof found === "string") {
			return locatePath([found], locateOptions);
		}
		return found;
	}

	const matches = [];
	while (true) {
		const foundPath = await runMatcher({ ...options, cwd: directory });
		if (foundPath === findUpStop) break;
		if (foundPath) matches.push(path.resolve(directory, foundPath));
		if (directory === stopAt || matches.length >= limit) break;
		directory = path.dirname(directory);
	}

	return matches;
}

function findUpMultipleSync(name, options = {}) {
	let directory = path.resolve(toPath(options.cwd) ?? "");
	const { root } = path.parse(directory);
	const stopAt = path.resolve(directory, toPath(options.stopAt) ?? root);
	const limit = options.limit ?? Number.POSITIVE_INFINITY;
	const patterns = [name].flat();

	function runMatcher(locateOptions) {
		if (typeof name !== "function") {
			return locatePathSync(patterns, locateOptions);
		}
		const found = name(locateOptions.cwd);
		if (typeof found === "string") {
			return locatePathSync([found], locateOptions);
		}
		return found;
	}

	const matches = [];
	while (true) {
		const foundPath = runMatcher({ ...options, cwd: directory });
		if (foundPath === findUpStop) break;
		if (foundPath) matches.push(path.resolve(directory, foundPath));
		if (directory === stopAt || matches.length >= limit) break;
		directory = path.dirname(directory);
	}

	return matches;
}

async function findUp(name, options = {}) {
	const matches = await findUpMultiple(name, { ...options, limit: 1 });
	return matches[0];
}

function findUpSync(name, options = {}) {
	const matches = findUpMultipleSync(name, { ...options, limit: 1 });
	return matches[0];
}

module.exports = {
	toPath,
	findUpStop,
	findUpMultiple,
	findUpMultipleSync,
	findUp,
	findUpSync,
};
