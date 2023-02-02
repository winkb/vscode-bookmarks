import * as vscode from 'vscode';
import * as core from '../core/mark';
import { svgDefault, svgs } from './svg';
import { getCursorPosition } from './vsapi';

type vscodeDecoOptionType = {
    type: vscode.TextEditorDecorationType;
}

type decoOptionType = {
    gutterIconPath: vscode.Uri;
    overviewRulerColor: string
    light: {
        fontWeight: string
    }
    dark: {
        color: string
    }
}

export class Decoration {
    // 如果没有设置,就使用此项去装饰
    static defaultKey = "0"
    list: { [key: string]: vscodeDecoOptionType }
    mg!: core.VimBookMarkManager
    /**  key => mark.id abc...  */
    svgs: { [key: string]: Function } = {}
    constructor() {
        const blue = '#157EFB';
        const green = '#2FCE7C';
        const purple = '#C679E0';
        const red = '#F44336';
        const yellow = '#c46f23';
        const white = '#ffffff';
        const black = '#000000';
        const colors: { [key: string]: string } = {
            "0": blue,
            "a": blue,
            "b": blue,
            "c": green,
            "d": yellow,
            "e": purple,
            "m": red,
        }

        this.svgs = svgs

        this.list = Object.keys(colors).reduce((p, key) => {
            return { ...p, [key]: this._getDecorationDefaultStyle(key, white, colors[key]) }
        }, {})
    }

    setMg(mg: core.VimBookMarkManager) {
        this.mg = mg
    }

    refresh(textEdit: vscode.TextEditor) {
        // 组合成rang
        let pos = getCursorPosition(textEdit)
        // a => VimMark  b => VimMark
        let markList = this.mg.filterByPath(pos.filePath)
        let styleKeyTypeGroup: {
            [key: string]: {
                styleOption: vscodeDecoOptionType,
                marks: core.VimBookMark[],
            }
        } = {}

        markList.map((v) => {
            let styleOption = this.getDecorationOption(v.id)
            if (!styleKeyTypeGroup[styleOption.type.key]) {
                styleKeyTypeGroup[styleOption.type.key] = {
                    "styleOption": styleOption,
                    marks: []
                }
            }
            styleKeyTypeGroup[styleOption.type.key].marks.push(v)
        })

        Object.keys(styleKeyTypeGroup).map(key => {
            let v = styleKeyTypeGroup[key]
            let styleOption = v.styleOption

            const rangers = v.marks.reduce((p: vscode.Range[], v) => {
                p.push(Decoration.positionToRange(v.pos))
                return p
            }, [])

            textEdit.setDecorations(styleOption.type, rangers)
        })
    }

    remove(textEdit: vscode.TextEditor, find: core.VimBookMark) {
        let pos = getCursorPosition(textEdit)
        let group = this.mg.filterByPath(pos.filePath)
        if (!find) {
            return
        }
        let styleOption = this.getDecorationOption(find.id)
        let ranges: vscode.Range[] = []

        // 重新设置和删除key一样的装饰，不仅仅是设置当前删除的行
        group.forEach(vm => {
            if (vm.id != find.id) {
                let thisOption = this.getDecorationOption(vm.id)
                if (thisOption.type.key == styleOption.type.key) {
                    ranges.push(Decoration.positionToRange(vm.pos))
                }
            }
        })

        textEdit.setDecorations(styleOption.type, ranges)
    }

    clear(textEdit: vscode.TextEditor) {
        let pos = getCursorPosition(textEdit)
        let markList = this.mg.filterByPath(pos.filePath)
        // 依据装饰符号的key做一个分组
        let styleKeyTypeGroup = markList.reduce((p: { [key: string]: vscodeDecoOptionType }, mark) => {
            let styleOption = this.getDecorationOption(mark.id)
            if (!p[styleOption.type.key]) [
                p[styleOption.type.key] = styleOption
            ]
            return p
        }, {})

        Object.keys(styleKeyTypeGroup).map((key) => {
            textEdit.setDecorations(styleKeyTypeGroup[key].type, [])
        })
    }

    getDecorationOption(id: string) {
        let theOption = this.list[id]
        if (!theOption) {
            theOption = this.list[Decoration.defaultKey]
        }
        return theOption
    }

    static positionToRange(pos: PosType) {
        return new vscode.Range(new vscode.Position(pos.lineIndex, 0), new vscode.Position(pos.lineIndex, pos.charIndex))
    }

    setDecorations(textEdit: vscode.TextEditor, id: string, rangers: vscode.Range[]) {
        let theOption = this.list[id]
        if (!theOption) {
            theOption = this.list[Decoration.defaultKey]
        }

        textEdit.setDecorations(theOption.type, rangers)
    }

    _getBookmarkDataUri(id: string, idcolor: string, iconcolor: string) {

        return vscode.Uri.parse(
            "data:image/svg+xml," +
            encodeURIComponent(svgDefault(id, idcolor, iconcolor))
        );
    }

    // 如果有对应的字母图标,使用字母图标,否则使用默认图标
    _getBookmarkDataUriDiffId(id: string, idcolor: string, iconcolor: string): vscode.Uri {
        if (!this.svgs[id]) {
            return this._getBookmarkDataUri(id, idcolor, iconcolor)
        }

        return vscode.Uri.parse(
            "data:image/svg+xml," +
            encodeURIComponent(this.svgs[id](iconcolor))
        )
    }

    _getDecorationStyle(decoOptions: decoOptionType) {
        // 将标记都加载到vsocde上,后面直接使用既可
        return { type: vscode.window.createTextEditorDecorationType(decoOptions), options: decoOptions };
    }

    _getDecorationDefaultStyle(id: string, idcolor: string, iconcolor: string) {
        return this._getDecorationStyle({
            "gutterIconPath": this._getBookmarkDataUriDiffId(id, idcolor, iconcolor),
            "overviewRulerColor": iconcolor + "B0",   // this is safe/suitable for the defaults only.  Custom ruler color is handled below.
            "light": {
                "fontWeight": "bold"
            },
            "dark": {
                "color": "Chocolate"
            }
        })
    }

}