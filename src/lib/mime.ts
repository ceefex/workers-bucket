type MimeTypes = Env["MIME_TYPES"];

export function getMimeType(key: string, mimeTypes: MimeTypes): string | undefined {
	const extension = key.split(".").pop()?.toLowerCase();
	return extension ? mimeTypes[extension as keyof MimeTypes] : undefined;
}