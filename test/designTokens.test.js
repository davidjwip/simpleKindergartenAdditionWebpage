// designTokens.test.js — the doubles frame's two accent groups.
// The colour assertions are a static pin over the stylesheet, not a render
// assertion: happy-dom does not resolve the cascade for computed colours.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import NumberFrame from '../src/components/NumberFrame.vue';

const stylesheet = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8');

function declarationsFor(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = stylesheet.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
    return match ? match[1] : '';
}

describe('doubles frame design tokens', () => {
    it('pins group A to the accent and group B to its shade', () => {
        expect(declarationsFor('.frame-cell.group-a')).toMatch(/#4ecdc4/i);
        expect(declarationsFor('.frame-cell.group-b')).toMatch(/#2f9e94/i);
    });

    it('renders the two groups on a doubles frame', () => {
        const wrapper = mount(NumberFrame, {
            props: { total: 8, filled: 8, kind: 'doubles' }
        });

        expect(wrapper.findAll('.frame-cell.group-a')).toHaveLength(4);
        expect(wrapper.findAll('.frame-cell.group-b')).toHaveLength(4);
        expect(wrapper.findAll('.frame-cell.filled')).toHaveLength(8);

        wrapper.unmount();
    });
});
