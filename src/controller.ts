import * as path from 'path';
import * as vscode from 'vscode';
import { t } from './i18n';
import {
  FlutterOhosConfig,
  getConfig,
  resolveAndroidEmulator,
  resolveDartExecutable,
  resolveDevecoStudio,
  resolveFlutterExecutable,
  resolveHarmonyEmulator,
  toolPathEntries,
  workspaceCwd,
} from './config';
import { buildFlutterRunArgs, startDartDebugSession } from './debug';
import {
  EmulatorEntry,
  launchAndroidAvd,
  launchIosSimulator,
  listAndroidAvds,
  listHarmonyEmulators,
  listIosSimulators,
  startHarmonyEmulator,
} from './emulators';
import { FlutterDevice, execCapture, listFlutterDevices } from './flutterCli';
import { log, logError, logWarn, showLog } from './logger';
import {
  MobilePlatform,
  PLATFORM_ORDER,
  PlatformKey,
  platformLabel,
  platformOfDevice,
} from './platform';
import { TerminalManager } from './terminal';
import { buildCommand, oneLine, splitArgs } from './util';

export interface DeviceGroup {
  key: PlatformKey;
  label: string;
  devices: FlutterDevice[];
}

export interface EmulatorGroup {
  platform: MobilePlatform;
  label: string;
  entries: EmulatorEntry[];
  error?: string;
}

export type RunMode = 'run' | 'debug';

const MOBILE_PLATFORMS: MobilePlatform[] = ['android', 'ios', 'harmony'];

export class Controller implements vscode.Disposable {
  private readonly devicesChanged = new vscode.EventEmitter<void>();
  private readonly emulatorsChanged = new vscode.EventEmitter<void>();
  private readonly selectionChanged = new vscode.EventEmitter<void>();
  private readonly disposables: vscode.Disposable[] = [];

  readonly onDidChangeDevices = this.devicesChanged.event;
  readonly onDidChangeEmulators = this.emulatorsChanged.event;
  readonly onDidChangeSelection = this.selectionChanged.event;

  readonly terminal: TerminalManager;

  private devices: FlutterDevice[] = [];
  private emulators: EmulatorEntry[] = [];
  private emulatorErrors: Partial<Record<MobilePlatform, string>> = {};
  private selectedDeviceId: string | undefined;
  private deviceErrorText: string | undefined;
  private refreshingDevices = false;
  private refreshingEmulators = false;

  constructor() {
    this.terminal = new TerminalManager(
      () => this.config.terminal.name,
      () => this.config.terminal.reuse,
    );
    this.disposables.push(this.terminal, this.devicesChanged, this.emulatorsChanged, this.selectionChanged);
  }

  get config(): FlutterOhosConfig {
    return getConfig();
  }

  get cwd(): string | undefined {
    return workspaceCwd();
  }

  /** Fully resolved Flutter executable (auto-detected when not on PATH). */
  get flutterPath(): string {
    return resolveFlutterExecutable(this.config);
  }

  /** Fully resolved Dart executable. */
  get dartPath(): string {
    return resolveDartExecutable(this.config, this.flutterPath);
  }

  /** PATH augmented with Flutter/Dart/SDK tool directories. */
  private toolEnv(): NodeJS.ProcessEnv {
    const entries = toolPathEntries(this.config, this.flutterPath, this.dartPath);
    const current = process.env.PATH ?? '';
    const merged = [...entries, current].filter((value) => value.length > 0).join(path.delimiter);
    return { PATH: merged };
  }

  getDeviceList(): readonly FlutterDevice[] {
    return this.devices;
  }

  getEmulatorList(): readonly EmulatorEntry[] {
    return this.emulators;
  }

  get selectedDevice(): FlutterDevice | undefined {
    return this.devices.find((device) => device.id === this.selectedDeviceId);
  }

  /** Last device-discovery error, if any (surfaced in the Devices view). */
  get deviceError(): string | undefined {
    return this.deviceErrorText;
  }

  setSelectedDevice(deviceId: string | undefined): void {
    if (this.selectedDeviceId === deviceId) {
      return;
    }
    this.selectedDeviceId = deviceId;
    this.selectionChanged.fire();
  }

  groupDevices(): DeviceGroup[] {
    const buckets = new Map<PlatformKey, FlutterDevice[]>();
    for (const device of this.devices) {
      const key = platformOfDevice(device);
      const bucket = buckets.get(key) ?? [];
      bucket.push(device);
      buckets.set(key, bucket);
    }
    return PLATFORM_ORDER.filter((key) => buckets.has(key)).map((key) => ({
      key,
      label: platformLabel(key),
      devices: buckets.get(key) ?? [],
    }));
  }

  groupEmulators(): EmulatorGroup[] {
    return MOBILE_PLATFORMS.map((platform) => ({
      platform,
      label: platformLabel(platform),
      entries: this.emulators.filter((entry) => entry.platform === platform),
      error: this.emulatorErrors[platform],
    }));
  }

  /* ------------------------------------------------------------- processes */

  /** Run an arbitrary `flutter ...` command in the integrated terminal. */
  runFlutter(args: string[], options: { name?: string; clear?: boolean } = {}): void {
    const cwd = this.cwd;
    const command = buildCommand(this.flutterPath, args);
    log(`> ${command}`);
    this.terminal.run(command, { name: options.name, cwd, clear: options.clear });
  }

  /** Run a raw command typed by the user, mapping `flutter`/`dart` to config. */
  runRawCommand(raw: string): void {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    let command: string;
    if (/^flutter(\s|$)/i.test(trimmed)) {
      command = `${buildCommand(this.flutterPath, [])}${trimmed.slice('flutter'.length)}`;
    } else if (/^dart(\s|$)/i.test(trimmed)) {
      command = `${buildCommand(this.dartPath, [])}${trimmed.slice('dart'.length)}`;
    } else {
      command = buildCommand(this.flutterPath, splitArgs(trimmed));
    }
    log(`> ${command}`);
    this.terminal.run(command, { cwd: this.cwd });
  }

  private async pubGet(): Promise<void> {
    const cwd = this.cwd;
    if (!cwd) {
      return;
    }
    log('Running `flutter pub get` before launch...');
    const result = await execCapture(this.flutterPath, ['pub', 'get'], {
      cwd,
      env: this.toolEnv(),
    });
    if (result.code !== 0) {
      logWarn(`pub get failed: ${oneLine(result.stderr || result.stdout)}`);
    } else {
      log('pub get finished.');
    }
  }

  /* -------------------------------------------------------------- devices */

  async refreshDevices(showErrors = true): Promise<void> {
    if (this.refreshingDevices) {
      return;
    }
    this.refreshingDevices = true;
    try {
      const devices = await listFlutterDevices(this.flutterPath, {
        cwd: this.cwd,
        env: this.toolEnv(),
      });
      this.devices = devices;
      this.deviceErrorText = undefined;
      if (this.selectedDeviceId && !devices.some((d) => d.id === this.selectedDeviceId)) {
        this.setSelectedDevice(undefined);
      }
      if (!this.selectedDeviceId) {
        const firstMobile = devices.find((d) => platformOfDevice(d) !== 'other');
        if (firstMobile) {
          this.setSelectedDevice(firstMobile.id);
        }
      }
      log(`Discovered ${devices.length} Flutter device(s).`);
    } catch (error) {
      logError('Failed to refresh Flutter devices', error);
      this.deviceErrorText = error instanceof Error ? error.message : String(error);
      if (showErrors) {
        const message = error instanceof Error ? error.message : String(error);
        const action = await vscode.window.showWarningMessage(
          t('Unable to load Flutter devices: {0}', oneLine(message, 200)),
          t('Open Settings'),
          t('Show Log'),
        );
        if (action === t('Show Log')) {
          showLog();
        } else if (action === t('Open Settings')) {
          void vscode.commands.executeCommand('flutterOhos.openSettings');
        }
      }
    } finally {
      this.refreshingDevices = false;
      this.devicesChanged.fire();
    }
  }

  async pickDevice(platforms?: PlatformKey[]): Promise<FlutterDevice | undefined> {
    if (this.devices.length === 0) {
      await this.refreshDevices(false);
    }
    const pool = platforms
      ? this.devices.filter((device) => platforms.includes(platformOfDevice(device)))
      : this.devices;
    if (pool.length === 0) {
      return undefined;
    }
    if (pool.length === 1) {
      return pool[0];
    }
    const picked = await vscode.window.showQuickPick(
      pool.map((device) => ({
        label: device.name,
        description: `${platformLabel(platformOfDevice(device))} · ${device.id}`,
        detail: device.emulator ? t('Emulator / Simulator') : device.sdk,
        device,
      })),
      { placeHolder: t('Select a device'), matchOnDescription: true },
    );
    return picked?.device;
  }

  private async deviceForPlatform(platform: MobilePlatform): Promise<FlutterDevice | undefined> {
    const selected = this.selectedDevice;
    if (selected && platformOfDevice(selected) === platform) {
      return selected;
    }
    if (this.devices.length === 0) {
      await this.refreshDevices(false);
    }
    const candidates = this.devices.filter((device) => platformOfDevice(device) === platform);
    if (candidates.length === 0) {
      return undefined;
    }
    if (candidates.length === 1) {
      return candidates[0];
    }
    return this.pickDevice([platform]);
  }

  /* ---------------------------------------------------------------- run */

  async runPlatform(platform: MobilePlatform, mode: RunMode): Promise<void> {
    const device = await this.deviceForPlatform(platform);
    if (!device) {
      const action = await vscode.window.showWarningMessage(
        t('No {0} device or emulator is available.', platformLabel(platform)),
        t('Launch Emulator'),
        t('Refresh Devices'),
      );
      if (action === t('Launch Emulator')) {
        await this.launchEmulatorInteractive(platform);
      } else if (action === t('Refresh Devices')) {
        await this.refreshDevices();
      }
      return;
    }
    await this.runOnDevice(device, mode);
  }

  async runOnDevice(device: FlutterDevice, mode: RunMode): Promise<void> {
    const cwd = this.cwd;
    if (!cwd) {
      void vscode.window.showWarningMessage(t('Open a Flutter project folder first.'));
      return;
    }
    if (this.config.run.pubGetBeforeRun) {
      await this.pubGet();
    }
    if (mode === 'debug') {
      const started = await startDartDebugSession(cwd, device.id, this.config);
      if (started) {
        this.setSelectedDevice(device.id);
        return;
      }
    }
    this.setSelectedDevice(device.id);
    const args = buildFlutterRunArgs(this.config, device.id);
    this.runFlutter(args);
  }

  /* ------------------------------------------------------------ emulators */

  async refreshEmulators(showErrors = false): Promise<void> {
    if (this.refreshingEmulators) {
      return;
    }
    this.refreshingEmulators = true;
    const cfg = this.config;
    const errors: Partial<Record<MobilePlatform, string>> = {};
    const collected: EmulatorEntry[] = [];

    const androidEmulator = resolveAndroidEmulator(cfg);
    if (androidEmulator) {
      try {
        collected.push(...(await listAndroidAvds(androidEmulator)));
      } catch (error) {
        errors.android = error instanceof Error ? error.message : String(error);
      }
    } else {
      errors.android = t('Android emulator binary not found.');
    }

    if (process.platform === 'darwin') {
      try {
        collected.push(...(await listIosSimulators()));
      } catch (error) {
        errors.ios = error instanceof Error ? error.message : String(error);
      }
    } else {
      errors.ios = t('iOS Simulator is only available on macOS.');
    }

    const harmonyEmulator = resolveHarmonyEmulator(cfg);
    if (harmonyEmulator) {
      try {
        collected.push(...(await listHarmonyEmulators(harmonyEmulator)));
      } catch (error) {
        errors.harmony = error instanceof Error ? error.message : String(error);
      }
    } else {
      errors.harmony = t('HarmonyOS emulator binary not found. Configure flutterOhos.harmony.emulatorPath.');
    }

    this.emulators = collected;
    this.emulatorErrors = errors;
    this.refreshingEmulators = false;
    this.emulatorsChanged.fire();

    if (showErrors) {
      const problem = Object.values(errors)[0];
      if (problem && collected.length === 0) {
        void vscode.window.showWarningMessage(
          t('Emulators: {0}', oneLine(problem, 200)),
          t('Show Log'),
        );
      }
    }
  }

  async launchEmulator(entry: EmulatorEntry): Promise<void> {
    const cfg = this.config;
    try {
      if (entry.platform === 'android') {
        const emulator = resolveAndroidEmulator(cfg);
        if (!emulator) {
          throw new Error(t('Android emulator binary not found.'));
        }
        launchAndroidAvd(emulator, entry.id);
      } else if (entry.platform === 'ios') {
        await launchIosSimulator(entry.id, { simulatorApp: cfg.ios.simulatorApp });
      } else {
        const emulator = resolveHarmonyEmulator(cfg);
        if (!emulator) {
          throw new Error(t('HarmonyOS emulator binary not found.'));
        }
        startHarmonyEmulator(emulator, entry.id);
      }
      void vscode.window.showInformationMessage(t('Launching {0}...', entry.name));
      log(`Launched ${entry.platform} emulator: ${entry.name}`);
      // Give the emulator a moment, then refresh so Flutter can see it.
      setTimeout(() => void this.refreshDevices(false), 8000);
    } catch (error) {
      logError(`Failed to launch ${entry.name}`, error);
      void vscode.window.showErrorMessage(
        t(
          'Failed to launch {0}: {1}',
          entry.name,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  async launchEmulatorInteractive(platform: MobilePlatform): Promise<void> {
    const entries = await this.loadEmulatorsForPlatform(platform);
    if (entries === undefined) {
      return;
    }
    if (entries.length === 0) {
      void vscode.window.showWarningMessage(
        t(
          'No {0} emulators were found. {1}',
          platformLabel(platform),
          this.emulatorErrors[platform] ?? '',
        ).trim(),
      );
      return;
    }
    const picked = await vscode.window.showQuickPick(
      entries.map((entry) => ({
        label: entry.name,
        description: entry.detail ?? entry.id,
        detail: entry.state,
        entry,
      })),
      { placeHolder: t('Select a {0} emulator', platformLabel(platform)) },
    );
    if (picked) {
      await this.launchEmulator(picked.entry);
    }
  }

  private async loadEmulatorsForPlatform(
    platform: MobilePlatform,
  ): Promise<EmulatorEntry[] | undefined> {
    const cfg = this.config;
    try {
      if (platform === 'android') {
        const emulator = resolveAndroidEmulator(cfg);
        if (!emulator) {
          throw new Error(t('Android emulator binary not found.'));
        }
        return await listAndroidAvds(emulator);
      }
      if (platform === 'ios') {
        if (process.platform !== 'darwin') {
          throw new Error(t('iOS Simulator is only available on macOS.'));
        }
        return await listIosSimulators();
      }
      const emulator = resolveHarmonyEmulator(cfg);
      if (!emulator) {
        throw new Error(t('HarmonyOS emulator binary not found.'));
      }
      return await listHarmonyEmulators(emulator);
    } catch (error) {
      logError(`Failed to list ${platform} emulators`, error);
      void vscode.window.showErrorMessage(
        t(
          'Failed to list {0} emulators: {1}',
          platformLabel(platform),
          error instanceof Error ? error.message : String(error),
        ),
      );
      return undefined;
    }
  }

  async openDevEcoStudio(): Promise<void> {
    const studio = resolveDevecoStudio(this.config);
    try {
      if (process.platform === 'darwin') {
        await execCapture('open', ['-a', studio]);
      } else if (process.platform === 'win32') {
        await execCapture('cmd', ['/c', 'start', '', studio]);
      } else {
        await execCapture(studio, []);
      }
      log(`Opened DevEco Studio: ${studio}`);
    } catch (error) {
      logError('Failed to open DevEco Studio', error);
      void vscode.window.showErrorMessage(
        t('Failed to open DevEco Studio. Check flutterOhos.harmony.devecoPath.'),
      );
    }
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}
