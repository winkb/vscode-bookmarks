import * as vscode from "vscode"

export class QuickBase {
    qui: vscode.QuickPick<any>
    charLimit = 0

    constructor(option?: QuickPickOptionType) {
        let config = {
            placehoder: "",
            charLimit: 0,
        }
        config = Object.assign(config, option)

        console.log("@ -> file: extension.ts -> line 125 -> new this.qui");
        this.qui = vscode.window.createQuickPick()
        this.qui.placeholder = config.placehoder
        this.charLimit = config.charLimit
        this.qui.items = []
    }

    setPlaceholder(placeholder: string) {
        this.qui.placeholder = placeholder
    }

    setHandle(callback: quickCallbackType) {
        this.qui.onDidChangeSelection((e) => {
            callback.select && callback.select(e)
            this.qui.hide()
        })

        this.qui.onDidChangeValue((e) => {
            e = e.trim()
            if (this.charLimit && e.length >= this.charLimit) {
                callback.changeValue && e && callback.changeValue(e)
                this.qui.hide()
            }
        })

        this.qui.onDidAccept(() => {
            callback.accpet && callback.accpet(this.qui.value.trim())
            this.qui.hide()
        })

        return this
    }

    show(list?: any[]) {
        // 这里设置items要放在和show一个层级，不能放在callback，否则list还是空的
        if (list) {
            this.qui.items = list
        }
        this.qui.show()
    }

    static create(option?: QuickPickOptionType) {
        let ins = new this(option)
        return ins
    }
}