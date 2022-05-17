import * as vscode from 'vscode';
import * as core from '../core/mark';
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

    constructor(mg: core.VimBookMarkManager) {
        const blue = '#157EFB';
        const green = '#2FCE7C';
        const purple = '#C679E0';
        const red = '#F44336';
        const yellow = '#c46f23';
        this.list = {
            "a": this._getDecorationDefaultStyle(blue),
            "b": this._getDecorationDefaultStyle(red),
            "c": this._getDecorationDefaultStyle(yellow),
            "d": this._getDecorationDefaultStyle(green),
            "e": this._getDecorationDefaultStyle(purple)
        };

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
            encodeURIComponent(`<svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" enable-background="new 0 0 48 48"><path fill="${color}" d="M37,43l-13-6l-13,6V9c0-2.2,1.8-4,4-4h18c2.2,0,4,1.8,4,4V43z"/></svg>`)
        );
    }

    _getDecorationStyle(decoOptions: decoOptionType) {
        // 将标记都加载到vsocde上,后面直接使用既可
        return { type: vscode.window.createTextEditorDecorationType(decoOptions), options: decoOptions };
    }

    _getDecorationDefaultStyle(color: string) {
        return this._getDecorationStyle({
            "gutterIconPath": this._getBookmarkDataUri(color),
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