# Developing Flutter Tools for HarmonyOS

Development, build and release guide for the VS Code extension. For installation and usage, see the [README](README.md).

**English** | [简体中文](DEVELOPING.zh-cn.md)

## Prerequisites

- Node.js 20+ and npm
- VS Code `^1.85.0`

## Run the extension locally

1. Open this repository in VS Code.
2. Press `F5` to launch the **Run Extension** configuration (a new Extension Development Host window opens).
3. In the new window, open a Flutter HarmonyOS project and use the **Flutter OHOS** activity-bar icon.

## Package as VSIX

```bash
npm install
npm run compile
npm run package
code --install-extension flutter-ohos-toolkit-<version>.vsix
```

The generated file is `flutter-ohos-toolkit-<version>.vsix`, where `<version>` is `package.json`'s `version` (e.g. `0.1.1`).

## npm scripts

| Script | Purpose |
| --- | --- |
| `npm run compile` | Type-check and compile TypeScript to `out/` |
| `npm run watch` | Compile in watch mode |
| `npm run package` | Build a `.vsix` (via `@vscode/vsce`) |
| `npm run publish` | Publish to the VS Code Marketplace |
| `npm run publish:ovsx` | Package and publish to Open VSX |
| `npm run ovsx:namespace` | Create the Open VSX publisher namespace |
| `npm run ovsx:verify` | Verify the Open VSX PAT |

## Automated release (GitHub Actions)

Pushing a version tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds the VSIX and creates a GitHub Release with the `.vsix` attached.

```bash
# 1. bump "version" in package.json, then commit
npm version patch --no-git-tag-version   # or minor / major / explicit x.y.z
git commit -am "chore: release 0.1.1"
git push

# 2. tag and push — the tag MUST match package.json version (e.g. v0.1.1)
git tag v0.1.1
git push origin v0.1.1
```

Optional — also publish to marketplaces by adding repository secrets:

| Secret | Purpose |
| --- | --- |
| `VSCE_PAT` | [VS Code Marketplace](https://marketplace.visualstudio.com/manage) personal access token |
| `OVSX_PAT` | [Open VSX](https://open-vsx.org) personal access token |

When the secrets are present the workflow also runs `npm run publish` (Marketplace) and `ovsx publish` (Open VSX). You can also trigger the workflow manually from the **Actions** tab (`workflow_dispatch`).

> If the GitHub Release is created but the marketplace versions do not advance (e.g. Open VSX stays on an older version), the corresponding `*_PAT` secret was missing when the tag was pushed. Add the secret and re-run the workflow, or publish the next patch release.

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
.github/workflows/release.yml   Tag-driven release pipeline
```

## License

MIT
