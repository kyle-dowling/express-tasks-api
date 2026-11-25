import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig( {
    test: {
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
        env: loadEnv( 'test', process.cwd(), '' ),
        fileParallelism: false,
        testTimeout: 15000,
    },
} );
