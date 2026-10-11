# Flutter Tools for HarmonyOS 开发文档

本 VS Code 扩展的开发、构建与发布指南。安装与使用请见 [README](README.zh-cn.md)。

[English](DEVELOPING.md) | **简体中文**

## 前置要求

- Node.js 20+ 与 npm
- VS Code `^1.85.0`

## 本地运行扩展

1. 用 VS Code 打开本仓库。
2. 按 `F5` 启动 **Run Extension** 配置（会打开一个「扩展开发宿主」新窗口）。
3. 在新窗口中打开一个 Flutter HarmonyOS 项目，使用活动栏的 **Flutter OHOS** 图标。

## 打包成 VSIX

```bash
npm install
npm run compile
npm run package
code --install-extension flutter-ohos-toolkit-<version>.vsix
```

产物为 `flutter-ohos-toolkit-<version>.vsix`，其中 `<version>` 取自 `package.json` 的 `version`（例如 `0.1.1`）。

## npm 脚本

| 脚本 | 用途 |
| --- | --- |
| `npm run compile` | 类型检查并将 TypeScript 编译到 `out/` |
| `npm run watch` | 以监听模式编译 |
| `npm run package` | 构建 `.vsix`（基于 `@vscode/vsce`） |
| `npm run publish` | 发布到 VS Code Marketplace |
| `npm run publish:ovsx` | 打包并发布到 Open VSX |
| `npm run ovsx:namespace` | 创建 Open VSX 发布者命名空间 |
| `npm run ovsx:verify` | 校验 Open VSX PAT |

## 自动发布（GitHub Actions）

推送版本 tag 会触发 [`.github/workflows/release.yml`](.github/workflows/release.yml)，自动构建 VSIX 并创建 GitHub Release，同时把 `.vsix` 作为附件上传。

```bash
# 1. 更新 package.json 里的 "version" 并提交（也可用 npm version）
npm version patch --no-git-tag-version   # 或 minor / major / 指定 x.y.z
git commit -am "chore: release 0.1.1"
git push

# 2. 打 tag 并推送 —— tag 必须与 package.json 版本一致（例如 v0.1.1）
git tag v0.1.1
git push origin v0.1.1
```

可选：如需同时发布到扩展市场，在仓库 Secrets 中添加：

| Secret | 用途 |
| --- | --- |
| `VSCE_PAT` | [VS Code Marketplace](https://marketplace.visualstudio.com/manage) 的 Personal Access Token |
| `OVSX_PAT` | [Open VSX](https://open-vsx.org) 的 Personal Access Token |

配置后工作流会额外执行 `npm run publish`（Marketplace）和 `ovsx publish`（Open VSX）。也可以在 **Actions** 页面手动触发（`workflow_dispatch`）。

> 若 GitHub Release 建好了但市场版本没跟上（例如 Open VSX 仍停留在旧版本），说明推送 tag 时对应的 `*_PAT` secret 尚未配置。补上 secret 后重跑工作流，或发布下一个补丁版本即可。

## 目录结构

```
src/
  extension.ts   入口：注册命令、视图、状态栏
  controller.ts  中央状态：设备/模拟器列表、运行与调试调度
  commands.ts    所有命令的注册与实现
  trees.ts       Devices / Emulators / Commands 三个视图
  flutterCli.ts  flutter 进程调用与设备解析
  emulators.ts   Android / iOS / HarmonyOS 模拟器封装
  debug.ts       Dart-Code 调试会话与运行参数
  config.ts      配置读取与路径自动探测
  terminal.ts    集成终端管理
  platform.ts    设备平台归类
  logger.ts      输出通道
  util.ts        通用工具
l10n/            运行时多语言包（bundle.l10n*.json）
package.nls.json / package.nls.zh-cn.json   界面清单纯英/中文
resources/       图标（flutter-ohos.svg 活动栏图标、icon.png 市场图标）
.github/workflows/release.yml   基于 tag 的发布流水线
```

## License

MIT
