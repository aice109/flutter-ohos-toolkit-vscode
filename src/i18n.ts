import * as fs from 'fs';
import * as vscode from 'vscode';

export type LocaleSetting = 'auto' | 'en' | 'zh-cn';

type Bundle = Record<string, string>;

let bundleEn: Bundle = {};
let bundleZh: Bundle = {};

function readBundle(extensionUri: vscode.Uri, name: string): Bundle {
  try {
    const file = vscode.Uri.joinPath(extensionUri, 'l10n', name).fsPath;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Bundle;
  } catch {
    return {};
  }
}

/** Load the runtime translation bundles once at activation. */
export function initI18n(context: vscode.ExtensionContext): void {
  bundleEn = readBundle(context.extensionUri, 'bundle.l10n.json');
  bundleZh = readBundle(context.extensionUri, 'bundle.l10n.zh-cn.json');
}

export function getLocaleSetting(): LocaleSetting {
  const value = vscode.workspace.getConfiguration('flutterOhos').get<string>('locale', 'auto');
  return value === 'en' || value === 'zh-cn' ? value : 'auto';
}

function format(template: string, args: Array<string | number>): string {
  return template.replace(/\{(\d+)\}/g, (match, index: string) => {
    const value = args[Number(index)];
    return value === undefined ? match : String(value);
  });
}

/**
 * Translate a message. In `auto` mode this follows the VS Code display language
 * via `vscode.l10n`; otherwise the forced locale bundle is used, letting users
 * switch the extension UI without changing the editor language.
 */
export function t(message: string, ...args: Array<string | number>): string {
  const locale = getLocaleSetting();
  if (locale === 'auto') {
    return vscode.l10n.t(message, ...args);
  }
  const bundle = locale === 'zh-cn' ? bundleZh : bundleEn;
  const template = bundle[message] ?? bundleEn[message] ?? message;
  return format(template, args);
}
