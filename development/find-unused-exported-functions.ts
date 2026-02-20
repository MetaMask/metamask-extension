#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import chalk from 'chalk';
import * as ts from 'typescript';

type CliOptions = {
  entries: string[];
  roots: string[];
  includeTests: boolean;
  includeAllRootFiles: boolean;
  json: boolean;
  reportPath?: string;
};

type ExportedFunctionCandidate = {
  declarationFilePath: string;
  declarationName: string;
  declarationNamePosition: number;
  exportName: string;
  line: number;
  column: number;
};

type UnusedFunctionReportItem = {
  file: string;
  exportName: string;
  declarationName: string;
  line: number;
  column: number;
};

const DEFAULT_ENTRIES = ['app/scripts/load/ui.ts', 'app/service-worker.ts'];
const DEFAULT_ROOTS = ['app', 'shared', 'ui'];

function printUsageAndExit(exitCode = 0): never {
  console.log(`Usage: tsx development/find-unused-exported-functions.ts [options]

Options:
  --entry <path>          Entry file to analyze (can be provided multiple times)
  --roots <a,b,c>         Comma-separated source roots (default: app,shared,ui)
  --include-tests         Include *.test.*, *.spec.*, and __tests__ files
  --all-root-files        Analyze all files under roots (ignore entry reachability)
  --json                  Output the report as JSON
  --report <path>         Write the report output to a file
  --help                  Show this help message
`);
  process.exit(exitCode);
}

function normalizePath(filePath: string): string {
  return path.resolve(filePath).split(path.sep).join('/');
}

function toRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function shouldIncludeFileByPattern(
  normalizedFilePath: string,
  includeTests: boolean,
): boolean {
  if (normalizedFilePath.endsWith('.d.ts')) {
    return false;
  }

  if (includeTests) {
    return true;
  }

  if (
    normalizedFilePath.includes('/__tests__/') ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(normalizedFilePath)
  ) {
    return false;
  }

  return true;
}

function parseCliOptions(argv: string[]): CliOptions {
  const entries: string[] = [];
  let roots = [...DEFAULT_ROOTS];
  let includeTests = false;
  let includeAllRootFiles = false;
  let json = false;
  let reportPath: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      printUsageAndExit();
    }

    if (arg === '--entry') {
      const entryValue = argv[index + 1];
      if (!entryValue) {
        console.error('Missing value for --entry');
        printUsageAndExit(1);
      }
      entries.push(entryValue);
      index += 1;
      continue;
    }

    if (arg.startsWith('--entry=')) {
      entries.push(arg.slice('--entry='.length));
      continue;
    }

    if (arg === '--roots') {
      const rootValue = argv[index + 1];
      if (!rootValue) {
        console.error('Missing value for --roots');
        printUsageAndExit(1);
      }
      roots = rootValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg.startsWith('--roots=')) {
      roots = arg
        .slice('--roots='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      continue;
    }

    if (arg === '--include-tests') {
      includeTests = true;
      continue;
    }

    if (arg === '--all-root-files') {
      includeAllRootFiles = true;
      continue;
    }

    if (arg === '--json') {
      json = true;
      continue;
    }

    if (arg === '--report') {
      const reportValue = argv[index + 1];
      if (!reportValue) {
        console.error('Missing value for --report');
        printUsageAndExit(1);
      }
      reportPath = reportValue;
      index += 1;
      continue;
    }

    if (arg.startsWith('--report=')) {
      reportPath = arg.slice('--report='.length);
      continue;
    }

    console.error(`Unknown option: ${arg}`);
    printUsageAndExit(1);
  }

  return {
    entries: entries.length > 0 ? entries : [...DEFAULT_ENTRIES],
    roots,
    includeTests,
    includeAllRootFiles,
    json,
    reportPath,
  };
}

function findTsConfigPath(): string {
  const tsConfigPath = ts.findConfigFile(
    process.cwd(),
    ts.sys.fileExists,
    'tsconfig.json',
  );

  if (!tsConfigPath) {
    throw new Error('Unable to find tsconfig.json in the current directory.');
  }

  return normalizePath(tsConfigPath);
}

function readAndParseTsConfig(tsConfigPath: string): ts.ParsedCommandLine {
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      `Failed to parse tsconfig file: ${ts.formatDiagnosticsWithColorAndContext(
        [configFile.error],
        {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => process.cwd(),
          getNewLine: () => '\n',
        },
      )}`,
    );
  }

  const parseResult = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsConfigPath),
  );

  if (parseResult.errors.length > 0) {
    throw new Error(
      `Failed to process tsconfig: ${ts.formatDiagnosticsWithColorAndContext(
        parseResult.errors,
        {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => process.cwd(),
          getNewLine: () => '\n',
        },
      )}`,
    );
  }

  parseResult.fileNames = parseResult.fileNames.map((fileName) =>
    normalizePath(fileName),
  );

  return parseResult;
}

function createLanguageService(
  fileNames: string[],
  compilerOptions: ts.CompilerOptions,
): ts.LanguageService {
  const snapshots = new Map<string, ts.IScriptSnapshot>();

  const languageServiceHost: ts.LanguageServiceHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    getCompilationSettings: () => compilerOptions,
    getCurrentDirectory: () => process.cwd(),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getScriptFileNames: () => fileNames,
    getScriptVersion: () => '0',
    getScriptSnapshot: (fileName) => {
      const normalizedFilePath = normalizePath(fileName);
      if (!existsSync(normalizedFilePath)) {
        return undefined;
      }

      const existingSnapshot = snapshots.get(normalizedFilePath);
      if (existingSnapshot) {
        return existingSnapshot;
      }

      const nextSnapshot = ts.ScriptSnapshot.fromString(
        readFileSync(normalizedFilePath, 'utf-8'),
      );
      snapshots.set(normalizedFilePath, nextSnapshot);
      return nextSnapshot;
    },
  };

  return ts.createLanguageService(languageServiceHost, ts.createDocumentRegistry());
}

function findDeepestNodeAtPosition(
  sourceFile: ts.SourceFile,
  position: number,
): ts.Node | undefined {
  function visit(node: ts.Node): ts.Node | undefined {
    if (position < node.pos || position >= node.end) {
      return undefined;
    }

    return ts.forEachChild(node, visit) ?? node;
  }

  return visit(sourceFile);
}

function isExportOnlyReference(
  program: ts.Program,
  filePath: string,
  position: number,
): boolean {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    return false;
  }

  const node = findDeepestNodeAtPosition(sourceFile, position);
  if (!node) {
    return false;
  }

  let currentNode: ts.Node | undefined = node;
  while (currentNode) {
    if (
      ts.isExportSpecifier(currentNode) ||
      ts.isExportDeclaration(currentNode) ||
      ts.isExportAssignment(currentNode)
    ) {
      return true;
    }
    currentNode = currentNode.parent;
  }

  return false;
}

function collectDependencySpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers = new Set<string>();

  function maybeAddSpecifier(
    moduleSpecifier: ts.Expression | undefined,
    isTypeOnly = false,
  ): void {
    if (
      isTypeOnly ||
      !moduleSpecifier ||
      (!ts.isStringLiteral(moduleSpecifier) &&
        !ts.isNoSubstitutionTemplateLiteral(moduleSpecifier))
    ) {
      return;
    }
    specifiers.add(moduleSpecifier.text);
  }

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node)) {
      maybeAddSpecifier(node.moduleSpecifier, node.importClause?.isTypeOnly);
    } else if (ts.isExportDeclaration(node)) {
      maybeAddSpecifier(node.moduleSpecifier, node.isTypeOnly);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      maybeAddSpecifier(node.moduleReference.expression);
    } else if (ts.isCallExpression(node)) {
      const firstArgument = node.arguments.at(0);

      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')
      ) {
        maybeAddSpecifier(firstArgument);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return [...specifiers];
}

function isFunctionLikeVariableDeclaration(
  declaration: ts.VariableDeclaration,
  checker: ts.TypeChecker,
): boolean {
  if (
    declaration.initializer &&
    (ts.isArrowFunction(declaration.initializer) ||
      ts.isFunctionExpression(declaration.initializer))
  ) {
    return true;
  }

  if (!ts.isIdentifier(declaration.name)) {
    return false;
  }

  const declarationType = checker.getTypeAtLocation(declaration.name);
  const callSignatures = checker.getSignaturesOfType(
    declarationType,
    ts.SignatureKind.Call,
  );

  return callSignatures.length > 0;
}

function maybeGetFunctionNameNode(
  declaration: ts.Declaration,
  checker: ts.TypeChecker,
): ts.Identifier | undefined {
  if (ts.isFunctionDeclaration(declaration)) {
    return declaration.name ? declaration.name : undefined;
  }

  if (
    ts.isVariableDeclaration(declaration) &&
    ts.isIdentifier(declaration.name) &&
    isFunctionLikeVariableDeclaration(declaration, checker)
  ) {
    return declaration.name;
  }

  return undefined;
}

function getDeclarationInSourceFile(
  declarations: readonly ts.Declaration[],
  sourceFilePath: string,
): ts.Declaration | undefined {
  const declarationsInFile = declarations.filter(
    (declaration) =>
      normalizePath(declaration.getSourceFile().fileName) === sourceFilePath,
  );

  if (declarationsInFile.length === 0) {
    return undefined;
  }

  const implementationDeclaration = declarationsInFile.find(
    (declaration) => ts.isFunctionDeclaration(declaration) && declaration.body,
  );

  return implementationDeclaration ?? declarationsInFile[0];
}

function getExportedFunctionCandidatesForFile(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ExportedFunctionCandidate[] {
  const sourceFilePath = normalizePath(sourceFile.fileName);
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

  if (!moduleSymbol) {
    return [];
  }

  const candidates: ExportedFunctionCandidate[] = [];
  const dedupeSet = new Set<string>();

  for (const exportSymbol of checker.getExportsOfModule(moduleSymbol)) {
    const symbolToInspect =
      exportSymbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exportSymbol)
        : exportSymbol;

    const declarations = symbolToInspect.getDeclarations() ?? [];
    const declaration = getDeclarationInSourceFile(declarations, sourceFilePath);
    if (!declaration) {
      continue;
    }

    const functionNameNode = maybeGetFunctionNameNode(declaration, checker);
    if (!functionNameNode) {
      continue;
    }

    const declarationNamePosition = functionNameNode.getStart();
    const dedupeKey = [
      sourceFilePath,
      declarationNamePosition,
      exportSymbol.getName(),
    ].join('::');

    if (dedupeSet.has(dedupeKey)) {
      continue;
    }
    dedupeSet.add(dedupeKey);

    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      declarationNamePosition,
    );

    candidates.push({
      declarationFilePath: sourceFilePath,
      declarationName: functionNameNode.text,
      declarationNamePosition,
      exportName: exportSymbol.getName(),
      line: line + 1,
      column: character + 1,
    });
  }

  return candidates;
}

function resolveModuleSpecifier(
  containingFilePath: string,
  moduleSpecifier: string,
  compilerOptions: ts.CompilerOptions,
  cache: ts.ModuleResolutionCache,
): string | undefined {
  const resolution = ts.resolveModuleName(
    moduleSpecifier,
    containingFilePath,
    compilerOptions,
    ts.sys,
    cache,
  );

  const resolvedFilePath = resolution.resolvedModule?.resolvedFileName;
  if (!resolvedFilePath) {
    return undefined;
  }

  return normalizePath(resolvedFilePath);
}

function renderTextReport(
  entries: string[],
  roots: string[],
  analyzedFilesCount: number,
  totalExportedFunctions: number,
  unusedItems: UnusedFunctionReportItem[],
): string {
  const header = [
    'Unused exported functions report',
    '',
    `Entries: ${entries.join(', ')}`,
    `Roots: ${roots.join(', ')}`,
    `Analyzed files: ${analyzedFilesCount}`,
    `Exported functions analyzed: ${totalExportedFunctions}`,
    `Unused exported functions: ${unusedItems.length}`,
    '',
  ].join('\n');

  if (unusedItems.length === 0) {
    return `${header}No unused exported functions found.\n`;
  }

  const body = unusedItems
    .map(
      (item) =>
        `${item.file}:${item.line}:${item.column}  export ${item.exportName} (declared as ${item.declarationName})`,
    )
    .join('\n');

  return `${header}${body}\n`;
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));

  const rootPaths = options.roots.map((root) => normalizePath(root));
  const entryPaths = options.entries.map((entry) => normalizePath(entry));

  for (const entryPath of entryPaths) {
    if (!existsSync(entryPath)) {
      throw new Error(`Entry file does not exist: ${entryPath}`);
    }
  }

  const isInRoot = (filePath: string): boolean =>
    rootPaths.some(
      (rootPath) => filePath === rootPath || filePath.startsWith(`${rootPath}/`),
    );

  const tsConfigPath = findTsConfigPath();
  const parsedConfig = readAndParseTsConfig(tsConfigPath);

  const rootFileNames = parsedConfig.fileNames.filter(
    (fileName) =>
      isInRoot(fileName) &&
      shouldIncludeFileByPattern(fileName, options.includeTests),
  );

  const languageService = createLanguageService(
    rootFileNames,
    parsedConfig.options,
  );
  const program = languageService.getProgram();

  if (!program) {
    throw new Error('TypeScript failed to create a language service program.');
  }

  const checker = program.getTypeChecker();
  const rootSourceFilePaths = rootFileNames.filter((fileName) =>
    Boolean(program.getSourceFile(fileName)),
  );

  const rootSourceFilesSet = new Set(rootSourceFilePaths);

  const moduleResolutionCache = ts.createModuleResolutionCache(
    process.cwd(),
    (fileName) =>
      ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    parsedConfig.options,
  );

  const reachableFiles = new Set<string>();
  const queue = [...entryPaths];

  while (queue.length > 0) {
    const currentFilePath = queue.shift();
    if (!currentFilePath) {
      continue;
    }

    const normalizedCurrentPath = normalizePath(currentFilePath);
    if (!rootSourceFilesSet.has(normalizedCurrentPath)) {
      continue;
    }

    if (reachableFiles.has(normalizedCurrentPath)) {
      continue;
    }
    reachableFiles.add(normalizedCurrentPath);

    const sourceFile = program.getSourceFile(normalizedCurrentPath);
    if (!sourceFile) {
      continue;
    }

    const dependencySpecifiers = collectDependencySpecifiers(sourceFile);
    for (const moduleSpecifier of dependencySpecifiers) {
      const resolvedDependencyPath = resolveModuleSpecifier(
        normalizedCurrentPath,
        moduleSpecifier,
        parsedConfig.options,
        moduleResolutionCache,
      );

      if (
        !resolvedDependencyPath ||
        !rootSourceFilesSet.has(resolvedDependencyPath) ||
        reachableFiles.has(resolvedDependencyPath)
      ) {
        continue;
      }

      queue.push(resolvedDependencyPath);
    }
  }

  const filesToAnalyze = options.includeAllRootFiles
    ? rootSourceFilePaths
    : [...reachableFiles];

  const filesToAnalyzeSet = new Set(filesToAnalyze);
  const exportedFunctionCandidates = filesToAnalyze.flatMap((filePath) => {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      return [];
    }

    return getExportedFunctionCandidatesForFile(sourceFile, checker);
  });

  const unusedItems: UnusedFunctionReportItem[] = [];

  for (const candidate of exportedFunctionCandidates) {
    const references =
      languageService.findReferences(
        candidate.declarationFilePath,
        candidate.declarationNamePosition,
      ) ?? [];

    let usageCount = 0;

    for (const referenceGroup of references) {
      for (const reference of referenceGroup.references) {
        const referenceFilePath = normalizePath(reference.fileName);
        if (!filesToAnalyzeSet.has(referenceFilePath) || reference.isDefinition) {
          continue;
        }

        if (
          isExportOnlyReference(
            program,
            referenceFilePath,
            reference.textSpan.start,
          )
        ) {
          continue;
        }

        usageCount += 1;
      }
    }

    if (usageCount === 0) {
      unusedItems.push({
        file: toRelativePath(candidate.declarationFilePath),
        exportName: candidate.exportName,
        declarationName: candidate.declarationName,
        line: candidate.line,
        column: candidate.column,
      });
    }
  }

  unusedItems.sort(
    (first, second) =>
      first.file.localeCompare(second.file) ||
      first.line - second.line ||
      first.column - second.column ||
      first.exportName.localeCompare(second.exportName),
  );

  const reportObject = {
    analyzedEntries: entryPaths.map(toRelativePath),
    analyzedRoots: rootPaths.map(toRelativePath),
    mode: options.includeAllRootFiles ? 'all-root-files' : 'entry-reachable',
    includeTests: options.includeTests,
    totals: {
      analyzedFiles: filesToAnalyze.length,
      exportedFunctionsAnalyzed: exportedFunctionCandidates.length,
      unusedExportedFunctions: unusedItems.length,
    },
    unused: unusedItems,
  };

  const reportContent = options.json
    ? `${JSON.stringify(reportObject, null, 2)}\n`
    : renderTextReport(
        reportObject.analyzedEntries,
        reportObject.analyzedRoots,
        reportObject.totals.analyzedFiles,
        reportObject.totals.exportedFunctionsAnalyzed,
        reportObject.unused,
      );

  if (options.reportPath) {
    const reportOutputPath = normalizePath(options.reportPath);
    writeFileSync(reportOutputPath, reportContent, 'utf-8');
    const relativeReportPath = toRelativePath(reportOutputPath);
    console.log(chalk.green(`Wrote report to ${relativeReportPath}`));
  }

  process.stdout.write(reportContent);
}

main().catch((error: unknown) => {
  console.error(
    chalk.red(
      `Failed to find unused exported functions:\n${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`,
    ),
  );
  process.exit(1);
});
