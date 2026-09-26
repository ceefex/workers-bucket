import { readFile, writeFile } from "node:fs/promises";
import { parse } from "jsonc-parser";

const sourcePath = new URL("../wrangler.jsonc", import.meta.url);
const outputPath = new URL("../wrangler.deploy.jsonc", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const parseErrors = [];
const config = parse(source, parseErrors);

if (parseErrors.length) throw new Error("Could not parse wrangler.jsonc");

const bindings = config.r2_buckets ?? [];
const bindingIndex = bindings.findIndex((binding) => binding.binding === "R2_BUCKET");
if (bindingIndex < 0) throw new Error('wrangler.jsonc must define an R2_BUCKET binding');

const configuredBucket = bindings[bindingIndex].bucket_name;
const requestedBucket = process.env.R2_BUCKET_NAME;
if (requestedBucket !== undefined && requestedBucket.trim().length === 0) {
	throw new Error("R2_BUCKET_NAME is empty. Set it as a Workers Builds build variable.");
}

const bucketName = requestedBucket?.trim() ?? configuredBucket;
if (typeof bucketName !== "string" || bucketName.length === 0) {
	throw new Error("R2_BUCKET_NAME or the configured R2 bucket name must not be empty");
}

config.r2_buckets[bindingIndex] = { ...bindings[bindingIndex], bucket_name: bucketName };

const requestedDomains = process.env.CUSTOM_DOMAINS;
if (requestedDomains !== undefined) {
	if (requestedDomains.trim().length === 0) {
		throw new Error("CUSTOM_DOMAINS is empty. Set a comma-separated domain list or omit it.");
	}

	const customDomains = requestedDomains.split(",").map((domain) => domain.trim());
	if (customDomains.some((domain) => domain.length === 0)) {
		throw new Error("CUSTOM_DOMAINS must not contain empty entries.");
	}

	const routes = config.routes ?? [];
	if (!Array.isArray(routes)) throw new Error("routes in wrangler.jsonc must be an array");

	const existingDomains = new Set(
		routes
			.filter((route) => typeof route === "object" && route?.custom_domain === true)
			.map((route) => route.pattern),
	);
	for (const pattern of new Set(customDomains)) {
		if (!existingDomains.has(pattern)) routes.push({ pattern, custom_domain: true });
	}
	config.routes = routes;
}

await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Generated wrangler.deploy.jsonc using R2 bucket: ${bucketName}`);
