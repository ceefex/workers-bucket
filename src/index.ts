import { handleR2Proxy } from "./lib/r2-proxy";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return handleR2Proxy(request, env);
	},
} satisfies ExportedHandler<Env>;
