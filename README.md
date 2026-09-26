# Workers Bucket

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![MIT License](https://img.shields.io/badge/License-MIT-2EA44F?style=for-the-badge)](LICENSE)

> An R2 object proxy built with Cloudflare Workers. It serves files by URL path with configurable CORS and MIME handling.

## Overview

The Worker reads objects from an R2 bucket binding and returns them through HTTP. The default bucket is `workers-bucket`.

Features:

- Serves `index.html` for requests to `/` and uses `404.html` as a not-found response when present.
- Supports `GET`, `HEAD`, and `OPTIONS` requests.
- Applies CORS settings from the `CORS_CONFIG` runtime variable.
- Resolves MIME types from the `MIME_TYPES` runtime variable, then falls back to R2 object metadata.

> CORS controls browser cross-origin access; it is not authentication. Without an additional access-control layer, anyone who knows an object path can request it through the Worker.

## Requirements

- Node.js `24.18.0` or newer
- pnpm `12.3.4`
- An existing R2 bucket in your Cloudflare account

Node.js and pnpm versions are pinned in `package.json`.

## Local Development

```sh
pnpm install
pnpm run dev
```

Local development uses `wrangler.jsonc`, including the default `workers-bucket` binding.

## Build and Deploy

Build and deployment are separate stages:

1. `pnpm run build` reads `wrangler.jsonc`, selects the bucket name, and generates `wrangler.deploy.jsonc`. It does not upload the Worker.
2. `pnpm run deploy` runs Wrangler with the generated configuration. Run the build first.

To change the bucket without modifying the repository, set `R2_BUCKET_NAME` as a **Build variable** in Cloudflare Workers Builds. Do not set it as a Worker runtime variable.

Configure Workers Builds as follows:

| Setting | Value |
| --- | --- |
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` |
| Build variable | `R2_BUCKET_NAME=<bucket-name>` |

Run the same flow locally:

```sh
R2_BUCKET_NAME=assets-prod pnpm run build
pnpm run deploy
```

If `R2_BUCKET_NAME` is unset, the build uses the default `workers-bucket`. If the variable is set but empty, the build fails to prevent deployment to an unintended bucket. `wrangler.deploy.jsonc` is generated during the build and is ignored by Git.

## Runtime Configuration

Bindings and default values are defined in `wrangler.jsonc`:

| Name | Type | Purpose |
| --- | --- | --- |
| `R2_BUCKET` | R2 binding | The R2 object binding used by the Worker. Default bucket: `workers-bucket`. |
| `R2_BUCKET_NAME` | Workers Builds build variable | Selects the bucket during the build and updates the binding in the generated configuration. |
| `CORS_CONFIG` | JSON runtime variable | Allowed origins, methods, headers, and preflight cache duration. |
| `MIME_TYPES` | JSON runtime variable | Maps file extensions to Content-Type values. |

On the first deployment, `CORS_CONFIG` and `MIME_TYPES` receive their defaults from `wrangler.jsonc`. `keep_vars: true` preserves runtime values changed through the Dashboard on subsequent Wrangler deployments. These variables are not build variables and do not select the bucket.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run dev` | Run the Worker locally with Wrangler. |
| `pnpm run build` | Generate `wrangler.deploy.jsonc`. |
| `pnpm run deploy` | Deploy `wrangler.deploy.jsonc`. |
| `pnpm test -- --run` | Run the test suite once. |
| `pnpm run cf-typegen` | Regenerate binding types from the Wrangler configuration. |

## License

This project is licensed under the [MIT License](LICENSE).