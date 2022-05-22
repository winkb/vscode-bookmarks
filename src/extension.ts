import * as vscode from 'vscode';
import { VimBookMarkManager, VimBookMark } from './core/mark';
import { Decoration } from './vsapi/decoration';
import { QuickBase } from './vsapi/quickpice';
import { LocalStorageService } from './vsapi/store';


export function activate(context: vscode.ExtensionContext) {
	let decration = new Decoration()
	let vimBookMarkMg = new VimBookMarkManager(new LocalStorageService(context.workspaceState), decration)
	let specilaKey = [
		{
			id: "n",
			command: "bo.vimBookMarkAdd"
		},
		{
			id: "r",
			command: "bo.vimBookMarkDelete"
		}
	]

	// important
	decration.setMg(vimBookMarkMg)

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('bo.vimBookMarkTrigger', (textEdit) => {
			let quickMarkTrigger = QuickBase.create({ placehoder: "m热点,n新增,r删除,其他跳转", charLimit: 1 })
			quickMarkTrigger.setHandle({
				changeValue(char) {
					let target = specilaKey.find((v) => v.id == char)
					if (target) {
						vscode.commands.executeCommand(target.command)
					} else if (char == "m") {
						if (vimBookMarkMg.has(char)) {
							vimBookMarkMg.goTo(char)
						} else {
							vimBookMarkMg.addOrUpdate(VimBookMark.create(char, textEdit, "临时热点"), textEdit)
						}
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
		})
	)

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("bo.vimBookMarkDelete", (textEdit) => {
		let find = vimBookMarkMg.get(textEdit)
		if (find) {
			vimBookMarkMg.delete(textEdit, find)
		}
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("bo.vimBookMarkAdd", (textEdit) => {
		let quickMarkEditor = QuickBase.create({ placehoder: "输入mark name", charLimit: 1 })
		let quickMarkDesc = QuickBase.create({ placehoder: "输入备忘描述" })

		quickMarkEditor.setHandle({
			changeValue(id) {
				if (specilaKey.some(v => v.id == id.charAt(0))) {
					vscode.window.showErrorMessage(`不能使用${id}作为标记ID`)
				} else {
					let curLineOldMark = vimBookMarkMg.get(textEdit)
					let placehoder = "输入备忘描述"
					if (curLineOldMark) {
						placehoder = curLineOldMark.desc || placehoder
					}

					quickMarkDesc.setPlaceholder(placehoder)

					quickMarkDesc.setHandle({
						accpet(desc) {
							vimBookMarkMg.addOrUpdate(VimBookMark.create(id, textEdit, desc), textEdit)
						}
					}).show()
				}
			}
		}).show()
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('bo.vimBookMarkClear', (textEdit) => {
		// 1.先把所有的装饰取消掉,然后才能清空mg对象
		// 2. 清空mark list数据
		vimBookMarkMg.clear(textEdit)
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("bo.vimBookMarkRefresh", (textEdit) => {
		decration.refresh(textEdit)
	}));

	// 从db加载标记,并且刷新dom
	vimBookMarkMg.load(function () {
		vscode.window.showInformationMessage("vimBookMark加载完成")
		vscode.commands.executeCommand("bo.vimBookMarkRefresh")
	})

	/*********event*********/
	// on editor active
	vscode.window.onDidChangeActiveTextEditor((textEdit) => {
		let uriPath = textEdit?.document.uri.path
		console.log("@ -> file: extension.ts -> line 67 -> vscode.window.onDidChangeActiveTextEditor -> uriPath", uriPath);
		onDidActive(textEdit)
	}, null, context.subscriptions)

	vscode.workspace.onDidSaveTextDocument((e) => {
		let uriPath = e.uri.path
		console.log("@ -> file: extension.ts -> line 113 -> vscode.workspace.onDidSaveTextDocument -> uriPath", uriPath);
		onDidActive(vscode.window.activeTextEditor)
	}, null, context.subscriptions)


	/**********     handler **/
	async function onDidActive(editor?: vscode.TextEditor) {
		return new Promise((resolve) => {
			if (editor) {
				decration.refresh(editor)
			}
			resolve(null);
		});
	}

}



// this method is called when your extension is deactivated
export function deactivate() { }
