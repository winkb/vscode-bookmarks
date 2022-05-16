interface ChangeValueHandle {
    (val: string): void
}

type PosType = {
    relativePath: string
    filePath: string
    lineNum: number
    charNum: number
}

type quickCallbackType = {
    changeValue?(val: string): void
    select?(val: any): void
    accpet?(val: any): void
}

type QuickPickOptionType = {
    placehoder: string
    charLimit?: number
}