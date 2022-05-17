import * as vscode from 'vscode';
import { VimBookMarkManager, VimBookMark } from './core/mark';
import { Decoration } from './vsapi/decoration';
import { QuickBase } from './vsapi/quickpice';
import { LocalStorageService } from './vsapi/store';


export function activate(context: vscode.ExtensionContext) {
	let vimBookMarkMg = new VimBookMarkManager(new LocalStorageService(context.workspaceState))
	let decration = new Decoration(vimBookMarkMg)

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('bo.vimBookMarkTrigger', (textEdit) => {
			let quickMarkTrigger = QuickBase.create({ placehoder: "输入n新增,其他跳转", charLimit: 1 })
			let quickMarkEditor = QuickBase.create({ placehoder: "输入mark name", charLimit: 1 })
			let quickMarkDesc = QuickBase.create({ placehoder: "输入备忘描述" })
			let specialKeys: { [key: string]: ChangeValueHandle } = {
				"n": () => {
					quickMarkEditor.setHandle({
						changeValue(id) {
							if (specialKeys[id.charAt(0)]) {
								vscode.window.showErrorMessage(`不能使用${id}作为标记ID`)
							} else {
								quickMarkDesc.setHandle({
									accpet(desc) {
										vimBookMarkMg.add(VimBookMark.create(id, textEdit, desc))
										decration.refresh(textEdit)
									}
								}).show()
							}
						}
					}).show()
				},
			}

			quickMarkTrigger.setHandle({
				changeValue(char) {
					const h = specialKeys[char]
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
		})
	)

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('bo.vimBookMarkClear', (textEdit) => {
		// 1.先把所有的装饰取消掉,然后才能清空mg对象
		decration.clear(textEdit)
		// 2. 清空mark list数据
		vimBookMarkMg.clear()
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
