import { applyCors } from "./cors";
import { getMimeType } from "./mime";

export async function handleR2Proxy(request: Request, env: Env): Promise<Response> {
	const headers = new Headers();
	applyCors(headers, request, env.CORS_CONFIG);

	if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
	if (request.method !== "GET" && request.method !== "HEAD") {
		headers.set("Allow", "GET, HEAD, OPTIONS");
		return new Response("Method Not Allowed", { status: 405, headers });
	}

	let key: string;
	try {
		key = decodeURIComponent(new URL(request.url).pathname.slice(1)) || "index.html";
	} catch {
		return new Response("Bad Request", { status: 400, headers });
	}

		try {
	const object = request.method === "HEAD" ? await env.R2_BUCKET.head(key) : await env.R2_BUCKET.get(key);
	if (object) return objectResponse(object, key, request.method, headers, env.MIME_TYPES);

	const notFound =
		request.method === "HEAD" ? await env.R2_BUCKET.head("404.html") : await env.R2_BUCKET.get("404.html");
	if (notFound) {
		return objectResponse(notFound, "404.html", request.method, headers, env.MIME_TYPES, 404);
	}

	return new Response("404 - File not found", { status: 404, headers });
		} catch {
			return new Response("Internal Server Error", { status: 500, headers });
		}
}

function objectResponse(
	object: R2Object | R2ObjectBody,
	key: string,
	method: string,
	headers: Headers,
	mimeTypes: Env["MIME_TYPES"],
	status = 200,
): Response {
	object.writeHttpMetadata(headers);
	headers.set("Content-Type", getMimeType(key, mimeTypes) ?? headers.get("Content-Type") ?? "application/octet-stream");
	headers.set("Content-Length", String(object.size));
	headers.set("ETag", object.httpEtag);
	if (status === 404) headers.set("Cache-Control", "no-cache");
	else if (!headers.has("Cache-Control")) headers.set("Cache-Control", "public, max-age=604800");
	const body = method === "HEAD" || !("body" in object) ? null : object.body;
	return new Response(body, { status, headers });
}