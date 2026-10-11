import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { Controller } from './controller';
import { initI18n, t } from './i18n';
import { disposeLogger, log } from './logger';
import { CommandsTreeProvider, DevicesTreeProvider, EmulatorsTreeProvider } from './trees';

export function activate(context: vscode.ExtensionContext): void {
  initI18n(context);

  const controller = new Controller();
  context.subscriptions.push(controller);

  registerCommands(context, controller);

  const devicesProvider = new DevicesTreeProvider(controller);
  const emulatorsProvider = new EmulatorsTreeProvider(controller);
  const commandsProvider = new CommandsTreeProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('flutterOhos.devices', devicesProvider),
    vscode.window.registerTreeDataProvider('flutterOhos.emulators', emulatorsProvider),
    vscode.window.registerTreeDataProvider('flutterOhos.commands', commandsProvider),
  );

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'flutterOhos.selectDevice';
  context.subscriptions.push(statusBar);

  const updateStatusBar = (): void => {
    const device = controller.selectedDevice;
    if (device) {
      statusBar.text = `$(device-mobile) ${device.name}`;
      statusBar.tooltip = t(
        'Flutter target: {0} ({1}) — click to change',
        device.name,
        device.id,
      );
    } else {
      statusBar.text = `$(device-mobile) ${t('Select Device')}`;
      statusBar.tooltip = t('Select a Flutter target device');
    }
    statusBar.show();
  };

  context.subscriptions.push(
    controller.onDidChangeDevices(updateStatusBar),
    controller.onDidChangeSelection(updateStatusBar),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('flutterOhos')) {
        return;
      }
      if (event.affectsConfiguration('flutterOhos.locale')) {
        // Re-render existing nodes; no need to re-query devices.
        devicesProvider.refresh();
        emulatorsProvider.refresh();
        commandsProvider.refresh();
      } else {
        void controller.refreshDevices(false);
        void controller.refreshEmulators(false);
      }
      updateStatusBar();
    }),
  );

  log('Flutter Tools for HarmonyOS activated.');
  log(`Flutter executable: ${controller.flutterPath}`);
  log(`Dart executable: ${controller.dartPath}`);
  updateStatusBar();

  if (controller.config.refreshOnStartup) {
    void controller.refreshDevices(false);
    void controller.refreshEmulators(false);
  }
}

export function deactivate(): void {
  disposeLogger();
}
