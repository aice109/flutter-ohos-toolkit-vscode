# Flutter Tools for HarmonyOS

[![Open VSX Version](https://img.shields.io/open-vsx/v/aice109/flutter-ohos-toolkit?label=open%20vsx&color=a60ee5)](https://open-vsx.org/extension/aice109/flutter-ohos-toolkit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/aice109/flutter-ohos-toolkit)](https://open-vsx.org/extension/aice109/flutter-ohos-toolkit)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/aice109.flutter-ohos-toolkit?label=marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=aice109.flutter-ohos-toolkit)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-aice109%2Fflutter--ohos--toolkit--vscode-181717?logo=github)](https://github.com/aice109/flutter-ohos-toolkit-vscode)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.85.0-007ACC.svg)](https://code.visualstudio.com/)

[English](README.md) | **简体中文**

一个面向 **Flutter HarmonyOS（OpenHarmony）** 开发的 VS Code 扩展，帮助你在同一个侧边栏里完成 Flutter 常用命令、三大移动平台模拟器一键启动，以及 Android / iOS / HarmonyOS 的快速运行与调试。

> 适配 Flutter OHOS 分支（`platformType: ohos`，构建命令 `hap` / `har` / `hsp`）。

## 功能

### 1. Flutter 常用命令
命令面板或侧边栏「Commands」视图一键执行（在集成终端中运行，可随时中断）：

| 分类 | 命令 |
| --- | --- |
| 依赖 | `pub get` / `pub upgrade` / `pub outdated` |
| 质量 | `analyze` / `test` / `test --coverage` / `dart format .` |
| 维护 | `clean` / `doctor` / `doctor -v` / `flutter upgrade` |
| 代码生成 | `dart run build_runner build/watch` |
| 构建 | `build apk` / `build appbundle` / `build ipa` / **`build hap`** / **`build har`** / **`build hsp`** |
| 其他 | `flutter devices`、自定义命令输入框 |

### 2. 三大平台模拟器一键启动
- **Android**：读取 `emulator -list-avds`，选择 AVD 后启动。
- **iOS**：读取 `xcrun simctl list devices available --json`，`simctl boot` 后打开 Simulator。
- **HarmonyOS**：调用 DevEco 自带模拟器 CLI `Emulator -list` / `Emulator -start <name>`。

### 3. 三平台快速运行 / 调试
- **运行**：在集成终端执行 `flutter run -d <device>`（支持热重载键盘操作）。
- **调试**：当安装了 Dart-Code 扩展时，自动以 `dart` 调试会话启动，可使用断点、变量面板；未安装时自动回退到终端运行。
- 支持针对当前选中平台设备一键运行/调试，也可以从设备列表右键。

### 4. 侧边栏（活动栏）
- **Devices**：按 Android / iOS / HarmonyOS / Other 分组的设备列表，支持行内 ▶ 运行、🐞 调试、复制设备 ID。
- **Emulators**：分组展示三平台可用模拟器，点击即可启动。
- **Commands**：常用命令的分组快捷入口。
- 状态栏显示当前目标设备，点击可切换。

## 快速开始

1. 安装扩展 —— 从 [Open VSX](https://open-vsx.org/extension/aice109/flutter-ohos-toolkit) / 上方 Marketplace 徽章安装，或自行打包 VSIX（见 [DEVELOPING.zh-cn.md](DEVELOPING.zh-cn.md)）。
2. 在 Flutter HarmonyOS 项目中，打开活动栏的 **Flutter OHOS** 图标。
3. 点击标题栏 ▶ / 🐞 选择设备运行或调试。

## 语言（多语言 / i18n）

内置 **English** 与 **简体中文（zh-cn）**，有两种切换方式。

### 方式一：单独切换扩展语言（推荐）

设置 `flutterOhos.locale`：

| 值 | 说明 |
| --- | --- |
| `auto`（默认） | 跟随 VS Code 显示语言 |
| `en` | 强制英文 |
| `zh-cn` | 强制简体中文 |

生效后立即控制扩展**自身渲染的界面**：

- 侧边栏 Devices / Emulators / Commands 的内容（分组名、命令列表、占位提示）
- 状态栏目标设备提示
- 所有弹窗、错误提示、快速选择、输入框

> 受 VS Code 限制，**命令面板中的命令名称、设置项名称、视图分区标题**由编辑器显示语言决定，无法按扩展单独覆盖；若这些也要变中文，请用方式二。

### 方式二：跟随编辑器显示语言

1. `Cmd/Ctrl+Shift+P` 执行 **Configure Display Language**
2. 选择 **中文(简体)**（若未安装语言包，VS Code 会提示安装）
3. 重新加载窗口

此时 `package.nls.zh-cn.json` 与 `l10n/bundle.l10n.zh-cn.json` 一并生效，命令、设置与提示全部为中文。

> 使用 VSCodium / Code-OSS 时需先安装对应的中文语言包。

## 环境要求

- Flutter OHOS 分支（`flutter --version` 含 `ohos`）；推荐加入 `PATH`，或在设置中配置 `flutterOhos.flutterPath`。
- Android 模拟器需要 Android SDK 的 `emulator`。
- iOS 模拟器需要 macOS + Xcode（`xcrun`）。
- HarmonyOS 模拟器需要安装 DevEco Studio（提供 `.../tools/emulator/Emulator`）。
- 可选：安装 **Dart-Code**（`Dart-Code.dart-code`）以获得完整调试体验。

## 设置项

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| `flutterOhos.flutterPath` | `flutter` | Flutter 可执行文件路径 |
| `flutterOhos.dartPath` | `dart` | Dart 可执行文件路径 |
| `flutterOhos.android.sdkPath` | `""` | Android SDK 路径（回退 `ANDROID_HOME`） |
| `flutterOhos.android.emulatorPath` | `""` | Android `emulator` 路径 |
| `flutterOhos.ios.simulatorDevice` | `""` | 首选 iOS 模拟器 UDID/名称 |
| `flutterOhos.ios.simulatorApp` | `""` | 模拟器 UI 应用路径；自动探测 `Simulator.app` / `DeviceHub.app` |
| `flutterOhos.harmony.sdkPath` | `""` | HarmonyOS SDK 路径 |
| `flutterOhos.harmony.hdcPath` | `""` | `hdc` 路径 |
| `flutterOhos.harmony.emulatorPath` | `""` | DevEco 模拟器 `Emulator` 路径 |
| `flutterOhos.harmony.devecoPath` | `""` | DevEco Studio.app 路径 |
| `flutterOhos.terminal.reuse` | `true` | 是否复用同一个集成终端 |
| `flutterOhos.run.mainEntry` | `""` | 调试入口，默认 `lib/main.dart` |
| `flutterOhos.run.extraArgs` | `""` | 追加到 `flutter run` / 调试会话的参数 |
| `flutterOhos.run.pubGetBeforeRun` | `false` | 运行前自动 `pub get` |
| `flutterOhos.refreshOnStartup` | `true` | 激活时自动刷新设备/模拟器 |
| `flutterOhos.locale` | `auto` | 扩展界面语言：`auto` / `en` / `zh-cn` |

## 路径自动探测

未手动配置时，扩展会按以下顺序自动探测：

- Android SDK：`ANDROID_HOME` → `ANDROID_SDK_ROOT` → `~/Library/Android/sdk` → `~/.sdks/android/sdk` → `%LOCALAPPDATA%\Android\Sdk`
- HarmonyOS SDK：`OHOS_SDK_HOME` → `HOS_SDK_HOME` → `DEVECO_SDK_HOME` → `/Applications/DevEco-Studio.app/Contents/sdk` → `~/.sdks/harmonyos/sdk`
- HarmonyOS 模拟器：`flutterOhos.harmony.emulatorPath` → `OHOS_EMULATOR_HOME` → DevEco Studio 安装目录
- 可执行文件最后都会回退到系统 `PATH` 查找。

## 已知说明

- **iOS 模拟器 UI**：新版 Xcode 可能不再提供 `Simulator.app`（例如 Xcode 27 改用 `DeviceHub.app`）。扩展会自动探测常见位置（`Simulator.app` → `DeviceHub.app`），仍失败时会在「Emulators」视图/弹窗报错，可用 `flutterOhos.ios.simulatorApp` 手动指定应用路径。启动流程为 `xcrun simctl boot <udid>` 后打开 UI。
- **macOS 下 VS Code 未继承终端 PATH**：从 Dock/Finder 启动的 VS Code 扩展宿主通常没有登录 shell 的 `PATH`，导致找不到 `flutter`。本扩展会在 `PATH` 之外自动探测常见安装位置（`FLUTTER_ROOT`、`~/.sdks/flutter/sdk`、`~/flutter`、`~/development/flutter`、`~/fvm/*`、`/opt/flutter`、`/usr/local/flutter` 等），并把 Flutter/Dart/HarmonyOS/Android 工具目录注入子进程 `PATH`。若仍找不到，请手动设置 `flutterOhos.flutterPath`。
- Flutter OHOS 分支的 `flutter emulators` 在部分平台存在兼容性问题，因此本扩展**不依赖**该命令，而是直接调用各平台原生工具。
- 若 `flutter devices` 与 `hdc` 检测结果不一致，请确认设备已通过 `hdc list targets` 可见并已授权。

## 参与开发

开发、构建、发布与目录结构文档见 [DEVELOPING.zh-cn.md](DEVELOPING.zh-cn.md)。

## License

MIT
