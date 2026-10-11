import * as vscode from 'vscode';
import { t } from './i18n';
import { Controller, RunMode } from './controller';
import { showLog } from './logger';
import { EmulatorNode, DeviceNode } from './trees';

function asDeviceNode(value: unknown): DeviceNode | undefined {
  return value instanceof DeviceNode ? value : undefined;
}

function asEmulatorNode(value: unknown): EmulatorNode | undefined {
  return value instanceof EmulatorNode ? value : undefined;
}

export function registerCommands(context: vscode.ExtensionContext, controller: Controller): void {
  const register = (id: string, handler: (...args: unknown[]) => unknown): void => {
    context.subscriptions.push(
      vscode.commands.registerCommand(id, handler as (...args: unknown[]) => unknown),
    );
  };

  const run = (args: string[]): void => controller.runFlutter(args);

  const runPlatform = (platform: 'android' | 'ios' | 'harmony', mode: RunMode) => () =>
    controller.runPlatform(platform, mode);

  const runPicked = (mode: RunMode) => async () => {
    const device = await controller.pickDevice();
    if (!device) {
      void vscode.window.showWarningMessage(t('No Flutter devices are available.'));
      return;
    }
    await controller.runOnDevice(device, mode);
  };

  /* ---------------------------------------------------------- Flutter CLI */

  register('flutterOhos.pubGet', () => run(['pub', 'get']));
  register('flutterOhos.pubUpgrade', () => run(['pub', 'upgrade']));
  register('flutterOhos.pubOutdated', () => run(['pub', 'outdated']));
  register('flutterOhos.clean', () => run(['clean']));
  register('flutterOhos.analyze', () => run(['analyze']));
  register('flutterOhos.test', () => run(['test']));
  register('flutterOhos.testCoverage', () => run(['test', '--coverage']));
  register('flutterOhos.doctor', () => run(['doctor']));
  register('flutterOhos.doctorVerbose', () => run(['doctor', '-v']));
  register('flutterOhos.format', () => controller.runRawCommand('dart format .'));
  register('flutterOhos.upgrade', () => run(['upgrade']));
  register('flutterOhos.buildRunner', () =>
    controller.runRawCommand('dart run build_runner build --delete-conflicting-outputs'),
  );
  register('flutterOhos.buildRunnerWatch', () =>
    controller.runRawCommand('dart run build_runner watch --delete-conflicting-outputs'),
  );
  register('flutterOhos.showDevices', () => run(['devices']));

  register('flutterOhos.customCommand', async () => {
    const input = await vscode.window.showInputBox({
      title: t('Run Flutter command'),
      prompt: t(
        'Enter a Flutter/Dart command. "flutter" and "dart" use the configured paths.',
      ),
      value: 'flutter ',
      valueSelection: [8, 8],
    });
    if (input && input.trim()) {
      controller.runRawCommand(input);
    }
  });

  /* --------------------------------------------------------------- Build */

  register('flutterOhos.build.apk', () => run(['build', 'apk']));
  register('flutterOhos.build.appbundle', () => run(['build', 'appbundle']));
  register('flutterOhos.build.ipa', () => run(['build', 'ipa']));
  register('flutterOhos.build.hap', () => run(['build', 'hap']));
  register('flutterOhos.build.har', () => run(['build', 'har']));
  register('flutterOhos.build.hsp', () => run(['build', 'hsp']));

  /* ----------------------------------------------------------- Emulators */

  register('flutterOhos.emulator.android', () => controller.launchEmulatorInteractive('android'));
  register('flutterOhos.emulator.ios', () => controller.launchEmulatorInteractive('ios'));
  register('flutterOhos.emulator.harmony', () => controller.launchEmulatorInteractive('harmony'));
  register('flutterOhos.emulator.openDeveco', () => controller.openDevEcoStudio());
  register('flutterOhos.emulator.launchItem', (node) => {
    const emulator = asEmulatorNode(node);
    if (emulator) {
      return controller.launchEmulator(emulator.entry);
    }
    return undefined;
  });

  /* ---------------------------------------------------------- Run & Debug */

  register('flutterOhos.run.android', runPlatform('android', 'run'));
  register('flutterOhos.run.ios', runPlatform('ios', 'run'));
  register('flutterOhos.run.harmony', runPlatform('harmony', 'run'));
  register('flutterOhos.debug.android', runPlatform('android', 'debug'));
  register('flutterOhos.debug.ios', runPlatform('ios', 'debug'));
  register('flutterOhos.debug.harmony', runPlatform('harmony', 'debug'));
  register('flutterOhos.run.pick', runPicked('run'));
  register('flutterOhos.debug.pick', runPicked('debug'));

  register('flutterOhos.run.device', (node) => {
    const device = asDeviceNode(node);
    return device ? controller.runOnDevice(device.device, 'run') : undefined;
  });
  register('flutterOhos.debug.device', (node) => {
    const device = asDeviceNode(node);
    return device ? controller.runOnDevice(device.device, 'debug') : undefined;
  });
  register('flutterOhos.copyDeviceId', async (node) => {
    const device = asDeviceNode(node)?.device ?? controller.selectedDevice;
    if (!device) {
      return;
    }
    await vscode.env.clipboard.writeText(device.id);
    void vscode.window.showInformationMessage(t('Copied device id: {0}', device.id));
  });

  /* ------------------------------------------------------------ General */

  register('flutterOhos.selectDevice', async () => {
    const device = await controller.pickDevice();
    if (device) {
      controller.setSelectedDevice(device.id);
      void vscode.window.showInformationMessage(t('Target device: {0}', device.name));
    }
  });

  register('flutterOhos.refresh', async () => {
    await Promise.all([controller.refreshDevices(), controller.refreshEmulators()]);
  });

  register('flutterOhos.openSettings', () =>
    vscode.commands.executeCommand('workbench.action.openSettings', 'flutterOhos'),
  );

  register('flutterOhos.showLog', () => showLog());
}
