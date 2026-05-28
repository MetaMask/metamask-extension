import path from 'node:path';
import webpack from 'webpack';
import type { Compiler, WebpackPluginInstance } from 'webpack';

// __dirname is available in the CJS-compiled output
// (this file is compiled via webpack:tsc → development/.webpack/)
const MOCK_PATH = path.resolve(
  __dirname,
  '../../../../../app/scripts/speculos-webhid-mock',
);

const NAME = 'SpeculosPlugin';
const { RawSource } = webpack.sources;

const SPECULOS_ENTRY = 'scripts/speculos-webhid-mock';
const INJECTION_ANCHORS = [
  '<script src="bootstrap.',
  '<script src="runtime.',
];

type WebpackEntryObject = Record<
  string,
  { import: string[]; chunkLoading: boolean }
>;

export class SpeculosPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler): void {
    compiler.hooks.entryOption.tap(NAME, (_context, entries) => {
      if (typeof entries !== 'object' || Array.isArray(entries)) {
        return;
      }
      (entries as WebpackEntryObject)[SPECULOS_ENTRY] = {
        import: [MOCK_PATH],
        chunkLoading: false,
      };
    });

    compiler.hooks.emit.tap(NAME, (compilation) => {
      const entry = compilation.entrypoints.get(SPECULOS_ENTRY);
      if (!entry) {
        return;
      }

      const files = entry.getFiles();
      // The speculos entry gets chunked with a shared runtime — find the
      // actual mock file, not the runtime chunk
      const mockJsFile = files.find((f) => f.includes('speculos-webhid-mock'));
      if (!mockJsFile) {
        return;
      }

      // HTML assets are at chrome/home.html, chrome/popup.html etc.
      // The mock JS is at chrome/scripts/speculos-webhid-mock.*.js
      // The <script src> must be relative to the HTML file, so strip
      // the "chrome/" prefix to get scripts/speculos-webhid-mock.*.js
      const htmlRelativeMockPath = mockJsFile.replace(/^chrome\//u, '');

      let patchedCount = 0;

      for (const assetName of Object.keys(compilation.assets)) {
        if (!assetName.endsWith('.html')) {
          continue;
        }

        const source = compilation.assets[assetName];
        const html = source.source().toString();

        if (html.includes('speculos-webhid-mock')) {
          continue;
        }

        let patched = false;
        let patchedHtml = html;

        for (const anchor of INJECTION_ANCHORS) {
          const idx = patchedHtml.indexOf(anchor);
          if (idx !== -1) {
            const scriptTag = `<script src="${htmlRelativeMockPath}"></script>\n`;
            patchedHtml =
              patchedHtml.substring(0, idx) +
              scriptTag +
              patchedHtml.substring(idx);
            patched = true;
            break;
          }
        }

        if (!patched) {
          continue;
        }

        // Replace the source in the assets map — this is what webpack
        // uses to write to disk during the emit phase
        compilation.assets[assetName] = new RawSource(patchedHtml);
        patchedCount += 1;
      }

      if (patchedCount > 0) {
        console.log(
          `[SpeculosPlugin] Injected WebHID mock into ${patchedCount} HTML files`,
        );
      }
    });
  }
}
