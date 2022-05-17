export function formatPath(filePath?: string) {
    if (!filePath) { return "" }
    return filePath.replace(/\\/g, "/")
}
