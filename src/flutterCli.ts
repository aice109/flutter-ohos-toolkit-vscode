import { execFile } from 'child_process';
import { extractJson } from './util';

export interface FlutterDevice {
  id: string;
  name: string;
  platformType?: string;
  targetPlatform?: string;
  emulator?: boolean;
  category?: string;
  sdk?: string;
  isSupported?: boolean;
  ephemeral?: boolean;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
  error?: Error;
}

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
}

const MAX_BUFFER = 32 * 1024 * 1024;

/**
 * Run a process and capture stdout/stderr. Errors (non-zero exit codes) are
 * resolved rather than rejected so callers can inspect partial output.
 */
export function execCapture(
  file: string,
  args: string[],
  options: ExecOptions = {},
): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile(
      file,
      args,
      {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        timeout: options.timeout,
        maxBuffer: MAX_BUFFER,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        const code = typeof (error as NodeJS.ErrnoException | null)?.code === 'number'
          ? ((error as unknown as { code: number }).code)
          : error
            ? 1
            : 0;
        resolve({
          stdout: stdout?.toString() ?? '',
          stderr: stderr?.toString() ?? '',
          code,
          error: error ?? undefined,
        });
      },
    );
  });
}

export interface DeviceQueryOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Include devices that Flutter reports as unsupported. */
  includeUnsupported?: boolean;
}

/** Run `flutter devices --machine` and parse the JSON payload. */
export async function listFlutterDevices(
  flutterPath: string,
  options: DeviceQueryOptions = {},
): Promise<FlutterDevice[]> {
  const result = await execCapture(flutterPath, ['devices', '--machine'], {
    cwd: options.cwd,
    env: options.env,
  });
  if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
    throw new Error(
      `Flutter executable not found ("${flutterPath}"). Set "flutterOhos.flutterPath" to its full path.`,
    );
  }
  const parsed = extractJson<FlutterDevice[]>(result.stdout);
  if (!parsed) {
    const detail = result.stderr || result.stdout || result.error?.message || 'unknown error';
    throw new Error(`Unable to query Flutter devices: ${detail.trim()}`);
  }
  return options.includeUnsupported ? parsed : parsed.filter((d) => d.isSupported !== false);
}
