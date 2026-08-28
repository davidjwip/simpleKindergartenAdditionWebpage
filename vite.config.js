import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    // Relative base so the built site works from any subpath,
    // e.g. GitHub Pages at https://<user>.github.io/<repo>/
    base: './',
    test: {
        environment: 'happy-dom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{js,vue}'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/*.test.js',
                'src/main.js'  // bootstrap entry, not meaningfully covered in test environment
            ]
        }
    }
});