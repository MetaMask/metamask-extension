// @ts-nocheck
// Debug-only webpack plugin for the determinism experiment: dumps every
// module's build hash and every chunk's provisional hashes, so builds made in
// different directories can be compared.
import { writeFileSync } from 'node:fs';

export class MmHashDump {
  apply(compiler) {
    compiler.hooks.compilation.tap('MmHashDump', (compilation) => {
      compilation.hooks.afterHash.tap('MmHashDump', () => {
        const modules = [];
        for (const module of compilation.modules) {
          modules.push({
            ident: module.identifier(),
            buildHash: module.buildInfo ? (module.buildInfo.hash ?? null) : null,
          });
        }
        const chunks = [];
        for (const chunk of compilation.chunks) {
          chunks.push({
            id: chunk.id,
            name: chunk.name,
            hash: chunk.hash,
            contentHash: chunk.contentHash,
          });
        }
        writeFileSync(
          process.env.MM_DEBUG_HASH_DUMP,
          JSON.stringify({ context: compiler.context, modules, chunks }),
        );
      });
    });
  }
}
