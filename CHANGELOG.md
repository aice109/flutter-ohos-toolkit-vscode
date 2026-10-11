# Changelog

## 0.1.0

Initial release.

### Commands
- Common Flutter commands in the integrated terminal: `pub get` / `pub upgrade` / `pub outdated`, `clean`, `analyze`, `test`, `test --coverage`, `dart format .`, `doctor`, `doctor -v`, `flutter upgrade`, `dart run build_runner build/watch`, and a custom command input box.
- Build commands: Android `apk` / `appbundle`, iOS `ipa`, HarmonyOS `hap` / `har` / `hsp`.

### Emulators & devices
- One-click emulator / simulator launch for all three platforms: Android AVD, iOS Simulator, HarmonyOS Emulator.
- Sidebar views: **Devices** (grouped by Android / iOS / HarmonyOS / Other, with inline run / debug / copy device ID), **Emulators**, and **Commands**.
- Status bar shows the current target device; click to switch.
- Quick run / debug for the selected platform device, or from the device list context menu. Run uses `flutter run` in the terminal; debug uses a Dart-Code `dart` session when available and falls back to the terminal otherwise.

### Tooling
- Automatic path detection for the Flutter / Dart toolchain, Android SDK, and HarmonyOS SDK, emulator and `hdc`.
- Fixture for macOS: injects detected tool directories into the child process `PATH` so `flutter` is found even when VS Code does not inherit the login shell `PATH`.
- Robust iOS Simulator UI detection (`Simulator.app` → `DeviceHub.app`, e.g. Xcode 27), with `flutterOhos.ios.simulatorApp` override and error surfacing in the view.
- Does not rely on the Flutter OHOS fork's `flutter emulators`, calling each platform's native tools directly instead.

### Localization
- Built-in **English** and **简体中文 (zh-cn)**.
- `flutterOhos.locale` (`auto` / `en` / `zh-cn`) switches the extension's own UI — sidebar content, status bar, dialogs, quick picks and input boxes — independently of the VS Code display language.
- Manifest localization (`package.nls*.json`) and runtime localization bundles (`l10n/bundle.l10n*.json`) for commands, settings, views and messages.

### Icons
- Flutter + HarmonyOS combined icon: activity-bar monochrome icon (`resources/flutter-ohos.svg`) and colored marketplace icon (`resources/icon.png`).
