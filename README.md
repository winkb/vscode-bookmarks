#  vim Mark 标记插件

相比于vim自带的标记功能，增加了标记列表可视化的能力，只需要按下m键，就可以查看有哪些标记过的文件。


`此插件依赖vscode vim插件`

##  默认快捷键

- m+n 新增标记
- m+[^n] 跳转到对应的标记位置


请将下面代码复制到settings
```json
{
    "vim.normalModeKeyBindingsNonRecursive":[
        {
            "before":[
                "m"
            ],
            "commands":[
                "bo.vimBookMarkTrigger"
            ]
        }
    ]
}
```

![ img ](./src/source/showme.gif)


## 所有命令

命令ID |  描述
-----------|----
bo.vimBookMarkTrigger | 跳转到标记/新增标记
bo.vimBookMarkClear | 清除所有的标记

## todo

