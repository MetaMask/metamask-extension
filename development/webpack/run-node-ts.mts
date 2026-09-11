import { Module } from 'node:module';
import { resolve } from 'node:path';

const [entry, ...args] = process.argv.slice(2);

if (entry === undefined) {
  throw new Error('Expected a TypeScript entry file to run.');
}

process.argv = [process.execPath, entry, ...args];

const moduleWithLoad = Module as unknown as {
  _load: (request: string, parent: null, isMain: boolean) => unknown;
};

moduleWithLoad._load(resolve(entry), null, true);
