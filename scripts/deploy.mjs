import { execFileSync } from "node:child_process";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const configPath = new URL("../wrangler.deploy.jsonc", import.meta.url);

try {
	await access(configPath);
} catch {
	throw new Error("wrangler.deploy.jsonc is missing. Run the build command before deploying.");
}

execFileSync("pnpm", ["exec", "wrangler", "deploy", "--config", "wrangler.deploy.jsonc"], {
	cwd: projectRoot,
	stdio: "inherit",
});