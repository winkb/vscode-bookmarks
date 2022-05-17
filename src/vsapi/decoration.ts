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
    static defaultKey = "a"
    list: { [key: string]: vscodeDecoOptionType }
    mg: core.VimBookMarkManager
    svgs: { [key: string]: Function } = {}
    constructor(mg: core.VimBookMarkManager) {
        const blue = '#157EFB';
        const green = '#2FCE7C';
        const purple = '#C679E0';
        const red = '#F44336';
        const yellow = '#c46f23';
        const colors: { [key: string]: string } = {
            "a": blue,
            "b": red,
            "c": green,
            "d": yellow,
            "e": purple
        }

        this.svgs = svgs

        this.list = Object.keys(colors).reduce((p, key) => {
            return { ...p, [key]: this._getDecorationDefaultStyle(key, colors[key]) }
        }, {})

        this.mg = mg
    }

    refresh(textEdit: vscode.TextEditor) {
        // 组合成rang
        let pos = getCursorPosition(textEdit)
        let group = this.mg.getGroupById(pos.filePath)
        let groupRange: { [key: string]: vscode.Range[] } = {}

        Object.keys(group).map((k) => {
            const list = group[k];
            groupRange[k] = list.map(v => Decoration.positionToRange(v.pos))
        })

        Object.keys(groupRange).map(key => {
            textEdit.setDecorations(this.getDecorationOption(key).type, groupRange[key])
        })
    }

    clear(textEdit: vscode.TextEditor) {
        // 组合成rang
        let pos = getCursorPosition(textEdit)
        let group = this.mg.getGroupById(pos.filePath)

        Object.keys(group).map((k) => {
            textEdit.setDecorations(this.getDecorationOption(k).type, [])
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

    _getBookmarkDataUri(color: string) {

        return vscode.Uri.parse(
            "data:image/svg+xml," +
            encodeURIComponent(svgDefault(color))
        );
    }

    // 如果有对应的字母图标,使用字母图标,否则使用默认图标
    _getBookmarkDataUriDiffId(id: string, color: string): vscode.Uri {
        if (!this.svgs[id]) {
            return this._getBookmarkDataUri(color)
        }

        return vscode.Uri.parse(
            "data:image/svg+xml," +
            encodeURIComponent(this.svgs[id](color))
        )
    }

    _getDecorationStyle(decoOptions: decoOptionType) {
        // 将标记都加载到vsocde上,后面直接使用既可
        return { type: vscode.window.createTextEditorDecorationType(decoOptions), options: decoOptions };
    }

    _getDecorationDefaultStyle(id: string, color: string) {
        return this._getDecorationStyle({
            "gutterIconPath": this._getBookmarkDataUriDiffId(id, color),
            "overviewRulerColor": color + "B0",   // this is safe/suitable for the defaults only.  Custom ruler color is handled below.
            "light": {
                "fontWeight": "bold"
            },
            "dark": {
                "color": "Chocolate"
            }
        })
    }

}