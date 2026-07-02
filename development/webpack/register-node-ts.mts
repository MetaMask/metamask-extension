import { existsSync, readFileSync } from 'node:fs';
import { Module } from 'node:module';
import { resolve } from 'node:path';
import ts from 'typescript';

type NodeModuleWithCompile = NodeModule & {
  _compile: (source: string, filename: string) => void;
};

type ResolveFilename = (
  request: string,
  parent?: NodeModule,
  isMain?: boolean,
  options?: object,
) => string;

type ExtensionHandler = (
  module: NodeModuleWithCompile,
  filename: string,
) => void;

const moduleWithResolver = Module as unknown as {
  _extensions: Record<string, ExtensionHandler>;
  _resolveFilename: ResolveFilename;
};
const originalResolveFilename = moduleWithResolver._resolveFilename;

moduleWithResolver._resolveFilename = function resolveFilename(
  request,
  parent,
  isMain,
  options,
) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (error) {
    if (!isExtensionlessLocalRequest(request)) {
      throw error;
    }

    for (const candidate of getTypeScriptCandidates(request, parent)) {
      try {
        return originalResolveFilename.call(
          this,
          candidate,
          parent,
          isMain,
          options,
        );
      } catch {
        // Try the next TypeScript resolution fallback.
      }
    }

    throw error;
  }
} as ResolveFilename;

function isExtensionlessLocalRequest(request: string) {
  return (
    (request.startsWith('./') ||
      request.startsWith('../') ||
      request.startsWith('/')) &&
    !/\.(?:c|m)?(?:j|t)s(?:on)?$/u.test(request)
  );
}

function getTypeScriptCandidates(request: string, parent?: NodeModule) {
  const base =
    parent?.filename === undefined
      ? request
      : resolve(parent.filename, '..', request);

  return [`${base}.ts`, resolve(base, 'index.ts')].filter((candidate) =>
    existsSync(candidate),
  );
}

const transpileOptions = {
  compilerOptions: {
    esModuleInterop: true,
    inlineSourceMap: true,
    inlineSources: true,
    isolatedModules: true,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    resolveJsonModule: true,
    target: ts.ScriptTarget.ES2022,
  },
} satisfies ts.TranspileOptions;

const loadTypeScript: ExtensionHandler = (module, filename) => {
  const source = readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    ...transpileOptions,
    fileName: filename,
  });

  module._compile(outputText, filename);
};

moduleWithResolver._extensions['.ts'] = loadTypeScript;
moduleWithResolver._extensions['.mts'] = loadTypeScript;
