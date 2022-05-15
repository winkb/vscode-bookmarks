import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {


	let vimBookMarkMg = new VimBookMarkManager()

	let disposable = vscode.commands.registerTextEditorCommand('bo.vimBookMark', (textEdit, ed) => {

		let addNewMarkHandle: quickCallbackInterface = function (ev, val) {
			if (ev == "changeValue" && val.trim()) {
				vimBookMarkMg.add(new VimBookMark(String(val), textEdit))
			}
		}

		let theQuick = QuickMarkTrigger.create(function (event, val) {

			console.log("@ -> file: extension.ts -> line 11 -> theQuick -> val", val);

			if (event == "changeValue") {
				if (val.trim() == "") {
					return
				}

				// 当输入 `n` 的时候，就新增一个mark，其他字符是跳转到对应的mark
				if (val == "n") {
					QuickMarkEditor.create(function (ev, val) {
						addNewMarkHandle(ev, val)
					}, { placehoder: "请输入mark name" }).show()
				} else {
					vimBookMarkMg.goTo(val)
				}
			}


			if (event == "select") {
				vimBookMarkMg.goTo(val.label)
			}
		})


		// 这里设置items要放在和show一个层级，不能放在callback，否则list还是空的
		theQuick.items = vimBookMarkMg.getQuickPick()
		theQuick.show()
	});

	context.subscriptions.push(disposable);
}

class VimBookMarkManager {
	list: VimBookMark[] = []

	load() {
	}

	add(mark: VimBookMark) {
		this.push(mark)
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

	private push(mark: VimBookMark) {
		this.list = this.list.filter(v => {
			return v.id != mark.id
		})

		this.list.unshift(mark)
	}
}

class VimBookMark {
	data: {
		id: string
		label: string
		pos: PosType
	}

	constructor(id: string, textEdit: vscode.TextEditor) {
		let pos = getCursorPosition(textEdit)
		this.data = {
			id: id,
			label: `${id}->${pos.filePath}:${pos.lineNum}`,
			pos: pos,
		}
	}

	jumpToTheLocation() {
		let { filePath, lineNum, charNum } = this.data.pos
		goToLocation(filePath, lineNum, charNum)
	}

	get id() {
		return this.data.id
	}

	getInfo() {
		return this.data
	}

}

type quickEvent = "changeValue" | "select"
interface quickCallbackInterface {
	(ev: quickEvent, val: any): void
}

class QuickBase {
	static qui: vscode.QuickPick<any>

	static create(callback: quickCallbackInterface, option?: { placehoder: string }) {
		if (!this.qui) {
			let config = {
				placehoder: ""
			}
			config = Object.assign(config, option)
			this.qui = vscode.window.createQuickPick()
			this.qui.placeholder = config.placehoder
			this.qui.items = []

			console.log("@ -> file: extension.ts -> line 125 -> new this.qui");
		}

		this.qui.onDidChangeSelection((e) => {
			callback("select", e)
			this.qui.value = ""
			this.qui.hide()
		})

		this.qui.onDidChangeValue((e) => {
			callback("changeValue", e)
			this.qui.value = ""
			this.qui.hide()
		})

		return this.qui
	}
}

class QuickMarkEditor extends QuickBase {
	// 必须重写，否则还是父对象的属性地址
	static qui: vscode.QuickPick<any>
}

class QuickMarkTrigger extends QuickBase {
	// 必须重写，否则还是父对象的属性地址
	static qui: vscode.QuickPick<any>
}

// 创建quickPick单例，如果已经创建了，直接返回
function goToLocation(filePath: string, lineNum: number, charNum: number, msg: string = "") {
	vscode.commands.executeCommand(
		'editor.action.goToLocations',
		vscode.Uri.file(filePath), //anchor uri and position
		new vscode.Position(lineNum, charNum), // 行号，第几个字符位置
		[], // results (vscode.Location[])
		'goto', // mode
		msg // <- message
	);
}

type PosType = {
	filePath: string
	lineNum: number
	charNum: number
}

// 获取当前光标所在位置
function getCursorPosition(textEdit: vscode.TextEditor): PosType {
	let ac = textEdit.selection.active
	return {
		filePath: textEdit.document.fileName,
		lineNum: ac.line,
		charNum: ac.character
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
