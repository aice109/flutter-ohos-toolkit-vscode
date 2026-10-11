import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execCapture } from './flutterCli';
import { MobilePlatform } from './platform';

/** Ensure system tool directories are reachable even with a minimal PATH. */
function baseEnv(): NodeJS.ProcessEnv {
  const extra = process.platform === 'win32' ? [] : ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  const parts = [process.env.PATH, ...extra].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
  return { PATH: parts.join(path.delimiter) };
}

export interface EmulatorEntry {
  /** Stable identifier used to launch the emulator. */
  id: string;
  name: string;
  platform: MobilePlatform;
  /** Extra text shown in the tree / quick pick. */
  detail?: string;
  state?: string;
}

interface SimctlDevice {
  name: string;
  udid: string;
  state: string;
  isAvailable?: boolean;
  deviceTypeIdentifier?: string;
}

interface SimctlResult {
  devices: Record<string, SimctlDevice[]>;
}

function launchDetached(file: string, args: string[], cwd?: string): void {
  const child = spawn(file, args, {
    cwd,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.on('error', () => {
    // Errors are surfaced by the caller's listing step; nothing actionable here.
  });
  child.unref();
}

/* ------------------------------------------------------------------ Android */

export async function listAndroidAvds(emulatorPath: string): Promise<EmulatorEntry[]> {
  const result = await execCapture(emulatorPath, ['-list-avds'], { env: baseEnv() });
  if (result.error && !result.stdout.trim()) {
    throw new Error(result.stderr.trim() || result.error.message);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('INFO') && !line.startsWith('WARNING'))
    .map((name) => ({ id: name, name, platform: 'android' as const }));
}

export function launchAndroidAvd(emulatorPath: string, avd: string): void {
  launchDetached(emulatorPath, ['-avd', avd], path.dirname(emulatorPath));
}

/* ---------------------------------------------------------------------- iOS */

export async function listIosSimulators(): Promise<EmulatorEntry[]> {
  const result = await execCapture('xcrun', [
    'simctl',
    'list',
    'devices',
    'available',
    '--json',
  ], { env: baseEnv() });
  if (result.error && !result.stdout.trim()) {
    throw new Error(result.stderr.trim() || result.error.message);
  }
  let parsed: SimctlResult;
  try {
    parsed = JSON.parse(result.stdout) as SimctlResult;
  } catch {
    throw new Error(
      `Unexpected output from 'xcrun simctl': ${(result.stdout || result.stderr).trim().slice(0, 200)}`,
    );
  }
  const entries: EmulatorEntry[] = [];
  for (const [runtime, devices] of Object.entries(parsed.devices)) {
    const match = runtime.match(/iOS[-_ ]?([\d._-]+)/);
    const version = match ? match[1].replace(/[-_]/g, '.') : runtime;
    for (const device of devices) {
      if (device.isAvailable === false) {
        continue;
      }
      entries.push({
        id: device.udid,
        name: device.name,
        platform: 'ios',
        detail: `iOS ${version}`.trim(),
        state: device.state,
      });
    }
  }
  return entries;
}

function expandHome(candidate: string): string {
  return candidate.startsWith('~') ? path.join(os.homedir(), candidate.slice(1)) : candidate;
}

/**
 * Locate the app that renders the iOS Simulator UI. Modern Xcode ships
 * Simulator.app inside the developer dir, while some builds (e.g. Xcode 27)
 * replace it with DeviceHub.app.
 */
async function findSimulatorApp(override?: string): Promise<string | undefined> {
  const candidates: string[] = [];
  if (override) {
    candidates.push(expandHome(override));
  }
  const dev = await execCapture('xcode-select', ['-p'], { env: baseEnv() });
  const devDir = dev.stdout.trim();
  if (devDir) {
    candidates.push(path.join(devDir, 'Applications', 'Simulator.app'));
  }
  candidates.push(
    '/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app',
    '/Applications/Xcode.app/Contents/Applications/Simulator.app',
    '/Applications/Xcode.app/Contents/Applications/DeviceHub.app',
    '/Applications/Simulator.app',
    '/Applications/DeviceHub.app',
  );
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore and keep looking.
    }
  }
  return undefined;
}

export async function launchIosSimulator(
  udid?: string,
  options: { simulatorApp?: string } = {},
): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('iOS Simulator is only available on macOS.');
  }
  if (udid) {
    const boot = await execCapture('xcrun', ['simctl', 'boot', udid], { env: baseEnv() });
    if (boot.code !== 0 && !/booted|current state/i.test(boot.stderr)) {
      throw new Error(boot.stderr.trim() || `Failed to boot iOS simulator ${udid}`);
    }
  }
  const app = await findSimulatorApp(options.simulatorApp);
  const open = await execCapture('open', app ? [app] : ['-a', 'Simulator'], { env: baseEnv() });
  if (open.code !== 0) {
    throw new Error(
      open.stderr.trim() ||
        'Unable to open the iOS Simulator UI. Install Xcode or set "flutterOhos.ios.simulatorApp".',
    );
  }
}

/* ----------------------------------------------------------------- HarmonyOS */

export async function listHarmonyEmulators(emulatorPath: string): Promise<EmulatorEntry[]> {
  const cwd = path.dirname(emulatorPath);
  const result = await execCapture(emulatorPath, ['-list'], { cwd, env: baseEnv() });
  if (result.error && !result.stdout.trim()) {
    throw new Error(result.stderr.trim() || result.error.message);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('[') && !line.startsWith('-'))
    .map((name) => ({ id: name, name, platform: 'harmony' as const }));
}

export function startHarmonyEmulator(emulatorPath: string, name: string): void {
  launchDetached(emulatorPath, ['-start', name], path.dirname(emulatorPath));
}

export function stopHarmonyEmulator(emulatorPath: string, name: string): void {
  launchDetached(emulatorPath, ['-stop', name], path.dirname(emulatorPath));
}

/* -------------------------------------------------------------------- hdc */

export interface HarmonyTarget {
  id: string;
  state: string;
}

export async function listHarmonyTargets(hdcPath: string): Promise<HarmonyTarget[]> {
  const result = await execCapture(hdcPath, ['list', 'targets', '-v']);
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('['))
    .map((line) => {
      const [id, state] = line.split(/\s+/);
      return { id: id ?? line, state: state ?? 'device' };
    })
    .filter((target) => target.id.length > 0);
}
