type CorsConfig = Env["CORS_CONFIG"];

export function applyCors(headers: Headers, request: Request, config: CorsConfig): void {
	const origin = request.headers.get("Origin");
	if (origin && config.allowedOrigins.some((rule) => matchesOrigin(origin, rule))) {
		headers.set("Access-Control-Allow-Origin", origin);
	}
	if (origin) headers.append("Vary", "Origin");

	headers.set("Access-Control-Allow-Methods", config.allowedMethods.join(", "));
	headers.set("Access-Control-Allow-Headers", config.allowedHeaders.join(", "));
	headers.set("Access-Control-Max-Age", String(config.maxAge));
}

function matchesOrigin(origin: string, rule: string): boolean {
	if (rule === "*") return true;
	const pattern = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
	return new RegExp(`^${pattern}$`).test(origin);
}