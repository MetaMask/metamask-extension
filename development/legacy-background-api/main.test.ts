import { Writable } from 'node:stream';
import { main } from './main';

describe('main', () => {
  it('fails when no command is given', async () => {
    const { stdout, stderr } = createStreams();

    await expect(
      main({ argv: ['node', 'legacy-background-api.ts'], stdout, stderr }),
    ).rejects.toThrow('Please specify a command.');
  });

  it('prints the help text when no command is given', async () => {
    const { stdout, stderr } = createStreams();

    await main({
      argv: ['node', 'legacy-background-api.ts'],
      stdout,
      stderr,
    }).catch(() => undefined);

    expect(stderr.getWrittenText()).toContain('Commands:');
  });

  it('runs the check command', async () => {
    const { stdout, stderr } = createStreams();

    await main({
      argv: ['node', 'legacy-background-api.ts', 'check'],
      stdout,
      stderr,
    });

    expect(stdout.getWrittenText()).toContain(
      'No changes detected in legacy background APIs, all good.',
    );
  });

  it('fails when given an unknown command', async () => {
    const { stdout, stderr } = createStreams();

    await expect(
      main({
        argv: ['node', 'legacy-background-api.ts', 'bogus'],
        stdout,
        stderr,
      }),
    ).rejects.toThrow('Unknown argument: bogus');
  });
});

function createStreams() {
  return {
    stdout: createMemoryWritable(),
    stderr: createMemoryWritable(),
  };
}

function createMemoryWritable() {
  let writtenText = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      writtenText += chunk.toString();
      callback();
    },
  });

  return Object.assign(stream, {
    getWrittenText: () => writtenText,
  });
}
