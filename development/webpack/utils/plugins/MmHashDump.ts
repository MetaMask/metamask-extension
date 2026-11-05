// @ts-nocheck
// Debug-only webpack plugin: per-module hash inputs with content and
// source-map field digests, so builds can be compared field by field.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const sha = (s) =>
  s == null
    ? null
    : createHash('sha256')
        .update(typeof s === 'string' ? s : JSON.stringify(s))
        .digest('hex')
        .slice(0, 16);

class MmHashDump {
  apply(compiler) {
    compiler.hooks.compilation.tap('MmHashDump', (compilation) => {
      compilation.hooks.afterHash.tap('MmHashDump', () => {
        const { chunkGraph } = compilation;
        const modules = [];
        for (const module of compilation.modules) {
          let runtime;
          for (const chunk of chunkGraph.getModuleChunksIterable(module)) {
            runtime = chunk.runtime;
            break;
          }
          let moduleHash = null;
          try {
            moduleHash = chunkGraph.getModuleHash(module, runtime);
          } catch (e) {
            moduleHash = `ERR:${e.message}`;
          }
          let sourceCtor = null;
          let contentSha = null;
          let contentLength = null;
          let mapSources = null;
          let mapFieldShas = null;
          let mapFieldLengths = null;
          try {
            const src = module._source;
            if (src) {
              sourceCtor = src.constructor.name;
              const content = src.source().toString();
              contentSha = sha(content);
              contentLength = content.length;
              if (typeof src.map === 'function') {
                const m = src.map();
                if (m) {
                  mapSources = m.sources;
                  mapFieldShas = {};
                  mapFieldLengths = {};
                  for (const k of Object.keys(m)) {
                    mapFieldShas[k] = sha(m[k]);
                    mapFieldLengths[k] = JSON.stringify(m[k]).length;
                  }
                }
              }
            }
          } catch (e) {
            contentSha = `ERR:${e.message}`;
          }
          modules.push({
            id: chunkGraph.getModuleId(module),
            ctor: module.constructor.name,
            type: module.type,
            ident: module.identifier(),
            buildHash: module.buildInfo ? module.buildInfo.hash : null,
            moduleHash,
            sourceCtor,
            contentSha,
            contentLength,
            mapSources,
            mapFieldShas,
            mapFieldLengths,
            buildMeta: module.buildMeta ? JSON.stringify(module.buildMeta) : null,
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
        fs.writeFileSync(
          process.env.MM_DEBUG_HASH_DUMP,
          JSON.stringify({ context: compiler.context, modules, chunks }),
        );
      });
    });
  }
}

module.exports = { MmHashDump };
