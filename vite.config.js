import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    // Relative base so the built site works from any subpath,
    // e.g. GitHub Pages at https://<user>.github.io/<repo>/
    base: './',
    test: {
        environment: 'happy-dom',
        setupFiles: ['./test/setup.js'],
        coverage: {
            provider: 'v8',
            all: true,
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{js,vue}'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/*.test.js',
                'src/main.js'  // bootstrap entry, not meaningfully covered in test environment
            ],
            thresholds: {
                perFile: true,
                statements: 90,
                branches: 85,
                functions: 100,
                lines: 90,
                'src/mathEngine.js': {
                    statements: 95,
                    branches: 90,
                    functions: 90,
                    lines: 95
                },
                'src/useMathGame.js': {
                    statements: 95,
                    branches: 90,
                    functions: 100,
                    lines: 95
                },
                'src/usePreferences.js': {
                    statements: 90,
                    branches: 85,
                    functions: 100,
                    lines: 90
                },
                'src/App.vue': {
                    statements: 95,
                    branches: 85,
                    functions: 80,
                    lines: 95
                },
                'src/useAudioFeedback.js': {
                    statements: 90,
                    branches: 85,
                    functions: 100,
                    lines: 90
                }
            }
        }
    }
});
