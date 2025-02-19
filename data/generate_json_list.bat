@echo off
setlocal enabledelayedexpansion

:: 设置目标文件名
set "targetFile=file_list.txt"

:: 使用 dir 命令列出所有 .json 文件的文件名（不包含路径）
dir /b "*.json" > "%targetFile%"

:: 检查文件是否生成成功
if exist "%targetFile%" (
    echo 文件已生成： %targetFile%
    type "%targetFile%"  :: 打印文件内容到控制台
) else (
    echo 文件生成失败！
)


pause