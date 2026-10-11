import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Flutter OHOS');
  }
  return channel;
}

function write(level: string, message: string): void {
  const time = new Date().toLocaleTimeString();
  getOutputChannel().appendLine(`[${time}] [${level}] ${message}`);
}

export function log(message: string): void {
  write('info', message);
}

export function logWarn(message: string): void {
  write('warn', message);
}

export function logError(message: string, error?: unknown): void {
  const detail =
    error instanceof Error
      ? error.message
      : error !== undefined && error !== null
        ? String(error)
        : '';
  write('error', detail ? `${message}: ${detail}` : message);
}

export function showLog(): void {
  getOutputChannel().show(true);
}

export function disposeLogger(): void {
  channel?.dispose();
  channel = undefined;
}
