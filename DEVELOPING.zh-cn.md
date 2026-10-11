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
| `npm run release:patch` | 提升补丁版本，更新 CHANGELOG，提交并打 tag |
| `npm run release:minor` | 提升次版本，更新 CHANGELOG，提交并打 tag |
| `npm run release:major` | 提升主版本，更新 CHANGELOG，提交并打 tag |
| `npm run changelog` | 为当前版本重新生成 CHANGELOG 条目 |

## 发布

版本号、提交、tag 全部由 npm 脚本完成，一次发布只需两条命令：

```bash
npm run release:patch   # 或 release:minor / release:major
git push && git push origin --tags
```

`npm run release:*` 会自动更新 `package.json`（及 `package-lock.json`）、根据上次 tag 以来的提交生成 `CHANGELOG.md` 条目、以 `chore: release <version>` 一并提交，并创建对应的 `v<version>` tag。执行前工作区需保持干净。

CHANGELOG 条目由 `version` 生命周期钩子（[`scripts/changelog.mjs`](scripts/changelog.mjs)）生成，因此会自动包含在发布提交里。之后可以手动润色措辞；若改动了，请在打下一个 tag 前先提交。

推送 tag 会触发 [`.github/workflows/release.yml`](.github/workflows/release.yml)，依次：

1. 校验 tag 与 `package.json` 版本一致；
2. 编译并打包 VSIX；
3. 创建（或更新）GitHub Release 并附上 `.vsix`；
4. 发布到 **Open VSX**（需 `OVSX_PAT` secret，缺失时工作流会提前失败）。

若配置了 `VSCE_PAT`，还会额外发布到 VS Code Marketplace：

| Secret | 用途 |
| --- | --- |
| `OVSX_PAT` | [Open VSX](https://open-vsx.org) 的 Personal Access Token —— 自动发布 Open VSX 必需 |
| `VSCE_PAT` | [VS Code Marketplace](https://marketplace.visualstudio.com/manage) 的 Personal Access Token —— 可选 |

也可以在 **Actions** 页面用 `workflow_dispatch` 手动触发（填入已存在的 tag，例如补配 secret 后重发）。

> tag 必须与 `package.json` 版本一致，否则工作流会在版本校验处终止；用 `npm run release:*` 可自动保证一致。
>
> 对已存在的 tag 重跑是安全的：GitHub Release 会原地更新，Open VSX 使用 `--skip-duplicate` 发布。

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
