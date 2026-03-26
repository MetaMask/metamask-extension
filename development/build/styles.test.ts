describe('development/build/styles', () => {
  let pipelineCalls: unknown[][];
  let watchCallback: ((event: { path: string }) => Promise<void>) | undefined;
  let gulpSassOptions: Record<string, unknown>[];

  beforeEach(() => {
    jest.resetModules();
    pipelineCalls = [];
    watchCallback = undefined;
    gulpSassOptions = [];
  });

  it('creates style tasks that run scss build pipeline', async () => {
    const livereloadChanged = jest.fn();

    jest.doMock('pify', () => {
      return () =>
        async (...args: unknown[]) => {
          pipelineCalls.push(args);
        };
    });

    jest.doMock('gulp', () => ({
      src: jest.fn((src: string) => ({ type: 'src', src })),
      dest: jest.fn((dest: string) => ({ type: 'dest', dest })),
    }));

    jest.doMock('gulp-watch', () =>
      jest.fn(
        (_pattern: string, cb: (event: { path: string }) => Promise<void>) => {
          watchCallback = cb;
        },
      ),
    );

    jest.doMock('gulp-sourcemaps', () => ({
      init: jest.fn(() => ({ type: 'sourcemaps-init' })),
      write: jest.fn(() => ({ type: 'sourcemaps-write' })),
    }));

    jest.doMock('postcss-rtlcss', () => jest.fn(() => ({ name: 'rtlcss' })));

    jest.doMock('postcss-discard-font-face', () =>
      jest.fn((extensions: string[]) => ({ name: 'discardFonts', extensions })),
    );

    jest.doMock('gulp-postcss', () =>
      jest.fn((plugins: unknown[]) => ({ type: 'postcss', plugins })),
    );

    jest.doMock('sass-embedded', () => ({
      SassString: class SassString {
        value: string;

        constructor(value: string) {
          this.value = value;
        }
      },
    }));

    jest.doMock('gulp-sass', () =>
      jest.fn(() => {
        const fn = jest.fn((options: Record<string, unknown>) => {
          gulpSassOptions.push(options);
          return { on: jest.fn().mockReturnThis() };
        });
        Object.assign(fn, { logError: jest.fn() });
        return fn;
      }),
    );

    const tailwindPostcss = jest.fn(() => ({ name: 'tailwindcss' }));
    jest.doMock('../lib/load-tailwind-postcss.cjs', () => tailwindPostcss);

    jest.doMock('./task', () => ({
      createTask: (taskName: string, taskFn: () => Promise<void>) =>
        Object.assign(taskFn, { taskName }),
    }));
    jest.doMock('./constants', () => ({
      TASKS: { STYLES_PROD: 'styles:prod', STYLES_DEV: 'styles:dev' },
    }));

    const sourcemaps = await import('gulp-sourcemaps');

    const createStyleTasks = (
      (await import('./styles')) as unknown as {
        default: (options: {
          livereload: { changed: (path: string) => void };
        }) => {
          prod: { taskName: string } & (() => Promise<void>);
          dev: { taskName: string } & (() => Promise<void>);
        };
      }
    ).default;

    const tasks = createStyleTasks({
      livereload: { changed: livereloadChanged },
    });

    await tasks.prod();
    await tasks.dev();

    expect(pipelineCalls).toHaveLength(2);
    expect(gulpSassOptions).toHaveLength(2);

    const sassOptions = gulpSassOptions[0] as unknown as {
      includePaths?: string[];
      functions?: Record<string, () => unknown>;
    };
    expect(sassOptions).toMatchObject({
      includePaths: ['ui/css/', 'node_modules/'],
    });
    expect(typeof sassOptions.functions).toBe('object');
    const fontPathValue = (
      sassOptions.functions?.['-mm-fa-path()']?.() as {
        value?: string;
      }
    )?.value;
    expect(fontPathValue).toBe('./fonts/fontawesome');
    expect(tailwindPostcss).toHaveBeenCalled();
    expect(sourcemaps.init).toHaveBeenCalled();
    expect(sourcemaps.write).toHaveBeenCalled();

    expect(watchCallback).toBeDefined();
    await watchCallback?.({ path: 'ui/css/example.scss' });

    expect(pipelineCalls).toHaveLength(3);
    expect(livereloadChanged).toHaveBeenCalledWith('ui/css/example.scss');
  });
});
