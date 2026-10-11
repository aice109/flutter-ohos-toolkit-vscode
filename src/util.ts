/**
 * Small, dependency-free helpers shared across the extension.
 */

/** Split a command line string into arguments, honouring single/double quotes. */
export function splitArgs(input: string | undefined | null): string[] {
  if (!input) {
    return [];
  }
  const args: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    args.push(match[1] ?? match[2] ?? match[3] ?? '');
  }
  return args;
}

/** Quote an argument so it survives being placed in a shell command string. */
export function quoteArg(arg: string): string {
  if (arg.length > 0 && !/[\s"']/.test(arg)) {
    return arg;
  }
  if (process.platform === 'win32') {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

/** Join an executable and its arguments into a safe shell command string. */
export function buildCommand(file: string, args: string[]): string {
  return [quoteArg(file), ...args.map(quoteArg)].join(' ');
}

/**
 * Extract the first JSON array/object found in a blob of text and parse it.
 * Flutter commands often print progress lines before the real payload.
 */
export function extractJson<T>(text: string): T | undefined {
  const start = text.search(/[[{]/);
  if (start < 0) {
    return undefined;
  }
  const open = text[start];
  const close = open === '[' ? ']' : '}';
  const end = text.lastIndexOf(close);
  if (end <= start) {
    return undefined;
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return undefined;
  }
}

/** Collapse whitespace and trim, useful for one-line tool output. */
export function oneLine(text: string, maxLength = 300): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > maxLength ? `${flat.slice(0, maxLength - 1)}…` : flat;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
