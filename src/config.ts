import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

export interface FlutterOhosConfig {
  flutterPath: string;
  dartPath: string;
  android: {
    sdkPath: string;
    emulatorPath: string;
  };
  ios: {
    simulatorDevice: string;
    simulatorApp: string;
  };
  harmony: {
    sdkPath: string;
    hdcPath: string;
    emulatorPath: string;
    devecoPath: string;
  };
  terminal: {
    name: string;
    reuse: boolean;
  };
  run: {
    mainEntry: string;
    extraArgs: string;
    pubGetBeforeRun: boolean;
  };
  refreshOnStartup: boolean;
}

export function getConfig(): FlutterOhosConfig {
  const c = vscode.workspace.getConfiguration('flutterOhos');
  return {
    flutterPath: c.get<string>('flutterPath', 'flutter') || 'flutter',
    dartPath: c.get<string>('dartPath', 'dart') || 'dart',
    android: {
      sdkPath: c.get<string>('android.sdkPath', ''),
      emulatorPath: c.get<string>('android.emulatorPath', ''),
    },
    ios: {
      simulatorDevice: c.get<string>('ios.simulatorDevice', ''),
      simulatorApp: c.get<string>('ios.simulatorApp', ''),
    },
    harmony: {
      sdkPath: c.get<string>('harmony.sdkPath', ''),
      hdcPath: c.get<string>('harmony.hdcPath', ''),
      emulatorPath: c.get<string>('harmony.emulatorPath', ''),
      devecoPath: c.get<string>('harmony.devecoPath', ''),
    },
    terminal: {
      name: c.get<string>('terminal.name', 'Flutter') || 'Flutter',
      reuse: c.get<boolean>('terminal.reuse', true),
    },
    run: {
      mainEntry: c.get<string>('run.mainEntry', ''),
      extraArgs: c.get<string>('run.extraArgs', ''),
      pubGetBeforeRun: c.get<boolean>('run.pubGetBeforeRun', false),
    },
    refreshOnStartup: c.get<boolean>('refreshOnStartup', true),
  };
}

function isDir(candidate: string | undefined): candidate is string {
  if (!candidate) {
    return false;
  }
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function isFile(candidate: string | undefined): candidate is string {
  if (!candidate) {
    return false;
  }
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function firstDir(candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (isDir(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function firstFile(candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (isFile(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/** Look up an executable on PATH. */
export function whichSync(binary: string): string | undefined {
  const pathValue = process.env.PATH ?? '';
  const separator = process.platform === 'win32' ? ';' : ':';
  const extensions =
    process.platform === 'win32'
      ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';')
      : [''];
  for (const dir of pathValue.split(separator)) {
    if (!dir) {
      continue;
    }
    for (const ext of extensions) {
      const full = path.join(dir, binary + (ext ? ext.toLowerCase() : ''));
      if (isFile(full)) {
        return full;
      }
    }
  }
  return undefined;
}

const DEVECO_APP_MAC = '/Applications/DevEco-Studio.app';

export function resolveAndroidSdk(cfg: FlutterOhosConfig): string | undefined {
  return firstDir([
    cfg.android.sdkPath,
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(os.homedir(), 'Library', 'Android', 'sdk'),
    path.join(os.homedir(), '.sdks', 'android', 'sdk'),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : undefined,
  ]);
}

export function resolveAndroidEmulator(cfg: FlutterOhosConfig): string | undefined {
  const exe = process.platform === 'win32' ? 'emulator.exe' : 'emulator';
  const sdk = resolveAndroidSdk(cfg);
  return firstFile([
    cfg.android.emulatorPath,
    sdk ? path.join(sdk, 'emulator', exe) : undefined,
    whichSync('emulator'),
  ]);
}

export function resolveHarmonySdk(cfg: FlutterOhosConfig): string | undefined {
  const devecoSdkRoot = process.env.DEVECO_SDK_HOME;
  return firstDir([
    cfg.harmony.sdkPath,
    process.env.OHOS_SDK_HOME,
    process.env.HOS_SDK_HOME,
    process.env.HARMONYOS_SDK_HOME,
    devecoSdkRoot,
    path.join(DEVECO_APP_MAC, 'Contents', 'sdk'),
    path.join(os.homedir(), '.sdks', 'harmonyos', 'sdk'),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Huawei', 'Sdk') : undefined,
  ]);
}

export function resolveHdc(cfg: FlutterOhosConfig): string | undefined {
  const exe = process.platform === 'win32' ? 'hdc.exe' : 'hdc';
  const sdk = resolveHarmonySdk(cfg);
  return firstFile([
    cfg.harmony.hdcPath,
    sdk ? path.join(sdk, 'default', 'openharmony', 'toolchains', exe) : undefined,
    sdk ? path.join(sdk, 'openharmony', 'toolchains', exe) : undefined,
    whichSync('hdc'),
  ]);
}

export function resolveHarmonyEmulator(cfg: FlutterOhosConfig): string | undefined {
  const fromHome = process.env.OHOS_EMULATOR_HOME;
  return firstFile([
    cfg.harmony.emulatorPath,
    fromHome
      ? path.join(fromHome, 'emulator', process.platform === 'win32' ? 'Emulator.exe' : 'Emulator')
      : undefined,
    path.join(DEVECO_APP_MAC, 'Contents', 'tools', 'emulator', 'Emulator'),
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Huawei', 'Sdk', 'emulator', 'Emulator.exe')
      : undefined,
    whichSync('Emulator'),
  ]);
}

export function resolveDevecoStudio(cfg: FlutterOhosConfig): string {
  return (
    firstDir([cfg.harmony.devecoPath]) ??
    firstDir([DEVECO_APP_MAC]) ??
    cfg.harmony.devecoPath ??
    DEVECO_APP_MAC
  );
}

function expandHome(candidate: string): string {
  return candidate.startsWith('~') ? path.join(os.homedir(), candidate.slice(1)) : candidate;
}

function basenameList(name: string): string[] {
  return process.platform === 'win32' ? [`${name}.bat`, `${name}.exe`, name] : [name];
}

/** Common Flutter SDK install locations to search when it is not on PATH. */
function flutterCandidates(): string[] {
  const bin = process.platform === 'win32' ? 'flutter.bat' : 'flutter';
  const roots = [
    process.env.FLUTTER_ROOT,
    process.env.FLUTTER_HOME,
    '~/.sdks/flutter/sdk',
    '~/.sdks/flutter/flutter',
    '~/flutter',
    '~/development/flutter',
    '~/fvm/default',
    '~/.fvm/default',
    '/opt/flutter',
    '/usr/local/flutter',
    '/opt/homebrew/opt/flutter',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'flutter') : undefined,
    'C:\\src\\flutter',
    'C:\\flutter',
  ];
  const candidates: string[] = [];
  for (const root of roots) {
    if (root) {
      candidates.push(path.join(expandHome(root), 'bin', bin));
    }
  }
  for (const versionsRoot of ['~/fvm/versions', '~/.fvm/versions']) {
    const dir = expandHome(versionsRoot);
    try {
      for (const entry of fs.readdirSync(dir)) {
        candidates.push(path.join(dir, entry, 'bin', bin));
      }
    } catch {
      // Directory does not exist; ignore.
    }
  }
  return candidates;
}

/**
 * Resolve the Flutter executable. On macOS the VS Code extension host often
 * does not inherit the login shell PATH, so fall back to well-known locations.
 */
export function resolveFlutterExecutable(cfg: FlutterOhosConfig): string {
  const configured = (cfg.flutterPath || 'flutter').trim() || 'flutter';
  const expanded = expandHome(configured);
  if (expanded.includes('/') || expanded.includes('\\')) {
    return expanded;
  }
  return whichSync(expanded) ?? firstFile(flutterCandidates()) ?? expanded;
}

/** Resolve the Dart executable, preferring the one shipped with Flutter. */
export function resolveDartExecutable(cfg: FlutterOhosConfig, flutterPath?: string): string {
  const configured = (cfg.dartPath || 'dart').trim() || 'dart';
  const expanded = expandHome(configured);
  if (expanded.includes('/') || expanded.includes('\\')) {
    return expanded;
  }
  const flutter = flutterPath ?? resolveFlutterExecutable(cfg);
  const flutterBin = path.dirname(flutter);
  const candidates: string[] = [path.join(flutterBin, '..', 'bin', 'dart')];
  for (const name of basenameList('dart')) {
    candidates.push(path.join(flutterBin, name));
  }
  candidates.push(
    path.join(flutterBin, 'cache', 'dart-sdk', 'bin', process.platform === 'win32' ? 'dart.exe' : 'dart'),
  );
  return whichSync(expanded) ?? firstFile(candidates) ?? expanded;
}

/** Directories that child processes (flutter/dart/build tools) may need. */
export function toolPathEntries(cfg: FlutterOhosConfig, flutterPath: string, dartPath: string): string[] {
  const entries = new Set<string>();
  const add = (value: string | undefined): void => {
    if (value) {
      entries.add(path.dirname(value));
    }
  };
  add(flutterPath);
  add(dartPath);
  add(resolveHdc(cfg));

  const androidSdk = resolveAndroidSdk(cfg);
  if (androidSdk) {
    entries.add(path.join(androidSdk, 'platform-tools'));
    entries.add(path.join(androidSdk, 'emulator'));
  }
  const harmonySdk = resolveHarmonySdk(cfg);
  if (harmonySdk) {
    entries.add(path.join(harmonySdk, 'default', 'openharmony', 'toolchains'));
  }
  return [...entries];
}

/** First workspace folder path, used as the default working directory. */
export function workspaceCwd(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function workspaceFolder(): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.[0];
}
