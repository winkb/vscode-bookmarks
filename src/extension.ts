import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
	let vimBookMarkMg = new VimBookMarkManager()
	let quickMarkTrigger = QuickBase.create({ placehoder: "输入n新增,其他跳转" })
	let quickMarkEditor = QuickBase.create({ placehoder: "请输入mark name" })

	let disposable = vscode.commands.registerTextEditorCommand('bo.vimBookMark', (textEdit) => {
		quickMarkTrigger.setHandle({
			changeValue(char) {
				// 输入n，新增mark
				if (char == "n") {
					quickMarkEditor.setHandle({
						changeValue(id) {
							if (id.charAt(0) != "n") {
								vimBookMarkMg.add(new VimBookMark(id, textEdit))
							} else {
								vscode.window.setStatusBarMessage("不能使用n作为标记ID", 2000)
							}
						}
					}).show()
				} else {
					// 跳转 mark
					vimBookMarkMg.goTo(char)
				}
			},
			select(val) {
				vimBookMarkMg.goTo(val.label)
			}
		})

		quickMarkTrigger.show(vimBookMarkMg.getQuickPick())
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
			label: `${id}->${pos.relativePath}:${pos.lineNum}`,
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

type quickCallbackType = {
	changeValue?(val: string): void
	select?(val: any): void
}

class QuickBase {
	qui: vscode.QuickPick<any>

	constructor(option?: { placehoder: string }) {
		let config = {
			placehoder: ""
		}
		config = Object.assign(config, option)

		console.log("@ -> file: extension.ts -> line 125 -> new this.qui");
		this.qui = vscode.window.createQuickPick()
		this.qui.placeholder = config.placehoder
		this.qui.items = []
	}

	setHandle(callback: quickCallbackType) {
		this.qui.onDidChangeSelection((e) => {
			callback.select && callback.select(e)
			this.qui.value = ""
			this.qui.hide()
		})

		this.qui.onDidChangeValue((e) => {
			e = e.trim()
			callback.changeValue && e && callback.changeValue(e)
			this.qui.value = ""
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

	static create(option?: { placehoder: string }) {
		let ins = new this(option)
		return ins
	}
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
	relativePath: string
	filePath: string
	lineNum: number
	charNum: number
}

function formatPath(filePath?: string) {
	if (!filePath) { return "" }
	return filePath.replace(/\\/g, "/")
}

class Str extends String {
	ltrim(limit: string) {
		if (this.substring(0, limit.length) == limit) {
			return this.substring(limit.length)
		}
		return this
	}
}

// 获取当前光标所在位置
function getCursorPosition(textEdit: vscode.TextEditor): PosType {
	let workspaceRootPath = formatPath(vscode.workspace.getWorkspaceFolder(textEdit.document.uri)?.uri.path)
	let filePath = formatPath(textEdit.document.fileName)
	let ac = textEdit.selection.active
	let relativePath = new Str(filePath.replace(workspaceRootPath, "")).ltrim("/").toString()

	return {
		relativePath: relativePath,
		filePath: filePath,
		lineNum: ac.line,
		charNum: ac.character
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
