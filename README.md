# 网盘资源站

一个基于 HTML、CSS 和 JavaScript 开发的资源列表展示系统，支持数据加载、分页显示、搜索筛选等功能。

## 功能特点

- 🚀 动态加载数据
- 📱 响应式设计，支持移动端和桌面端
- 🔍 实时搜索功能
- 📋 分类筛选功能
- 📄 分页显示
- 🌈 动态背景气泡效果
- 📊 数据导出功能（CSV表格和链接列表）
- ⚡ 加载进度提示

## 项目结构

project/
├── index.html // 主页面
├── styles.css // 样式文件
├── scripts.js // JavaScript主文件
├── data/ // 数据文件目录
│ ├── file_list.txt // 数据文件列表
│ └── *.json // JSON数据文件
└── README.md // 说明文档



## 示例页面

- **GithubPage**：[https://360pb.github.io/](https://360pb.github.io/)
- **数据源**：[https://panhub.fun/](https://panhub.fun/)



## 快速部署

### 方式一：Fork 部署（推荐）

1. **Fork 仓库**
   - 访问 [原始仓库地址](https://github.com/360PB/360pb.github.io)
   - 点击右上角的 "Fork" 按钮复制仓库到自己的账号下

2. **修改仓库名称**
   - 进入你 Fork 后的仓库设置
   - 将仓库名修改为 `你的用户名.github.io`
   - 例如：如果你的 GitHub 用户名是 `example`，就将仓库名改为 `example.github.io`

3. **添加数据文件**
   - 在 `data` 目录下添加你的 JSON 数据文件
   - 修改 `data/file_list.txt`，添加你的数据文件名列表

4. **启用 GitHub Pages**
   - 进入仓库的 Settings
   - 找到 Pages 选项
   - Source 选择 `main` 分支
   - 保存后等待几分钟
   - 访问 `https://你的用户名.github.io` 查看部署结果

### 方式二：手动部署

1. **创建仓库**
   - 创建一个新的仓库，名称为 `你的用户名.github.io`

2. **上传文件**
   - 克隆本项目代码
   - 修改数据文件
   - 提交到你的仓库

3. **启用 GitHub Pages**
   - 同上方式一的第 4 步

## 数据文件配置

1. **准备数据文件**
   - 按照指定格式准备 JSON 数据文件
   - 将文件放入 `data` 目录

2. **更新文件列表**
   - 编辑 `data/file_list.txt`
   - 每行写入一个数据文件名
   - 例如：
     ```
     1-5k.json
     5k-10k.json
     ```

## 自定义配置

1. **修改标题和说明**
   - 编辑 `index.html` 文件
   - 修改网站标题和说明文字

2. **修改样式**
   - 编辑 `styles.css` 文件
   - 自定义颜色、布局等样式

3. **修改功能**
   - 编辑 `scripts.js` 文件
   - 调整分页数量、搜索行为等



## 常见问题

1. **数据文件无法加载**
   - 确保文件名在 `file_list.txt` 中正确列出
   - 检查文件路径是否正确
   - 检查 JSON 格式是否正确

2. **页面显示 404**
   - 确保仓库名称格式正确（必须是 `用户名.github.io`）
   - 确保已正确启用 GitHub Pages
   - 等待几分钟让部署生效

3. **样式显示异常**
   - 清除浏览器缓存
   - 检查 CSS 文件是否正确加载

## 更新数据

1. **通过 GitHub 网页更新**
   - 直接在 GitHub 网页界面编辑或上传文件
   - 提交更改后会自动重新部署

2. **通过 Git 更新**
   ```bash
   git pull                     # 获取最新代码
   # 修改数据文件
   git add .                    # 添加更改
   git commit -m "更新数据"      # 提交更改
   git push                     # 推送到 GitHub



## 本地测试

1. **使用 VS Code 扩展Live Server**
   - 安装 Live Server 插件
   - VS Code 打开项目文件夹
   - 右键 index.html 选择 "Open with Live Server"



## 贡献

如果您有资源想要分享，或者想要参与到我们的项目中来，欢迎提交 Pull Request 或者通过 Issue 与我们联系。

## 联系我们

- **电子邮件**：[752790544@qq.com](mailto:752790544@qq.com)

## 声明

本站是网盘索引系统，所有内容均来自互联网所提供的公开引用资源，未提供资源上传、存储服务。
我们尊重版权，所有资源仅供学习和交流使用，如有侵权，请及时联系我们删除。

## License

[MIT license](https://github.com/360PB/360pb.github.io#)

