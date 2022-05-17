import * as vscode from 'vscode';
import { formatPath } from '../tools/common';
import { Str } from '../tools/str';

// 创建quickPick单例，如果已经创建了，直接返回
export function goToLocation(filePath: string, lineNum: number, charNum: number, msg: string = "") {
    vscode.commands.executeCommand(
        'editor.action.goToLocations',
        vscode.Uri.file(filePath), //anchor uri and position
        new vscode.Position(lineNum, charNum), // 行号，第几个字符位置
        [], // results (vscode.Location[])
        'goto', // mode
        msg // <- message
    );
}


// 获取当前光标所在位置
export function getCursorPosition(textEdit: vscode.TextEditor): PosType {
    let workspaceRootPath = new Str(formatPath(vscode.workspace.getWorkspaceFolder(textEdit.document.uri)?.uri.path)).ltrim("/").toString()
    let filePath = formatPath(textEdit.document.fileName)
    let ac = textEdit.selection.active
    let relativePath = new Str(filePath.replace(workspaceRootPath, "")).ltrim("/").toString()

    return {
        relativePath: relativePath,
        filePath: filePath,
        lineIndex: ac.line,
        charIndex: ac.character
    }
}