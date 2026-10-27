// Negative proof for the per-file coverage gate: add an untested module,
// confirm the threshold run exits non-zero and names that file, then remove it.
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const probe = resolve(root, 'src/coverage-gate-probe.js');

writeFileSync(probe, 'export function untestedProbe() {\n    return 42;\n}\n');

try {
    const result = spawnSync('npm', ['run', 'test:coverage:threshold'], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, CI: '1', FORCE_COLOR: '0' }
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    process.stdout.write(output);

    if (result.status === 0) {
        console.error('\nNEGATIVE PROOF FAILED: coverage gate passed with an untested module.');
        process.exitCode = 1;
    } else if (!output.includes('src/coverage-gate-probe.js')) {
        console.error('\nNEGATIVE PROOF FAILED: the run failed but did not name the probe file.');
        process.exitCode = 1;
    } else {
        console.error('\nNEGATIVE PROOF PASSED: run exited non-zero and named src/coverage-gate-probe.js.');
    }
} finally {
    unlinkSync(probe);
}
