import eslint from "eslint";
import fs from "fs";
import prettier from "prettier";
import path from "path";
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const folderPath = "./ui/selectors/";

const importRegex = /(?<=(?:[\s\n;])|^)(?:import[\s\n]*((?:(?<=[\s\n])type)?)(?=[\n\s\*\{])[\s\n]*)((?:(?:[_\$\w][_\$\w0-9]*)(?:[\s\n]+(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*)))?(?=(?:[\n\s]*,[\n\s]*[\{\*])|(?:[\n\s]+from)))?)[\s\n,]*((?:\*[\n\s]*(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*))(?=[\n\s]+from))?)[\s\n,]*((?:\{[n\s]*(?:(?:[_\$\w][_\$\w0-9]*)(?:[\s\n]+(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*)))?[\s\n]*,?[\s\n]*)*\}(?=[\n\s]*from))?)(?:[\s\n]*((?:from)?))[\s\n]*(?:["']([^"']*)(["']))[\s\n]*?;?;/;

const outputFiles = new Map([[".ts", "merged-ts.ts"],[".js", "merged-js.js"]]);

/**
 * @typedef Imports
 * @type {Map<string, {value: Set<string>, relative: boolean}>}
 */

/**
 * Sorts imports alphabetically by key
 * @param {Imports} importsMap
 * @returns {Imports}
 */
function sortImports(importsMap){
  const sorted = new Map([...importsMap.entries()].sort(
    (a, b) => {
      // all relative imports should be after non-relative
      if (a[1].relative && !b[1].relative) {
        return 1;
      } else if (!a[1].relative && b[1].relative) {
        return -1;
      }
      // now just sort alphabetically
      return a[0].localeCompare(b[0]);
    }
  ));
  return sorted;
}

function dedupeImports(importCode, sourcePath) {
  // Regular expression to match import statements
  const importsMap = sortImports(getAllImports(sourcePath, importCode));

  // Rebuild the file with deduplicated imports
  let deduplicatedImports = '';
  importsMap.forEach(({value, relative}, importPath) => {
    let def;
    const specifiers = new Set();
    value.forEach((value2) => {
      const parsed = parseImport(value2);
      if (parsed.specifiers.length){
        parsed.specifiers.forEach((specifier) => {
          specifiers.add(specifier);
        });
      }
      if (parsed.def) {
        if (def && def !== parsed.def) {
          throw new Error(`Multiple definitions for ${importPath} in file ${sourcePath}: ${def} and ${parsed.def}`);
        }
        def = parsed.def;
      }
    });
    let relativePath = relative ? path.relative(path.dirname(sourcePath), importPath) : importPath;
    if (relative && !relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    if(relative){
      // remove the extension from the import path
      relativePath = relativePath.replace(/\.[tj]s$/, '');
    }
    if (specifiers.size && def) {
      deduplicatedImports += `import ${def}, { ${[...specifiers].join(', ')} } from '${relativePath}';\n`;
    } else if (specifiers.size) {
      deduplicatedImports += `import { ${[...specifiers].join(', ')} } from '${relativePath}';\n`;
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
function parseImport(content) {
  const result = importRegex.exec(content);
  const def = result ? result[2] : null;
  const specifiers = result ? result[4].replace(/[{}]/g,"").split(',').map(s => s.trim()).filter(a => Boolean(a)) : null;
  return {
    result,
    def,
    specifiers,
    join: (file) => {
      return `import ${result[4]} ${result[5]} ${result[7]}${file||result[6]}${result[7]}`;
    }
  };
}

/**
 *
 * @param {string} file
 * @param {string} content
 * @returns {Imports}
 */
function getAllImports(file, content) {
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
      try {
        absolutePath = require.resolve(dir);
      } catch(e){
        try {
        absolutePath = require.resolve(dir + '.ts');
        } catch(e) {
          absolutePath = require.resolve(path.join(dir, 'index.ts'));
        }
      }
    } else {
      // it is a node or npm import
      absolutePath = importedFile;
    }
    if (imports.has(absolutePath)) {
      const g = imports.get(absolutePath);
      g.value.add(m[0]);
    } else {
      imports.set(absolutePath, {value: new Set([m[0]]), relative});
    }

  }
}

/**
 * Checks if the file contains any relative imports
 *
 * @param {string} filePath
 * @param {string} content
 * @returns
 */
function containsSiblingImport(filePath, content) {
  const dirname = path.dirname(path.resolve(filePath));
  const imports = getAllImports(filePath, content);
  for (const [absolutePath, {relative}] of imports) {
    // check if the file at absolutePath is in the same directory as the file at filePath
    if (relative && path.dirname(absolutePath) === dirname) {
      return true;
    }
  }
  return false;
}


// Merge files function
async function mergeFiles(extension) {
  const oppositeExtension = extension === ".ts" ? ".js" : ".ts";
  const files = fs.readdirSync(folderPath);
  let mergedContent = '';

  // List of files that will be merged
  let filesToMerge = [];

  // First pass: determine which files should be merged based on relative imports
  files.forEach((file) => {
    if ((file.endsWith(".ts") || file.endsWith(".js")) && !file.includes(".test.")) {
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (containsSiblingImport(filePath, content)) {
        const absolutePath = path.resolve(folderPath, file);
        filesToMerge.push(absolutePath); // Keep track of files to merge
      }
    }
  });

  const finalImports = [];

  // Second pass: process the files and remove imports from the files that are part of the merge
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);

    if (file.endsWith(extension) && !file.includes(".test.")) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Only process files that have relative imports and are in the merge list
      const absolutePath = path.resolve(folderPath, file);
      if (filesToMerge.includes(absolutePath)) {
        // Remove only directly relative imports for files that are in the merge list
        let cleanedContent = content;
        const imports = getAllImports(absolutePath, content);
        // if any of the keys of imports are in filesToMerge, remove the import's value for that key
        // from the `content` string
        const importsKeys = Array.from(imports.keys());
        for (let i = 0; i < importsKeys.length; i++) {
          const importKey = importsKeys[i];
          const importValues = imports.get(importKey);
          if (filesToMerge.includes(importKey)) {
            // if the importKey is in filesToMerge, but the extension doesn't match this file, we'll need to import it
            // from the opposite extension's merged file (if js, merged-ts.ts, if ts, merged-js.js);
            const isOppositeExtension = extension !== path.parse(importKey).ext;
            if (isOppositeExtension) {
              // change the import in `cleanedContent` to import from the opposite extension's merged file
              importValues.value.forEach((importValue) => {
                const parsedImport = parseImport(importValue);
                const otherMergedFile = outputFiles.get(oppositeExtension);
                cleanedContent = cleanedContent.replace(importValue, "");
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
  mergedContent = dedupeImports(finalImports.join(";\n"), finalPath) + "\n" + mergedContent;
  // run prettier:fix on mergedContent, then run eslint:fix on it
  const prettierOptions = await prettier.resolveConfig(process.cwd());
  mergedContent = prettier.format(mergedContent, {
    ...prettierOptions,
    parser: extension === ".ts" ? "typescript" : "babel",
  });

  // run eslint with fix option on mergedContent
  const ESLint = await eslint.loadESLint();
  const linter = new ESLint({fix: true, useEslintrc: true});
  const results = await linter.lintText(mergedContent, {filePath: path.join(folderPath, outputFiles.get(extension))});
  // if there is nothing for eslint to fix `output` ends up being `undefined`, so just return the original `mergedContent`
  return results[0].output || mergedContent;
}

// Merging the .ts and .js files
fs.writeFileSync(path.join(folderPath, outputFiles.get(".ts")), "", 'utf-8');
fs.writeFileSync(path.join(folderPath, outputFiles.get(".js")), "", 'utf-8');

const jsFile = await mergeFiles('.js');
const tsFile = await mergeFiles('.ts');

fs.writeFileSync(path.join(folderPath, outputFiles.get(".ts")), tsFile, 'utf-8');
fs.writeFileSync(path.join(folderPath, outputFiles.get(".js")), jsFile, 'utf-8');