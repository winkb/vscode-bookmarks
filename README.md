#  vim Mark 标记插件 

相比于vim自带的标记功能，增加了标记列表可视化的能力，只需要按下m键，就可以查看有哪些标记过的文件。

##  默认快捷键

m+n 新增标记
m+[*] 跳转到对应的标记位置


请将下面代码复制到settings 
```json
{
    "vim.normalModeKeyBindingsNonRecursive":[
        {
            "before":[
                "m"
            ],
            "commands":[
                "bo.vimBookMark"
            ]
        }
    ]
}
```


# todo

1. 在文件标记位置增加标记符号图标(英文字母的icon)
2. 新增标记的时候可以自定义描述,默认是文件名称+行号
3. m+c 修改标记名称和描述
