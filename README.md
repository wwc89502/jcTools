# jcTools

一个面向日常图片处理的轻量级 Web 工具集，使用 Vue 3、Vite 和 Element Plus 构建。

## 功能

- **单图画布调整**：修改画布宽高，使用九宫格或“自定义拖拽”调整原图位置，补充区域保持透明，并支持图片大小调整。
- **单图调整**：按目标像素尺寸缩放图片，支持 JPG、PNG、WEBP 输出和压缩质量调整。
- **多图批量转换格式/压缩**：批量处理 JPG、PNG、WEBP，支持质量调整、输出格式转换、列表勾选和 ZIP 打包下载。
- **文件名保持**：下载文件沿用原文件名，仅替换输出格式后缀；压缩包中的重名文件会自动编号。
- **本地处理**：图片通过浏览器 Canvas 处理，不依赖业务服务器上传图片。

## 使用方式

1. 在顶部菜单选择单图画布调整、单图调整或多图批量转换。
2. 上传图片并设置目标尺寸、输出格式和压缩质量。
3. 单图工具可直接预览结果；画布工具可选择九宫格对齐或拖拽图片位置。
4. 点击导出或打包下载保存结果。

## 本地开发

建议使用 Node.js 26 或更高版本。

```sh
npm install
npm run dev
```

开发服务器启动后，按照终端提示打开本地地址即可。

## 构建与部署

```sh
# 类型检查并构建生产文件
npm run build

# 预览生产构建
npm run preview

# 构建并发布到 GitHub Pages
npm run deploy
```

生产文件输出到 `docs/` 目录。项目使用 Hash 路由，适合部署到静态托管服务。

## 技术栈

- Vue 3 + TypeScript
- Vite
- Element Plus + `@element-plus/icons-vue`
- JSZip
- Canvas 图片处理 API

## 项目结构

```text
src/
├─ components/          # 可复用图片处理组件
├─ views/               # 单图和批量处理页面
├─ utils/               # 图片加载、导出和下载工具
├─ App.vue              # 顶部导航和应用布局
└─ router/              # 页面路由
```

## GitHub

[wwc89502/jcTools](https://github.com/wwc89502/jcTools)
