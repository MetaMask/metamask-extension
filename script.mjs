import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { prettify, resolveFile, outputFiles, mergeFiles } from "./refactor-selectors-utils.mjs";

const dryRun = false;

const folderPath = './ui/selectors/';
const indexFilePath = path.join(folderPath, 'index.js');
let indexFileContents = fs.readFileSync(indexFilePath, 'utf-8');
const exportedFiles = [...indexFileContents.matchAll(/'([^"']*)';/g)].map(m => {
  return resolveFile(path.resolve(path.join(folderPath, m[1])));
});

// find all files in the project that import files from the folderPath
// and update these imports to import from the index file instead
const allFiles = glob.sync('**/*.{ts,js,tsx,jsx}', {
  ignore: ['node_modules/**', 'ui/selectors/**', `dist/**`, `builds/**`, `coverage/**`],
}).map(file => {
  return path.resolve(process.cwd(), file);
});
glob.sync('ui/selectors/*.test.{ts,js}').forEach(file => {
  allFiles.push(path.resolve(process.cwd(), file));
});

for (const file of allFiles) {
  let originalContent = fs.readFileSync(file, 'utf-8');
  const content = originalContent.replace(
    /([\s\n]*from[\s\n]*)['"]([^'"]+)['"];/g,
    (match, prefix, importedFile) => {
      // only consider relative files
      if (importedFile.startsWith('.')) {
        const absolutePath = resolveFile(path.resolve(path.dirname(file), importedFile));
        if (
          exportedFiles.includes(absolutePath)
        ) {
          // replace the import with the index file
          const newImportPath = path.dirname(importedFile);
          return `${prefix}'${newImportPath}';`;
        }
      }
      return match;
    },
  );

  if (content != originalContent) {
    dryRun || fs.writeFileSync(file, await prettify(content, file), 'utf-8');
  }
}

// Merging the .ts and .js files
fs.writeFileSync(path.join(folderPath, outputFiles.get('.ts')), '', 'utf-8');
fs.writeFileSync(path.join(folderPath, outputFiles.get('.js')), '', 'utf-8');

const { files: mergedJsFiles, content: jsFile } = await mergeFiles('.js', folderPath);
const { files: mergedTsFiles, content: tsFile } = await mergeFiles('.ts', folderPath);

dryRun ||
  fs.writeFileSync(
    path.join(folderPath, outputFiles.get('.ts')),
    tsFile,
    'utf-8',
  );
dryRun ||
  fs.writeFileSync(
    path.join(folderPath, outputFiles.get('.js')),
    jsFile,
    'utf-8',
  );

[...new Set([...mergedJsFiles, ...mergedTsFiles])].forEach((file) => {
  // clean up the files that were merged
  dryRun || fs.unlinkSync(file);
  // and remove them from the index file
  const importString = `export * from './${path.basename(
    file,
    path.extname(file),
  )}';\n`;
  indexFileContents = indexFileContents.replace(importString, '');
});

const jsImportString = `export * from './merged-js.js';`;
const tsImportString = `export * from './merged-ts.ts';`;
indexFileContents = indexFileContents.replace(jsImportString, '').replace(tsImportString, '');
indexFileContents += jsImportString + '\n' + tsImportString + '\n';
dryRun ||
  fs.writeFileSync(indexFilePath, await prettify(indexFileContents, indexFilePath), 'utf-8');