import eslint from 'eslint';
import fs from 'fs';
import prettier from 'prettier';
import { createRequire } from 'node:module';
import path from 'path';

export const require = createRequire(import.meta.url);

const importRegex =
  /(?<=(?:[\s\n;])|^)(?:import[\s\n]*((?:(?<=[\s\n])type)?)(?=[\n\s\*\{])[\s\n]*)((?:(?:[_\$\w][_\$\w0-9]*)(?:[\s\n]+(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*)))?(?=(?:[\n\s]*,[\n\s]*[\{\*])|(?:[\n\s]+from)))?)[\s\n,]*((?:\*[\n\s]*(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*))(?=[\n\s]+from))?)[\s\n,]*((?:\{[n\s]*(?:(?:[_\$\w][_\$\w0-9]*)(?:[\s\n]+(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*)))?[\s\n]*,?[\s\n]*)*\}(?=[\n\s]*from))?)(?:[\s\n]*((?:from)?))[\s\n]*(?:["']([^"']*)(["']))[\s\n]*?;?;/;

export const outputFiles = new Map([
  ['.ts', 'merged-ts.ts'],
  ['.js', 'merged-js.js'],
]);

/**
 * Runs prettier and eslint on the content and saves it to the given file
 *
 * @param {string} content
 * @param {string} relativeFilePath
 */
export async function prettify(content, relativeFilePath) {
  // run prettier:fix on content, then run eslint:fix on it
  const prettierOptions = await prettier.resolveConfig(process.cwd());
  content = prettier.format(content, {
    ...prettierOptions,
    parser: path.extname(relativeFilePath).startsWith('.ts') ? 'typescript' : 'babel',
  });

  // run eslint with fix option on content
  /**
   * @type {typeof import("eslint").ESLint}
   */
  const ESLint = await eslint.loadESLint();
  const linter = new ESLint({ fix: true, useEslintrc: true });
  const results = await linter.lintText(content, {
    filePath: relativeFilePath,
  });
  return results[0].output ?? content;
}

/**
 * @typedef Imports
 * @type {Map<string, {value: Set<string>, relative: boolean}>}
 */

/**
 * Sorts imports alphabetically by key
 * @param {Imports} importsMap
 * @returns {Imports}
 */
export function sortImports(importsMap) {
  const sorted = new Map(
    [...importsMap.entries()].sort((a, b) => {
      // all relative imports should be after non-relative
      if (a[1].relative && !b[1].relative) {
        return 1;
      } else if (!a[1].relative && b[1].relative) {
        return -1;
      }
      // now just sort alphabetically
      return a[0].localeCompare(b[0]);
    }),
  );
  return sorted;
}

/**
 *
 * @param {string} importCode
 * @param {string} sourcePath
 * @returns {string}
 */
export function dedupeImports(importCode, sourcePath) {
  // Regular expression to match import statements
  const importsMap = sortImports(getAllImports(sourcePath, importCode));

  // Rebuild the file with deduplicated imports
  let deduplicatedImports = '';
  importsMap.forEach(({ value, relative }, importPath) => {
    let def;
    const specifiers = new Set();
    value.forEach((value2) => {
      const parsed = parseImport(value2);
      if (parsed.specifiers.length) {
        parsed.specifiers.forEach((specifier) => {
          specifiers.add(specifier);
        });
      }
      if (parsed.def) {
        if (def && def !== parsed.def) {
          throw new Error(
            `Multiple definitions for ${importPath} in file ${sourcePath}: ${def} and ${parsed.def}`,
          );
        }
        def = parsed.def;
      }
    });
    let relativePath = relative
      ? path.relative(path.dirname(sourcePath), importPath)
      : importPath;
    if (relative && !relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    if (relative) {
      // remove the extension from the import path
      relativePath = relativePath.replace(/\.[tj]s$/, '');
    }
    if (specifiers.size && def) {
      deduplicatedImports += `import ${def}, { ${[...specifiers].join(
        ', ',
      )} } from '${relativePath}';\n`;
    } else if (specifiers.size) {
      deduplicatedImports += `import { ${[...specifiers].join(
        ', ',
      )} } from '${relativePath}';\n`;
    } else {
      deduplicatedImports += `import ${def} from '${relativePath}';\n`;
    }
  });

  return deduplicatedImports.trim();
}

/**
 *
 * @param {string} content
 * @returns {{result: [string, string, string, string] & { index: number }, specifiers: null | string[], join: (file: string) => string}}
 */
export function parseImport(content) {
  const result = importRegex.exec(content);
  const def = result ? result[2] : null;
  const specifiers = result
    ? result[4]
        .replace(/[{}]/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter((a) => Boolean(a))
    : null;
  return {
    result,
    def,
    specifiers,
    join: (file) => {
      return `import ${result[4]} ${result[5]} ${result[7]}${
        file || result[6]
      }${result[7]}`;
    },
  };
}

/**
 *
 * @param {string} dir
 * @returns {string}
 * @throws {Error}
 */
export function resolveFile(dir){
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx', '.d.ts'];
  let error;
  for (const ext of extensions) {
    try {
      return require.resolve(dir + ext);
    } catch (e) {
      error = e
    }
  }
  const allowedFailures = [
    // a bad import snuck into https://github.com/MetaMask/metamask-extension/pull/26172/files
    "ui/components/ui/token-currency-display/token-currency-display.types",
    // there's a file with an invalid `import` commented out, but my code still detects it, so we need to ignore it
    "../../shared/modules/hexstring-utils"
  ];
  if (allowedFailures.includes(path.relative(process.cwd(), dir))){
    return dir;
  }
  throw error;
}

/**
 *
 * @param {string} file
 * @param {string} content
 * @returns {Imports}
 */
export function getAllImports(file, content) {
  let tempContent = content;
  let imports = new Map();
  while (true) {
    const m = parseImport(tempContent).result;
    if (!m) {
      return imports;
    }
    tempContent = tempContent.slice(m.index + m[0].length);

    const importedFile = m[6];
    const relative = importedFile.startsWith('.');

    let absolutePath;
    if (relative) {
      // resolve the import file path to an absolute path
      const dir = path.resolve(path.dirname(file), importedFile);
      absolutePath = resolveFile(dir);
    } else {
      // it is a node or npm import
      absolutePath = importedFile;
    }
    if (imports.has(absolutePath)) {
      const g = imports.get(absolutePath);
      g.value.add(m[0]);
    } else {
      imports.set(absolutePath, { value: new Set([m[0]]), relative });
    }
  }
}

/**
 * Checks if the file contains any relative imports
 *
 * @param {string} filePath
 * @param {string} content
 * @param {boolean} checkNested
 * @returns
 */
export function containsSiblingImport(filePath, content, checkNested) {
  const dirname = path.dirname(path.resolve(filePath));
  const imports = getAllImports(filePath, content);
  for (const [absolutePath, { relative }] of imports) {
    // check if the file at absolutePath is in the same directory as the file at filePath
    if (relative && path.dirname(absolutePath) === dirname) {
      if (checkNested) {
        // check if _this_ file also includes a relative import
        const nestedContent = fs.readFileSync(absolutePath, 'utf-8');
        // pass false for `checkNested` so we don't risk infinitely recursing
        if (containsSiblingImport(absolutePath, nestedContent, false)) {
          return true;
        }
      } else {
        return true;
      }
    }
  }
  return false;
}

/**
 * Merge files function
 *
 * @param {string} extension
 * @param {string} folderPath
 * @returns {Promise<{files: string[], content: string}>}
 */
export async function mergeFiles(extension, folderPath) {
  const oppositeExtension = extension === '.ts' ? '.js' : '.ts';
  const files = fs.readdirSync(folderPath);
  let mergedContent = '';

  /**
   * List of files that might be merged
   * @type {string[]}
   */
  const candidateFiles = [];
  /**
   * List of files that were merged
   * @type {string[]}
   */
  const mergedFiles = [];

  // First pass: determine which files should be merged. If it has an import
  // relative to the the same directory we mark it as a candidate, and and of
  // those relative imports also have an import to the same directory, it
  // is a merge candidate.
  files.forEach((file) => {
    if (
      (file.endsWith('.ts') || file.endsWith('.js')) &&
      !file.includes('.test.')
    ) {
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (containsSiblingImport(filePath, content, true)) {
        const absolutePath = path.resolve(folderPath, file);
        candidateFiles.push(absolutePath); // Keep track of files to merge
      }
    }
  });

  /**
   * @type {string[]}
   */
  const finalImports = [];

  // Second pass: process the files and remove imports from the files that are part of the merge
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);

    if (file.endsWith(extension) && !file.includes('.test.')) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Only process files that have relative imports and are in the merge list
      const absolutePath = path.resolve(folderPath, file);
      if (candidateFiles.includes(absolutePath)) {
        // Remove only directly relative imports for files that are in the merge list
        let cleanedContent = content;
        const imports = getAllImports(absolutePath, content);
        // if any of the keys of imports are in filesToMerge, remove the import's value for that key
        // from the `content` string
        const importsKeys = Array.from(imports.keys());
        for (let i = 0; i < importsKeys.length; i++) {
          const importKey = importsKeys[i];
          const importValues = imports.get(importKey);
          if (candidateFiles.includes(importKey)) {
            // we're merging it, so now we need to mark this file as imported
            mergedFiles.push(importKey);

            // if the importKey is in filesToMerge, but the extension doesn't match this file, we'll need to import it
            // from the opposite extension's merged file (if js, merged-ts.ts, if ts, merged-js.js);
            const isOppositeExtension = extension !== path.parse(importKey).ext;
            if (isOppositeExtension) {
              // change the import in `cleanedContent` to import from the opposite extension's merged file
              importValues.value.forEach((importValue) => {
                const parsedImport = parseImport(importValue);
                const otherMergedFile = outputFiles.get(oppositeExtension);
                cleanedContent = cleanedContent.replace(importValue, '');
                finalImports.push(parsedImport.join(`./${otherMergedFile}`));
              });
            } else {
              // just delete it, since it's inlined
              importValues.value.forEach((importValue) => {
                cleanedContent = cleanedContent.replace(importValue, '');
              });
            }
          } else {
            importValues.value.forEach((importValue) => {
              cleanedContent = cleanedContent.replace(importValue, '');
              finalImports.push(importValue);
            });
          }
        }

        // todo: remove imports we don't want to keep.

        // Append file content to the merged result
        mergedContent += `\n\n// #region --- Merged from ${file} ---\n\n`;
        mergedContent += cleanedContent;
        mergedContent += `\n\n// #endregion --- Merged from ${file} ---\n\n`;
      }
    }
  });

  const finalPath = path.resolve(folderPath, outputFiles.get(extension));
  mergedContent =
    dedupeImports(finalImports.join(';\n'), finalPath) + '\n' + mergedContent;

  const results = await prettify(mergedContent, path.join(folderPath, outputFiles.get(extension)));

  // if there is nothing for eslint to fix `output` ends up being `undefined`, so just return the original `mergedContent`
  return {
    files: mergedFiles,
    content: results,
  };
}