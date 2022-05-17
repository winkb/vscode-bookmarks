export class Str extends String {
    ltrim(limit: string) {
        if (this.substring(0, limit.length) == limit) {
            return this.substring(limit.length)
        }
        return this
    }
}