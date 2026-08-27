// App.test.js — mount-level tests for the rendered component.
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

describe('App.vue', () => {
    it('renders the header and a default 10-button touchpad', () => {
        const wrapper = mount(App);
        expect(wrapper.text()).toContain('Fun Math for Kids!');
        expect(wrapper.findAll('.touchpad-btn').length).toBe(10);
        wrapper.unmount();
    });

    it('grows the touchpad to 20 buttons when "Limit to 20" is checked', async () => {
        const wrapper = mount(App);
        const toggle = wrapper.find('input[type="checkbox"]');
        expect(wrapper.findAll('.touchpad-btn').length).toBe(10);
        await toggle.setValue(true);
        expect(wrapper.findAll('.touchpad-btn').length).toBe(20);
        await toggle.setValue(false);
        expect(wrapper.findAll('.touchpad-btn').length).toBe(10);
        wrapper.unmount();
    });

    it('fills the first empty field when a touchpad button is clicked', async () => {
        const wrapper = mount(App);
        const inputs = wrapper.findAll('.problem input');
        expect(inputs.length).toBe(3);

        // Locate the single blank field the initial problem leaves open.
        const emptyIndex = inputs.findIndex((i) => i.element.value === '');
        expect(emptyIndex).toBeGreaterThanOrEqual(0);

        const pickedButton = 1;
        await wrapper.findAll('.touchpad-btn')[pickedButton - 1].trigger('click');

        const inputsAfter = wrapper.findAll('.problem input');
        expect(inputsAfter[emptyIndex].element.value).toBe(String(pickedButton));
        wrapper.unmount();
    });
});