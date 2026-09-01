/** @jest-environment node */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { main } from './lint-changed.mts';

jest.mock('node:child_process', () => ({
  spawnSync: jest.fn(),
}));

jest.mock('node:fs', () => ({
  __esModule: true,
  default: {
    existsSync: jest.fn(),
  },
}));

const spawnSyncMock = jest.mocked(spawnSync);
const existsSyncMock = jest.mocked(fs.existsSync);

describe('main', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset();
    existsSyncMock.mockReset();
    spawnSyncMock.mockImplementation((command) => {
      const stdout = command === 'git' ? 'example.ts\n' : '';

      return {
        pid: 1,
        output: [],
        stdout,
        stderr: '',
        status: 0,
        signal: null,
      };
    });
    existsSyncMock.mockReturnValue(true);
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('checks formatting before linting changed files', () => {
    main([]);

    const toolCalls = spawnSyncMock.mock.calls.filter(
      ([command]) => command === process.execPath,
    );
    const oxfmtBin = path.join(
      process.cwd(),
      'node_modules',
      'oxfmt',
      'bin',
      'oxfmt',
    );
    const eslintBin = path.join(
      process.cwd(),
      'node_modules',
      'eslint',
      'bin',
      'eslint.js',
    );

    expect(toolCalls).toStrictEqual([
      [
        process.execPath,
        [
          oxfmtBin,
          '-c',
          'oxfmt.config.mts',
          '--check',
          '--no-error-on-unmatched-pattern',
          '--',
          'example.ts',
        ],
        { stdio: 'inherit' },
      ],
      [
        process.execPath,
        [
          eslintBin,
          '--cache',
          '--cache-location',
          path.join('node_modules', '.cache', 'eslint', '.eslint-cache'),
          '-c',
          './.eslintrc.js',
          '--',
          'example.ts',
        ],
        { stdio: 'inherit' },
      ],
    ]);
  });

  it('formats and applies lint fixes to changed files', () => {
    main(['--fix']);

    const toolCalls = spawnSyncMock.mock.calls.filter(
      ([command]) => command === process.execPath,
    );

    expect(toolCalls[0][1]).not.toContain('--check');
    expect(toolCalls[1][1]).toContain('--fix');
  });
});
