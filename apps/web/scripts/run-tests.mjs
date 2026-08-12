import path from 'node:path';
import os from 'node:os';
import { startVitest } from 'vitest/node';

const filters = process.argv.slice(2);

await startVitest('test', filters, {
  root: process.cwd(),
  run: true,
  config: false,
  environment: 'jsdom',
  setupFiles: [path.resolve('src/test/setup.ts')],
}, {
  cacheDir: path.join(os.tmpdir(), 'flowline-vitest-cache'),
});
