## bookmarksJump是什么
顾名思义,他就是帮助你记忆并且迅速跳转到热点位置的工具


##  Mark 标记插件的优势

1. 相比于vim自带的mark，标记更明显!标记可筛选!跨文件跳转! 功能一体化!仅需要记忆一个m键
2. 随手定义备忘描述,这是我很需要的功能,然而其他同类型插件不提供或者很繁琐
3. 即使不用vim,也只需要配置简单的快捷键获得同样的能力


![ img ](./src/source/showme.gif)

##  默认动作

- {triggerKey}+n 新增标记(需要输入描述)
- {triggerKey}+N 新增标记(不需要输入描述)
- {triggerKey}+r 取消标记
- {triggerKey}+m 增加临时热点标记,不需要填写备注
- {triggerKey}+[字母] 跳转到对应的标记位置

### 如果你使用了vim

请将下面代码复制到settings,这段代码将triggerKey设置成了m键
```json
{
    "vim.normalModeKeyBindingsNonRecursive":[
        {
            "before":[ "m" ],
            "commands":[ "bo.vimBookMarkTrigger" ]
        }
    ]
}
```
模仿vim的原生标签操作，可以设置如下
```json
{
    "vim.normalModeKeyBindingsNonRecursive":[
        {
            "before":[ "m" ],
            "commands":[ "bo.vimBookMarkAddWithoutComment" ]
        },
        {
            "before":[ "`" ],
            "commands":[ "bo.vimBookMarkTrigger" ]
        },
        {
            "before":[ "<C-m>" ],
            "commands":[ "bo.vimBookMarkAdd" ]
        }
    ]
}
```

### 如果你不使用vim

请将下面代码复制到keybindings.json,这段代码将triggerKey设置成了ctrl+m键
```json
{
    "key": "ctrl+m",
    "command": "bo.vimBookMarkTrigger",
    "when": "editorTextFocus"
}
```



## 所有命令

命令ID |  描述
-----------|----
bo.vimBookMarkTrigger | 跳转到标记/新增标记
bo.vimBookMarkClear | 清除所有的标记
bo.vimBookMarkAdd | 新增标记(需要输入描述)
bo.vimBookMarkAddWithoutComment | 新增标记(不需要输入描述)
bo.vimBookMarkDelete | 取消标记
bo.vimBookMarkRefresh | 刷新标记

## todo

1. 可配置化
