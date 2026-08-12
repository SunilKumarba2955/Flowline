export default {
  cacheDir: `${process.env.TEMP}/flowline-vitest-cache`,
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
};
