// The branch-flow rule is a shell script so it can be exercised here; the workflow only calls it.
// Runs in the suite's default (happy-dom) environment: test/setup.js installs a window shim there.
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = resolve(root, 'scripts/check-branch-flow.sh');
const REPO = 'davidjwip/simpleKindergartenAdditionWebpage';

function run(env) {
    return spawnSync('bash', [SCRIPT], {
        env: { PATH: process.env.PATH, THIS_REPO: REPO, ...env },
        encoding: 'utf8',
    });
}

describe('check-branch-flow.sh', () => {
    it('allows any branch into UAT, because only main has a source rule', () => {
        const r = run({ BASE: 'UAT', HEAD: 'feat/whatever', HEAD_REPO: REPO });
        expect(r.status).toBe(0);
        expect(r.stdout).toContain('flow OK');
    });

    it('allows the release from UAT into main', () => {
        const r = run({ BASE: 'main', HEAD: 'UAT', HEAD_REPO: REPO });
        expect(r.status).toBe(0);
        expect(r.stdout).toContain('UAT -> main');
    });

    it('refuses a feature branch into main', () => {
        const r = run({ BASE: 'main', HEAD: 'feat/whatever', HEAD_REPO: REPO });
        expect(r.status).toBe(1);
        expect(r.stdout).toContain('main only takes merges from UAT');
    });

    it('refuses a fork branch that is merely named UAT', () => {
        const r = run({ BASE: 'main', HEAD: 'UAT', HEAD_REPO: 'someone-else/simpleKindergartenAdditionWebpage' });
        expect(r.status).toBe(1);
        expect(r.stdout).toContain('not a fork');
    });

    it('refuses to guess when BASE or HEAD is missing', () => {
        expect(run({ BASE: 'main' }).status).toBe(2);
        expect(run({ HEAD: 'UAT' }).status).toBe(2);
    });
});
