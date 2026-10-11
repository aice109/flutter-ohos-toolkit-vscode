import * as vscode from 'vscode';
import { t } from './i18n';
import { Controller, DeviceGroup, EmulatorGroup } from './controller';
import { EmulatorEntry } from './emulators';
import { FlutterDevice } from './flutterCli';
import { PLATFORM_ICONS } from './platform';

/* ------------------------------------------------------------------ Devices */

export type DeviceTreeNode = DeviceGroupNode | DeviceNode | DeviceInfoNode;

export class DeviceGroupNode extends vscode.TreeItem {
  readonly kind = 'group';
  constructor(readonly group: DeviceGroup) {
    super(
      group.label,
      group.devices.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );
    this.id = `device-group:${group.key}`;
    this.contextValue = 'deviceGroup';
    this.iconPath = new vscode.ThemeIcon(PLATFORM_ICONS[group.key]);
    this.description = `${group.devices.length}`;
  }
}

export class DeviceNode extends vscode.TreeItem {
  readonly kind = 'device';
  constructor(readonly device: FlutterDevice) {
    super(device.name, vscode.TreeItemCollapsibleState.None);
    this.id = `device:${device.id}`;
    this.contextValue = 'device';
    this.description = device.emulator ? `${device.id} · emulator` : device.id;
    this.iconPath = new vscode.ThemeIcon(device.emulator ? 'vm' : 'device-mobile');
    this.tooltip = new vscode.MarkdownString(
      [
        `**${device.name}**`,
        '',
        `- id: \`${device.id}\``,
        device.platformType ? `- platform: \`${device.platformType}\`` : undefined,
        device.targetPlatform ? `- target: \`${device.targetPlatform}\`` : undefined,
        device.sdk ? `- sdk: ${device.sdk}` : undefined,
        `- emulator: ${device.emulator ? 'yes' : 'no'}`,
      ]
        .filter((line): line is string => line !== undefined)
        .join('\n'),
    );
    this.command = {
      command: 'flutterOhos.run.device',
      title: 'Run',
      arguments: [this],
    };
  }
}

export class DeviceInfoNode extends vscode.TreeItem {
  readonly kind = 'info';
  constructor(label: string, icon = 'info', command?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'info';
    this.iconPath = new vscode.ThemeIcon(icon);
    if (command) {
      this.command = { command, title: label };
    }
  }
}

export class DevicesTreeProvider implements vscode.TreeDataProvider<DeviceTreeNode> {
  private readonly changed = new vscode.EventEmitter<DeviceTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this.changed.event;

  constructor(private readonly controller: Controller) {
    controller.onDidChangeDevices(() => this.changed.fire());
    controller.onDidChangeSelection(() => this.changed.fire());
  }

  /** Re-render existing nodes (e.g. after a locale change). */
  refresh(): void {
    this.changed.fire();
  }

  getTreeItem(element: DeviceTreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DeviceTreeNode): DeviceTreeNode[] {
    if (!element) {
      const groups = this.controller.groupDevices();
      if (groups.length === 0) {
        const error = this.controller.deviceError;
        if (error) {
          return [
            new DeviceInfoNode(
              t(
                'Error: {0}',
                error.length > 120 ? `${error.slice(0, 119)}…` : error,
              ),
              'error',
              'flutterOhos.showLog',
            ),
          ];
        }
        return [
          new DeviceInfoNode(t('No devices found — run Refresh'), 'refresh'),
        ];
      }
      return groups.map((group) => new DeviceGroupNode(group));
    }
    if (element instanceof DeviceGroupNode) {
      return element.group.devices.map((device) => new DeviceNode(device));
    }
    return [];
  }
}

/* ---------------------------------------------------------------- Emulators */

export type EmulatorTreeNode = EmulatorGroupNode | EmulatorNode | EmulatorInfoNode;

export class EmulatorGroupNode extends vscode.TreeItem {
  readonly kind = 'group';
  constructor(readonly group: EmulatorGroup) {
    super(
      group.label,
      group.entries.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );
    this.id = `emulator-group:${group.platform}`;
    this.contextValue = 'emulatorGroup';
    this.iconPath = new vscode.ThemeIcon(PLATFORM_ICONS[group.platform]);
    if (group.entries.length > 0) {
      this.description = `${group.entries.length}`;
    } else if (group.error) {
      this.description = group.error;
    }
  }
}

export class EmulatorNode extends vscode.TreeItem {
  readonly kind = 'emulator';
  constructor(readonly entry: EmulatorEntry) {
    super(entry.name, vscode.TreeItemCollapsibleState.None);
    this.id = `emulator:${entry.platform}:${entry.id}`;
    this.contextValue = 'emulator';
    this.description = entry.detail ?? (entry.state ? `(${entry.state})` : entry.id);
    this.iconPath = new vscode.ThemeIcon('device-mobile');
    this.tooltip = `${entry.name}\n${entry.id}`;
    this.command = {
      command: 'flutterOhos.emulator.launchItem',
      title: 'Launch',
      arguments: [this],
    };
  }
}

export class EmulatorInfoNode extends vscode.TreeItem {
  readonly kind = 'info';
  constructor(label: string, icon = 'info') {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'info';
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

export class EmulatorsTreeProvider implements vscode.TreeDataProvider<EmulatorTreeNode> {
  private readonly changed = new vscode.EventEmitter<EmulatorTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this.changed.event;

  constructor(private readonly controller: Controller) {
    controller.onDidChangeEmulators(() => this.changed.fire());
  }

  /** Re-render existing nodes (e.g. after a locale change). */
  refresh(): void {
    this.changed.fire();
  }

  getTreeItem(element: EmulatorTreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: EmulatorTreeNode): EmulatorTreeNode[] {
    if (!element) {
      return this.controller.groupEmulators().map((group) => new EmulatorGroupNode(group));
    }
    if (element instanceof EmulatorGroupNode) {
      if (element.group.entries.length === 0) {
        return [
          new EmulatorInfoNode(
            element.group.error ?? t('No emulators found'),
            element.group.error ? 'warning' : 'info',
          ),
        ];
      }
      return element.group.entries.map((entry) => new EmulatorNode(entry));
    }
    return [];
  }
}

/* ----------------------------------------------------------------- Commands */

interface CommandEntry {
  command: string;
  title: string;
  icon?: string;
}

interface CommandGroupDef {
  label: string;
  icon: string;
  entries: CommandEntry[];
}

const COMMAND_GROUPS: CommandGroupDef[] = [
  {
    label: 'Quick Start',
    icon: 'rocket',
    entries: [
      { command: 'flutterOhos.run.pick', title: 'Run: Select Device...', icon: 'play' },
      { command: 'flutterOhos.debug.pick', title: 'Debug: Select Device...', icon: 'debug-alt' },
      { command: 'flutterOhos.selectDevice', title: 'Select Target Device', icon: 'device-mobile' },
      { command: 'flutterOhos.refresh', title: 'Refresh Devices', icon: 'refresh' },
    ],
  },
  {
    label: 'Project',
    icon: 'project',
    entries: [
      { command: 'flutterOhos.pubGet', title: 'Pub: Get Dependencies', icon: 'cloud-download' },
      { command: 'flutterOhos.pubUpgrade', title: 'Pub: Upgrade Dependencies', icon: 'arrow-up' },
      { command: 'flutterOhos.pubOutdated', title: 'Pub: Outdated', icon: 'versions' },
      { command: 'flutterOhos.clean', title: 'Clean', icon: 'trash' },
      { command: 'flutterOhos.analyze', title: 'Analyze', icon: 'search' },
      { command: 'flutterOhos.test', title: 'Test', icon: 'beaker' },
      { command: 'flutterOhos.testCoverage', title: 'Test (Coverage)', icon: 'beaker' },
      { command: 'flutterOhos.format', title: 'Format', icon: 'symbol-color' },
      { command: 'flutterOhos.doctor', title: 'Doctor', icon: 'heart' },
    ],
  },
  {
    label: 'Build',
    icon: 'package',
    entries: [
      { command: 'flutterOhos.build.apk', title: 'Build: APK (Android)', icon: 'package' },
      { command: 'flutterOhos.build.appbundle', title: 'Build: App Bundle (Android)', icon: 'package' },
      { command: 'flutterOhos.build.ipa', title: 'Build: IPA (iOS)', icon: 'package' },
      { command: 'flutterOhos.build.hap', title: 'Build: HAP (HarmonyOS)', icon: 'package' },
      { command: 'flutterOhos.build.har', title: 'Build: HAR (HarmonyOS)', icon: 'package' },
      { command: 'flutterOhos.build.hsp', title: 'Build: HSP (HarmonyOS)', icon: 'package' },
    ],
  },
  {
    label: 'Emulators',
    icon: 'device-mobile',
    entries: [
      { command: 'flutterOhos.emulator.android', title: 'Launch Android AVD...', icon: 'device-mobile' },
      { command: 'flutterOhos.emulator.ios', title: 'Launch iOS Simulator...', icon: 'device-mobile' },
      { command: 'flutterOhos.emulator.harmony', title: 'Launch HarmonyOS Emulator...', icon: 'device-mobile' },
      { command: 'flutterOhos.emulator.openDeveco', title: 'Open DevEco Studio', icon: 'link-external' },
    ],
  },
  {
    label: 'Maintenance',
    icon: 'tools',
    entries: [
      { command: 'flutterOhos.buildRunner', title: 'build_runner: Build', icon: 'tools' },
      { command: 'flutterOhos.buildRunnerWatch', title: 'build_runner: Watch', icon: 'eye' },
      { command: 'flutterOhos.upgrade', title: 'Upgrade Flutter SDK', icon: 'cloud-upload' },
      { command: 'flutterOhos.showDevices', title: 'Show Devices', icon: 'device-mobile' },
      { command: 'flutterOhos.customCommand', title: 'Run Custom Flutter Command...', icon: 'terminal' },
      { command: 'flutterOhos.openSettings', title: 'Open Settings', icon: 'gear' },
    ],
  },
];

export type CommandTreeNode = CommandGroupNode | CommandNode;

export class CommandGroupNode extends vscode.TreeItem {
  constructor(readonly definition: CommandGroupDef) {
    super(t(definition.label), vscode.TreeItemCollapsibleState.Expanded);
    this.id = `command-group:${definition.label}`;
    this.contextValue = 'commandGroup';
    this.iconPath = new vscode.ThemeIcon(definition.icon);
  }
}

export class CommandNode extends vscode.TreeItem {
  constructor(readonly entry: CommandEntry) {
    super(t(entry.title), vscode.TreeItemCollapsibleState.None);
    this.id = `command:${entry.command}`;
    this.contextValue = 'command';
    this.iconPath = entry.icon ? new vscode.ThemeIcon(entry.icon) : undefined;
    this.command = { command: entry.command, title: t(entry.title) };
  }
}

export class CommandsTreeProvider implements vscode.TreeDataProvider<CommandTreeNode> {
  private readonly changed = new vscode.EventEmitter<CommandTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this.changed.event;

  /** Re-render existing nodes (e.g. after a locale change). */
  refresh(): void {
    this.changed.fire();
  }

  getTreeItem(element: CommandTreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CommandTreeNode): CommandTreeNode[] {
    if (!element) {
      return COMMAND_GROUPS.map((group) => new CommandGroupNode(group));
    }
    if (element instanceof CommandGroupNode) {
      return element.definition.entries.map((entry) => new CommandNode(entry));
    }
    return [];
  }
}
