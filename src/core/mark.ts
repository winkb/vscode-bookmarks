import * as vscode from "vscode"
import * as vsapi from "../vsapi/vsapi"
import { LocalStorageService } from "../vsapi/store"

export class VimBookMarkManager {
    list: VimBookMark[] = []
    store: LocalStorageService
    static dbKey = "bo.VimBookMarkManager"

    constructor(store: LocalStorageService) {
        this.store = store
    }

    load(callback: Function) {
        let _this = this
        let loadList: any[] = this.store.getValue(VimBookMarkManager.dbKey) || []
        let list = loadList.map(v => {
            return VimBookMark.fromObject(v.data)
        })

        this.list = new Proxy(list, {
            set(target: any, key, val) {
                target[key] = val
                _this.save()
                return true
            }
        })

        if (this.list.length > 0) {
            callback(this.list)
        }

        return this
    }

    getGroupById(filePath: string): { [key: string]: VimBookMark[] } {
        return this.list.filter(v => v.filePath == filePath).reduce((p: any, v) => {
            let theKey = v.id
            p[theKey] = p[theKey] || []
            p[theKey].push(v)
            return p
        }, {})
    }

    save(): any {
        console.log("@ -> file: mark.ts -> line 48 -> VimBookMarkManager -> save -> this.list.length", this.list.length);
        this.store.setValue(VimBookMarkManager.dbKey, this.list)
    }

    clear() {
        this.list.length = 0
    }

    add(mark: VimBookMark) {
        this.list.forEach((v, i) => {
            if (v.id == mark.id) {
                this.list.splice(i, 1)
            }
        })

        this.list.unshift(mark)
    }

    get(textEd: vscode.TextEditor) {
        let pos = vsapi.getCursorPosition(textEd)
        return this.list.find(v => {
            return v.data.pos.filePath == pos.filePath && v.data.pos.lineIndex == pos.lineIndex
        })
    }

    update(mark: VimBookMark) {
        this.list = this.list.map(v => {
            if (v.id == mark.id) {
                return mark
            }
            return v
        })
    }

    getQuickPick() {
        return this.list.map(v => v.getInfo())
    }

    goTo(id: string) {
        let mt = this.list.find(v => v.id == id)
        if (mt) {
            mt.jumpToTheLocation()
        }
    }
}

export class VimBookMark {
    data: {
        id: string
        desc?: string
        pos: PosType
    }

    static fromObject(data: { id: string, desc: string, pos: PosType }) {
        return new this(data.id, data.desc, data.pos)
    }

    static create(id: string, textEdit: vscode.TextEditor, desc = "") {
        let pos = vsapi.getCursorPosition(textEdit)
        return new this(id, desc, pos)
    }

    constructor(id: string, desc = "", pos: PosType) {
        this.data = {
            id: id,
            pos: pos,
            desc: desc
        }
    }

    jumpToTheLocation() {
        let { filePath, lineIndex: lineNum, charIndex: charNum } = this.data.pos
        vsapi.goToLocation(filePath, lineNum, charNum)
    }

    setDesc(desc: string) {
        this.data.desc = desc
    }

    get filePath() {
        return this.pos.filePath
    }

    get pos() {
        return this.data.pos
    }

    get id() {
        return this.data.id
    }

    get label() {
        let { id, pos, desc } = this.data
        if (desc) {
            desc = `[${desc}]->`
        } else {
            desc = ""
        }
        return `${id}->${desc + pos.relativePath}:${pos.lineIndex}`
    }

    getInfo() {
        let { id, pos } = this.data
        return {
            id,
            label: this.label,
            pos
        }
    }

}