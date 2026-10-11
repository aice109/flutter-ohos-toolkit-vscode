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
| `npm run release:patch` | Bump patch version, commit and tag |
| `npm run release:minor` | Bump minor version, commit and tag |
| `npm run release:major` | Bump major version, commit and tag |

## Release

Version bump, commit and tag are all handled by an npm script — a release is just two commands:

```bash
npm run release:patch   # or release:minor / release:major
git push && git push origin --tags
```

`npm run release:*` bumps `package.json` (and `package-lock.json`), commits as `chore: release <version>` and creates the matching `v<version>` git tag. Your working tree must be clean first.

Pushing the tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which:

1. verifies the tag matches `package.json`,
2. compiles and packages the VSIX,
3. creates (or updates) a GitHub Release with the `.vsix` attached,
4. publishes to **Open VSX** (requires the `OVSX_PAT` secret; the workflow fails fast if it is missing).

Optionally it also publishes to the VS Code Marketplace when `VSCE_PAT` is set:

| Secret | Purpose |
| --- | --- |
| `OVSX_PAT` | [Open VSX](https://open-vsx.org) personal access token — required for the automatic Open VSX publish |
| `VSCE_PAT` | [VS Code Marketplace](https://marketplace.visualstudio.com/manage) personal access token — optional |

You can also trigger the workflow manually from the **Actions** tab (`workflow_dispatch`) with an existing tag, e.g. after adding a missing secret.

> The tag must match the `package.json` version, otherwise the workflow stops at the version check. `npm run release:*` guarantees this.
>
> Re-running the workflow for a tag that already exists is safe — the GitHub Release is updated in place and Open VSX is published with `--skip-duplicate`.

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
