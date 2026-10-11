import * as vscode from 'vscode';

export interface TerminalRunOptions {
  name?: string;
  cwd?: string;
  reuse?: boolean;
  /** Clear the terminal before running. */
  clear?: boolean;
}

/**
 * Thin wrapper around the integrated terminal so every Flutter command is
 * visible, cancellable and shares a predictable terminal instance.
 */
export class TerminalManager implements vscode.Disposable {
  private readonly terminals = new Map<string, vscode.Terminal>();
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly defaultName: () => string,
    private readonly defaultReuse: () => boolean,
  ) {
    this.disposables.push(
      vscode.window.onDidCloseTerminal((closed) => {
        for (const [key, terminal] of this.terminals) {
          if (terminal === closed) {
            this.terminals.delete(key);
          }
        }
      }),
    );
  }

  run(command: string, options: TerminalRunOptions = {}): vscode.Terminal {
    const name = options.name ?? this.defaultName();
    const reuse = options.reuse ?? this.defaultReuse();

    let terminal = reuse ? this.terminals.get(name) : undefined;
    if (terminal && terminal.exitStatus !== undefined) {
      this.terminals.delete(name);
      terminal = undefined;
    }
    if (!terminal) {
      terminal = vscode.window.createTerminal({ name, cwd: options.cwd });
      this.terminals.set(name, terminal);
    }

    terminal.show(true);
    if (options.clear) {
      terminal.sendText('', false);
    }
    terminal.sendText(command, true);
    return terminal;
  }

  dispose(): void {
    for (const terminal of this.terminals.values()) {
      terminal.dispose();
    }
    this.terminals.clear();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
