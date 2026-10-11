# Flutter Tools for HarmonyOS

[![Open VSX Version](https://img.shields.io/open-vsx/v/aice109/flutter-ohos-toolkit?label=open%20vsx&color=a60ee5)](https://open-vsx.org/extension/aice109/flutter-ohos-toolkit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/aice109/flutter-ohos-toolkit)](https://open-vsx.org/extension/aice109/flutter-ohos-toolkit)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/aice109.flutter-ohos-toolkit?label=marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=aice109.flutter-ohos-toolkit)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-aice109%2Fflutter--ohos--toolkit--vscode-181717?logo=github)](https://github.com/aice109/flutter-ohos-toolkit-vscode)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.85.0-007ACC.svg)](https://code.visualstudio.com/)

**English** | [简体中文](README.zh-cn.md)

A VS Code extension for **Flutter HarmonyOS (OpenHarmony)** development. It brings common Flutter commands, one-click launchers for Android / iOS / HarmonyOS emulators, and quick run & debug for all three mobile platforms into a single sidebar.

> Targets the Flutter OHOS fork (`platformType: ohos`, build commands `hap` / `har` / `hsp`).

## Features

### 1. Common Flutter commands
Run from the Command Palette or the **Commands** view in the sidebar (executed in the integrated terminal, interruptible at any time):

| Category | Commands |
| --- | --- |
| Dependencies | `pub get` / `pub upgrade` / `pub outdated` |
| Quality | `analyze` / `test` / `test --coverage` / `dart format .` |
| Maintenance | `clean` / `doctor` / `doctor -v` / `flutter upgrade` |
| Code generation | `dart run build_runner build/watch` |
| Build | `build apk` / `build appbundle` / `build ipa` / **`build hap`** / **`build har`** / **`build hsp`** |
| Other | `flutter devices`, custom command input box |

### 2. One-click emulator / simulator launch
- **Android**: reads `emulator -list-avds`, pick an AVD and launch.
- **iOS**: reads `xcrun simctl list devices available --json`, `simctl boot` then opens the Simulator UI.
- **HarmonyOS**: calls the DevEco emulator CLI `Emulator -list` / `Emulator -start <name>`.

### 3. Quick run / debug on all three platforms
- **Run**: executes `flutter run -d <device>` in the integrated terminal (hot-reload key bindings supported).
- **Debug**: when the Dart-Code extension is installed, starts a `dart` debug session with breakpoints and the variables panel; falls back to terminal run otherwise.
- Run/debug for the currently selected platform device, or from the device list context menu.

### 4. Sidebar (activity bar)
- **Devices**: device list grouped by Android / iOS / HarmonyOS / Other, with inline ▶ run, 🐞 debug and copy device ID.
- **Emulators**: grouped emulators for the three platforms, click to launch.
- **Commands**: grouped shortcuts for common commands.
- The status bar shows the current target device; click to switch.

## Getting Started

1. Develop the extension: open this repository in VS Code and press `F5` to launch "Run Extension".
2. In a Flutter HarmonyOS project, open the **Flutter OHOS** icon in the activity bar.
3. Click ▶ / 🐞 in the view title bar to pick a device and run or debug.

### Package as VSIX

```bash
npm install
npm run compile
npm run package
code --install-extension flutter-ohos-toolkit-0.1.0.vsix
```

## Language / i18n

Both **English** and **简体中文 (zh-cn)** are built in. There are two ways to switch.

### Option 1: switch the extension language only (recommended)

Set `flutterOhos.locale`:

| Value | Description |
| --- | --- |
| `auto` (default) | Follow the VS Code display language |
| `en` | Force English |
| `zh-cn` | Force Simplified Chinese |

This immediately controls the UI **rendered by the extension itself**:

- Sidebar Devices / Emulators / Commands content (group names, command list, placeholder text)
- Status bar target-device label
- All dialogs, error messages, quick picks and input boxes

> Due to VS Code limitations, the **command names in the Command Palette, setting names and view section titles** follow the editor display language and cannot be overridden per extension. Use Option 2 if you want those in Chinese too.

### Option 2: follow the editor display language

1. `Cmd/Ctrl+Shift+P` → **Configure Display Language**
2. Select **中文(简体)** (VS Code will prompt to install the language pack if missing)
3. Reload the window

`package.nls.zh-cn.json` and `l10n/bundle.l10n.zh-cn.json` then take effect, and commands, settings and messages are all in Chinese.

> With VSCodium / Code-OSS you need to install the corresponding Chinese language pack first.

## Requirements

- Flutter OHOS fork (`flutter --version` contains `ohos`); recommended on `PATH`, or configure `flutterOhos.flutterPath`.
- Android emulators require the Android SDK `emulator`.
- iOS simulators require macOS + Xcode (`xcrun`).
- HarmonyOS emulators require DevEco Studio (provides `.../tools/emulator/Emulator`).
- Optional: install **Dart-Code** (`Dart-Code.dart-code`) for the full debug experience.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `flutterOhos.flutterPath` | `flutter` | Path to the Flutter executable |
| `flutterOhos.dartPath` | `dart` | Path to the Dart executable |
| `flutterOhos.android.sdkPath` | `""` | Android SDK path (falls back to `ANDROID_HOME`) |
| `flutterOhos.android.emulatorPath` | `""` | Path to the Android `emulator` |
| `flutterOhos.ios.simulatorDevice` | `""` | Preferred iOS simulator UDID/name |
| `flutterOhos.ios.simulatorApp` | `""` | Simulator UI app path; auto-detects `Simulator.app` / `DeviceHub.app` |
| `flutterOhos.harmony.sdkPath` | `""` | HarmonyOS SDK path |
| `flutterOhos.harmony.hdcPath` | `""` | Path to `hdc` |
| `flutterOhos.harmony.emulatorPath` | `""` | Path to the DevEco emulator `Emulator` |
| `flutterOhos.harmony.devecoPath` | `""` | Path to DevEco Studio.app |
| `flutterOhos.terminal.reuse` | `true` | Reuse a single integrated terminal |
| `flutterOhos.run.mainEntry` | `""` | Debug entry point, defaults to `lib/main.dart` |
| `flutterOhos.run.extraArgs` | `""` | Extra args appended to `flutter run` / the debug session |
| `flutterOhos.run.pubGetBeforeRun` | `false` | Automatically run `pub get` before run |
| `flutterOhos.refreshOnStartup` | `true` | Refresh devices/emulators on activation |
| `flutterOhos.locale` | `auto` | Extension UI language: `auto` / `en` / `zh-cn` |

## Path auto-detection

When not configured manually, the extension probes in this order:

- Android SDK: `ANDROID_HOME` → `ANDROID_SDK_ROOT` → `~/Library/Android/sdk` → `~/.sdks/android/sdk` → `%LOCALAPPDATA%\Android\Sdk`
- HarmonyOS SDK: `OHOS_SDK_HOME` → `HOS_SDK_HOME` → `DEVECO_SDK_HOME` → `/Applications/DevEco-Studio.app/Contents/sdk` → `~/.sdks/harmonyos/sdk`
- HarmonyOS emulator: `flutterOhos.harmony.emulatorPath` → `OHOS_EMULATOR_HOME` → the DevEco Studio installation directory
- Executables ultimately fall back to a `PATH` lookup.

## Notes

- **iOS Simulator UI**: newer Xcode versions may no longer ship `Simulator.app` (e.g. Xcode 27 uses `DeviceHub.app`). The extension auto-detects common locations (`Simulator.app` → `DeviceHub.app`), and reports an error in the **Emulators** view / dialog if it still fails; use `flutterOhos.ios.simulatorApp` to specify the app path manually. The launch flow is `xcrun simctl boot <udid>` followed by opening the UI.
- **VS Code not inheriting the terminal PATH on macOS**: when launched from the Dock/Finder, the VS Code extension host usually lacks the login shell `PATH`, so `flutter` cannot be found. This extension probes common install locations beyond `PATH` (`FLUTTER_ROOT`, `~/.sdks/flutter/sdk`, `~/flutter`, `~/development/flutter`, `~/fvm/*`, `/opt/flutter`, `/usr/local/flutter`, …) and injects the Flutter/Dart/HarmonyOS/Android tool directories into the child process `PATH`. If it still cannot find them, set `flutterOhos.flutterPath` manually.
- The Flutter OHOS fork's `flutter emulators` is incompatible on some platforms, so this extension **does not rely on it** and instead calls each platform's native tools directly.
- If `flutter devices` and `hdc` disagree, make sure the device is visible via `hdc list targets` and authorized.

## Project layout

```
src/
  extension.ts   Entry: registers commands, views, status bar
  controller.ts  Central state: device/emulator lists, run & debug dispatch
  commands.ts    Registration and implementation of all commands
  trees.ts       The Devices / Emulators / Commands views
  flutterCli.ts  Flutter process invocation and device parsing
  emulators.ts   Android / iOS / HarmonyOS emulator wrappers
  debug.ts       Dart-Code debug session and run arguments
  config.ts      Configuration reading and path auto-detection
  terminal.ts    Integrated terminal management
  platform.ts    Device platform classification
  logger.ts      Output channel
  util.ts        Shared utilities
l10n/            Runtime localization bundles (bundle.l10n*.json)
package.nls.json / package.nls.zh-cn.json   Manifest localization (English/Chinese)
resources/       Icons (flutter-ohos.svg activity-bar icon, icon.png marketplace icon)
```

## License

MIT
