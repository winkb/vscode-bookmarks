import * as vscode from 'vscode';

interface ChangeValueHandle {
	(val: string): void
}

type quickCallbackType = {
	changeValue?(val: string): void
	select?(val: any): void
}

type QuickPickOptionType = {
	placehoder: string
	charLimit?: number
}


export function activate(context: vscode.ExtensionContext) {
	let vimBookMarkMg = new VimBookMarkManager()
	let quickMarkTrigger = QuickBase.create({ placehoder: "输入n新增,其他跳转", charLimit: 1 })
	let quickMarkEditor = QuickBase.create({ placehoder: "请输入mark name", charLimit: 1 })
	let quickMarkDesc = QuickBase.create({ placehoder: "请输入备忘描述" })

	let disposable = vscode.commands.registerTextEditorCommand('bo.vimBookMark', (textEdit) => {
		let specialKeys: {
			["c"]: ChangeValueHandle,
			["n"]: ChangeValueHandle
		} = {
			"n": () => {
				quickMarkEditor.setHandle({
					changeValue(id) {
						let sKeys: any = specialKeys
						if (sKeys[id.charAt(0)]) {
							vscode.window.setStatusBarMessage(`不能使用${id}作为标记ID`, 2000)
						} else {
							vimBookMarkMg.add(new VimBookMark(id, textEdit))
						}
					}
				}).show()
			},
			"c": () => {
				quickMarkDesc.setHandle({
					changeValue(desc) {
						let find = vimBookMarkMg.get(textEdit)
						if (find) {
							find.setDesc(desc)
							vimBookMarkMg.update(find)
						} else {
							vscode.window.setStatusBarMessage("此行没有标记", 2000)
						}
					}
				}).show()
			}
		}

		quickMarkTrigger.setHandle({
			changeValue(char) {
				let obj: any = specialKeys
				let h = obj[char]
				if (h) {
					h(char)
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

	get(textEd: vscode.TextEditor) {
		let pos = getCursorPosition(textEd)
		return this.list.find(v => {
			return v.data.pos.filePath == pos.filePath && v.data.pos.lineNum == pos.lineNum
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
		desc?: string
		pos: PosType
	}

	constructor(id: string, textEdit: vscode.TextEditor) {
		let pos = getCursorPosition(textEdit)
		this.data = {
			id: id,
			pos: pos,
		}
	}

	jumpToTheLocation() {
		let { filePath, lineNum, charNum } = this.data.pos
		goToLocation(filePath, lineNum, charNum)
	}

	setDesc(desc: string) {
		this.data.desc = desc
	}

	get id() {
		return this.data.id
	}

	get label() {
		let { id, pos, desc } = this.data
		if (desc) {
			desc = desc + ":"
		} else {
			desc = ""
		}
		return `${id}->${desc + pos.relativePath}:${pos.lineNum}`
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

class QuickBase {
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

	setHandle(callback: quickCallbackType) {
		this.qui.onDidChangeSelection((e) => {
			callback.select && callback.select(e)
			this.qui.value = ""
			this.qui.hide()
		})

		this.qui.onDidChangeValue((e) => {
			e = e.trim()
			if (this.charLimit && e.length >= this.charLimit) {
				callback.changeValue && e && callback.changeValue(e)
				this.qui.value = ""
				this.qui.hide()
			}
		})

		this.qui.onDidAccept(() => {
			if (this.qui.value.trim()) {
				callback.changeValue && callback.changeValue(this.qui.value)
			}
			this.qui.value = " "
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
