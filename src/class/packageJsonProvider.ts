/* eslint-disable @typescript-eslint/no-explicit-any */
import { PackageJson } from "types-package-json";
import { TransformState } from "./transformState";
import { findUpSync } from "../util/findUp";

export class PackageJsonProvider {
	public readonly packageJson: PackageJson;

	public constructor(private state: TransformState) {
		const currentDir = this.state.program.getCurrentDirectory();
		const packageJsonPath = findUpSync("package.json", { cwd: currentDir });
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		this.packageJson = require(packageJsonPath!);
	}

	public queryField<TFieldKey extends keyof PackageJson>(field: TFieldKey): PackageJson[TFieldKey] {
		return this.packageJson[field];
	}
}
