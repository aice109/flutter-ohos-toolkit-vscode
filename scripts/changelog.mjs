// Prepends a CHANGELOG entry for the current package.json version.
//
// Runs from the npm "version" lifecycle hook, i.e. after `npm version` has
// already bumped package.json but *before* it commits and tags. At that point
// `git describe --tags` still points at the previous release, so the commits
// listed are exactly the ones shipped in this release.
//
// The caller stages CHANGELOG.md so it lands in the same release commit.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const changelogPath = 'CHANGELOG.md';
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

if (!existsSync(changelogPath)) {
  console.log(`[changelog] ${changelogPath} not found, skipping.`);
  process.exit(0);
}

let changelog = readFileSync(changelogPath, 'utf8');

// Idempotent: never add the same version twice (e.g. a retried release).
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
if (new RegExp(`^##\\s+${escaped}\\b`, 'm').test(changelog)) {
  console.log(`[changelog] ${version} already documented, skipping.`);
  process.exit(0);
}

// Previous release tag reachable from HEAD (the new tag does not exist yet).
let previousTag = '';
try {
  previousTag = run('git describe --tags --abbrev=0');
} catch {
  previousTag = '';
}

const range = previousTag ? `${previousTag}..HEAD` : 'HEAD';
let subjects = [];
try {
  subjects = run(`git log --no-merges --pretty=format:%s ${range}`)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    // Drop previous "chore: release x.y.z" commits if the range ever includes one.
    .filter((line) => !/^chore: release\b/i.test(line));
} catch (error) {
  console.warn(`[changelog] could not read git history: ${error.message}`);
}

const bullets = subjects.length
  ? subjects.map((subject) => `- ${subject}`).join('\n')
  : '- Maintenance release.';

const entry = `## ${version}\n\n${bullets}\n`;

// Insert directly below the top-level "# Changelog" heading.
const header = changelog.match(/^#\s+.*\n+/);
if (header) {
  const rest = changelog.slice(header[0].length).replace(/^\n+/, '');
  changelog = `${header[0].replace(/\n+$/, '\n\n')}${entry}\n${rest}`;
} else {
  changelog = `# Changelog\n\n${entry}\n${changelog}`;
}

writeFileSync(changelogPath, changelog);
console.log(`[changelog] added ${version} with ${subjects.length} change(s).`);
