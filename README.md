# jcTools

一个面向日常图片处理的轻量级 Web 工具集，使用 Vue 3、Vite 和 Element Plus 构建。

在线预览：[jcTools](https://jctools.wwc89502.workers.dev/#/)

## 功能

- **单图画布调整**：修改画布宽高，使用九宫格或“自定义拖拽”调整原图位置，补充区域保持透明，并支持图片大小调整。
- **单图调整**：按目标像素尺寸缩放图片，支持比例锁定、快捷缩放和 JPG/PNG/WEBP 高质量输出。
- **多图批量转换格式/压缩**：读取浏览器支持的图片格式及 HEIC/HEIF，支持质量调整、转换为 JPG/PNG/WEBP、列表勾选和 ZIP 打包下载。
- **常见格式兼容**：BMP、AVIF 等格式由浏览器原生解码；HEIC/HEIF 使用本地解码模块处理。GIF 动图会按首帧处理，导出结果不保留动画。
- **文件名保持**：下载文件沿用原文件名，仅替换输出格式后缀；压缩包中的重名文件会自动编号。
- **本地处理**：图片通过浏览器 Canvas 处理，不依赖业务服务器上传图片。

## 使用方式

1. 在顶部菜单选择单图画布调整、单图调整或多图批量转换。
2. 上传图片并设置目标尺寸和输出格式。
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
```

生产文件输出到 `dist/` 目录。当前页面托管在 Cloudflare，构建命令为 `npm run build`，构建输出目录为 `dist`。项目使用 Hash 路由。

推送 `v` 开头的 Git tag（例如 `v1.0.0`）会通过 GitHub Actions 构建并部署到 Cloudflare Workers。首次启用前，在 GitHub 仓库 Actions secrets 中添加 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`，并在 Cloudflare Worker 的 **Settings → Builds** 中断开原有 Git 集成，避免普通分支推送也触发部署。

## 技术栈

- Vue 3 + TypeScript
- Vite
- Element Plus + `@element-plus/icons-vue`
- MozJPEG 和 libwebp WebAssembly 编码器（JPG/WebP）；PNG 使用 Canvas 编码后由 OxiPNG 无损优化，WebP 使用无损模式，JPG 使用质量 100 编码
- 单图尺寸调整使用 Lanczos3 WebAssembly 缩放算法；超大源图沿用 Canvas 缩放以控制内存占用
- JSZip
- Canvas 图片处理 API
- `heic-to`（HEIC/HEIF 本地解码，LGPL-3.0）

第三方许可证文本见 [`licenses/`](licenses/) 目录，包括 [`heic-to`](licenses/heic-to-LGPL-3.0.txt)、jSquash、MozJPEG 和 libwebp。

This software is based in part on the work of the Independent JPEG Group.

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
