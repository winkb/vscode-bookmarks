import * as vscode from "vscode"
import * as vsapi from "../vsapi/vsapi"
import { LocalStorageService } from "../vsapi/store"
import { Decoration } from "../vsapi/decoration"

export class VimBookMarkManager {
    list: VimBookMark[] = []
    store: LocalStorageService
    decration!: Decoration
    static dbKey = "bo.VimBookMarkManager"

    constructor(store: LocalStorageService, decration: Decoration) {
        this.store = store
        this.decration = decration
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

    filterByPath(filePath: string): VimBookMark[] {
        return this.list.filter(v => v.filePath == filePath)
    }

    save(): any {
        this.store.setValue(VimBookMarkManager.dbKey, this.list)
    }

    clear(textEdit: vscode.TextEditor) {
        // 1
        this.decration.clear(textEdit)
        // 2
        this.list.length = 0
    }

    delete(textEdit: vscode.TextEditor, find: VimBookMark) {
        // 1
        this.decration.remove(textEdit, find)

        // 2
        this.list.forEach((v, i) => {
            if (v.isSameLine(find)) {
                this.list.splice(i, 1)
            }
        })
    }

    addOrUpdate(mark: VimBookMark, textEdit: vscode.TextEditor) {
        //   删除当前行已存在的标签
        let findIndex = this.list.findIndex(v => v.isSameLine(mark))
        if (findIndex != -1) {
            let find = this.list[findIndex]

            // 1 修改老的标记信息
            this.decration.remove(textEdit, find)
            // 赋值新的标记信息
            find.assign(mark, true)
            this.list.splice(findIndex, 1, find)
        } else {
            this.list.forEach((v, i) => {
                //  删除相同名称的标签
                if (v.id == mark.id) {
                    this.list.splice(i, 1)
                }
            })

            // 1
            this.list.unshift(mark)
        }

        // 2
        this.decration.refresh(textEdit)
    }

    has(id: string) {
        return this.list.some(v => v.id == id)
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

    assign(mark: VimBookMark, ignoreEmpty: boolean) {
        this.data.id = mark.id
        this.data.pos = mark.pos
        let desc = mark.desc
        if (ignoreEmpty) {
            this.data.desc = desc || this.data.desc
        } else {
            this.data.desc = desc
        }
    }

    jumpToTheLocation() {
        let { filePath, lineIndex: lineNum, charIndex: charNum } = this.data.pos
        vsapi.goToLocation(filePath, lineNum, charNum)
    }

    setDesc(desc: string) {
        this.data.desc = desc
    }

    isSameLine(newMark: VimBookMark) {
        return this.filePath == newMark.filePath && this.line == newMark.line
    }

    get line() {
        return this.pos.lineIndex
    }

    get filePath() {
        return this.pos.filePath
    }

    get desc() {
        return this.data.desc
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