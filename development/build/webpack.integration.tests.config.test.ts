describe('development/webpack/webpack.integration.tests.config', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports a webpack config that includes tailwind + rtlcss postcss plugins', async () => {
    jest.doMock('node:module', () => ({
      createRequire: () => {
        return () => {
          return () => ({ name: 'tailwindcss' });
        };
      },
    }));

    const config = (await import('../webpack/webpack.integration.tests.config'))
      .default;

    const rules = config.module?.rules ?? [];
    expect(rules).toHaveLength(1);

    const rule = rules[0] as {
      use: (
        | string
        | {
            loader: string;
            options?: { postcssOptions?: { plugins?: unknown[] } };
          }
      )[];
    };

    const postcssLoader = rule.use.find(
      (use) => typeof use === 'object' && use.loader === 'postcss-loader',
    ) as { options?: { postcssOptions?: { plugins?: unknown[] } } } | undefined;

    const plugins =
      postcssLoader?.options?.postcssOptions?.plugins?.filter(Boolean) ?? [];

    expect(plugins).toHaveLength(2);
    expect(String(config.name)).toContain('integration test');
  });
});
