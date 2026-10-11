import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { FlutterOhosConfig } from './config';
import { splitArgs } from './util';
import { logWarn } from './logger';

const DART_DEBUG_EXTENSIONS = ['Dart-Code.dart-code', 'Dart-Code.flutter'];

export function hasDartDebugger(): boolean {
  return DART_DEBUG_EXTENSIONS.some((id) => vscode.extensions.getExtension(id) !== undefined);
}

function resolveEntrypoint(cfg: FlutterOhosConfig, cwd: string): string | undefined {
  if (cfg.run.mainEntry) {
    return path.isAbsolute(cfg.run.mainEntry)
      ? cfg.run.mainEntry
      : path.join(cwd, cfg.run.mainEntry);
  }
  const defaultEntry = path.join(cwd, 'lib', 'main.dart');
  return fs.existsSync(defaultEntry) ? defaultEntry : undefined;
}

/**
 * Start a Dart-Code debug session targeting a specific Flutter device.
 * Returns false when the Dart/Flutter debug extension is not installed so the
 * caller can fall back to a plain `flutter run` terminal.
 */
export async function startDartDebugSession(
  cwd: string,
  deviceId: string,
  cfg: FlutterOhosConfig,
): Promise<boolean> {
  if (!hasDartDebugger()) {
    logWarn('Dart-Code debugger not found; falling back to a `flutter run` terminal.');
    return false;
  }

  const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(cwd));
  const config: vscode.DebugConfiguration = {
    type: 'dart',
    request: 'launch',
    name: `Flutter (${deviceId})`,
    cwd,
    deviceId,
    flutterMode: 'debug',
  };

  const entrypoint = resolveEntrypoint(cfg, cwd);
  if (entrypoint) {
    config.program = entrypoint;
  }

  const extra = splitArgs(cfg.run.extraArgs);
  if (extra.length > 0) {
    config.args = extra;
  }

  const started = await vscode.debug.startDebugging(folder, config);
  if (!started) {
    logWarn('Dart debug session could not be started; falling back to a terminal run.');
  }
  return started;
}

/** Compose the `flutter run` invocation used for terminal-based launches. */
export function buildFlutterRunArgs(
  cfg: FlutterOhosConfig,
  deviceId?: string,
  extra: string[] = [],
): string[] {
  const args = ['run'];
  if (deviceId) {
    args.push('-d', deviceId);
  }
  args.push(...splitArgs(cfg.run.extraArgs), ...extra);
  return args;
}
