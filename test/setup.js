// test/setup.js
import { beforeEach } from 'vitest';

// Mock localStorage for all tests
const localStorageMock = (() => {
    let store = {};
    
    return {
        getItem(key) {
            return store[key] || null;
        },
        setItem(key, value) {
            store[key] = value.toString();
        },
        removeItem(key) {
            delete store[key];
        },
        clear() {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});

beforeEach(() => {
    localStorage.clear();
});