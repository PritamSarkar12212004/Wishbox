import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    test: {
        environment: 'node',
        // `.tsx` is included because component markup (the loading skeletons) is
        // tested by rendering it to a string, not by a DOM runner.
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
