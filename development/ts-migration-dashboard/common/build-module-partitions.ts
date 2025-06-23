import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import madge from 'madge';
import {
  ROOT_DIRECTORY_PATH,
  ENTRYPOINT_PATTERNS,
  FILES_TO_CONVERT_PATH,
} from './constants';

/**
 * Represents a module that has been imported somewhere in the codebase, whether
 * it is local to the project or an NPM package.
 *
 * @property id - If an NPM package, then the name of the package; otherwise the
 * path to a file within the project.
 * @property dependents - The modules which are imported by this module.
 * @property level - How many modules it takes to import this module (from the
 * root of the dependency tree).
 * @property isExternal - Whether the module refers to a NPM package.
 * @property hasBeenConverted - Whether the module was one of the files we
 * wanted to convert to TypeScript and has been converted.
 */
type Module = {
  id: string;
  dependents: Module[];
  dependencies: Module[];
  level: number;
  isExternal: boolean;
  hasBeenConverted: boolean;
};

/**
 * Represents a module that belongs to a certain level within the dependency
 * graph, displayed as a box in the UI.
 *
 * @property id - The id of the module.
 * @property hasBeenConverted - Whether or not the module has been converted to
 * TypeScript.
 */
export type ModulePartitionChild = {
  id: string;
  hasBeenConverted: boolean;
  dependentIds: string[];
  dependencyIds: string[];
};

/**
 * Represents a set of modules that sit at a certain level within the final
 * dependency tree.
 *
 * @property level - How many modules it takes to import this module (from the
 * root of the dependency tree).
 * @property children - The modules that share this same level.
 */
export type ModulePartition = {
  level: number;
  children: ModulePartitionChild[];
};

/**
 * Uses the `madge` package to traverse the dependency graphs assembled from a
 * set of entrypoints (a combination of the entrypoints that the build script
 * uses to build the extension as well as a manually picked list), builds a
 * combined dependency tree, then arranges the nodes of that tree by level,
 * which is the number of files it takes to reach a file within the whole tree.
 *
 * @returns An array of objects which can be used to render the dashboard, where
 * each object represents a group of files at a certain level in the dependency
 * tree.
 */
export default async function buildModulePartitions(): Promise<
  ModulePartition[]
> {
  const allowedFilePaths = readFilesToConvert();

  const possibleEntryFilePaths = (
    await Promise.all(
      ENTRYPOINT_PATTERNS.map((entrypointPattern) => {
        return fg(
          path.resolve(ROOT_DIRECTORY_PATH, `${entrypointPattern}.{js,ts,tsx}`),
        );
      }),
    )
  ).flat();

  const entryFilePaths = filterFilePaths(
    possibleEntryFilePaths.map((possibleEntrypoint) =>
      path.relative(ROOT_DIRECTORY_PATH, possibleEntrypoint),
    ),
    allowedFilePaths,
  );

  const result = await madge(entryFilePaths, {
    baseDir: ROOT_DIRECTORY_PATH,
    tsConfig: path.join(ROOT_DIRECTORY_PATH, 'tsconfig.json'),
  });
  const dependenciesByFilePath = result.obj();
  const modulesById = buildModulesWithLevels(
    dependenciesByFilePath,
    entryFilePaths,
    allowedFilePaths,
  );
  return partitionModulesByLevel(modulesById);
}

/**
 * Returns the contents of a JSON file that stores the names of the files that
 * we plan on converting to TypeScript. All of the dependency information
 * will be filtered through this list.
 */
function readFilesToConvert(): string[] {
  try {
    return JSON.parse(fs.readFileSync(FILES_TO_CONVERT_PATH, 'utf-8'));
  } catch (error: unknown) {
    throw new Error(
      'Could not read or parse list of files to convert. ' +
        'Have you tried running the following command?\n\n' +
        '    yarn ts-migration:enumerate\n\n' +
        `Original error: ${error}`,
    );
  }
}

/**
 * Filters the given set of file paths according to the given allow list. As the
 * entry file paths could refer to TypeScript files, and the allow list is
 * guaranteed to be JavaScript files, the entry file paths are normalized to end
 * in `.js` before being filtered.
 *
 * @param filePaths - A set of file paths.
 * @param allowedFilePaths - A set of allowed file paths.
 * @returns The filtered file paths.
 */
function filterFilePaths(filePaths: string[], allowedFilePaths: string[]) {
  return filePaths.filter((filePath) =>
    allowedFilePaths.includes(filePath.replace(/\.tsx?$/u, '.js')),
  );
}

/**
 * This function takes a flat data structure that represents the dependency
 * graph of a system. It traverses the graph, converting it to a tree (i.e.,
 * resolving circular dependencies), but where any node of the tree is
 * accessible immediately. The "level" of a dependency — how many other
 * dependencies it takes to reach that dependency — is also recorded.
 *
 * @param dependenciesByModuleId - An object that maps a file path in the
 * dependency graph to the dependencies that it imports. This information is
 * provided by the `madge` package.
 * @param entryModuleIds - File paths which will initiate the traversal through
 * the dependency graph. These file paths will always be level 0.
 * @param allowedFilePaths - The list of original JavaScript files to
 * convert to TypeScript; governs which files will end up in the final
 * dependency graph.
 * @returns A data structure that maps the id of a module in the dependency
 * graph to an object that represents that module.
 */
function buildModulesWithLevels(
  dependenciesByModuleId: Record<string, string[]>,
  entryModuleIds: string[],
  allowedFilePaths: string[],
): Record<string, Module> {
  // Our overall goal is that we want to partition the graph into different
  // sections. We want to find the leaves of the graph — that is, files that
  // depend on no other files — then the dependents of the leaves — those files
  // that depend on the leaves — then the dependents of the dependents, etc. We
  // can derive this information by traversing the graph, and for each module we
  // encounter, recording the number of modules it takes to reach that module.
  // We call this number the **level**.
  //
  // We will discuss a couple of optimizations we've made to ensure that graph
  // traversal is performant.
  //
  // Naively, in order to calculate the level of each module, we need to follow
  // that module's dependencies, then the dependencies of the dependencies,
  // etc., until we hit leaves. Essentially, we need to follow each connection
  // in the graph. However, this creates a performance problem, because in a
  // large system a file could get imported multiple ways (this is the nature of
  // a graph: each node can have multiple incoming connections and multiple
  // outgoing connections). For instance:
  //
  // - `foo.js` could import `bar.js` which could import `baz.js`
  // - `foo.js` could also import `baz.js` directly
  // - `foo.js` could also import `bar.js` which imports `qux.js` which imports `baz.js`
  //
  // In this case, even if there are few modules in a system, a subset of those
  // modules may be visited multiple times in the course of traversing
  // connections between all of them. This is costly and unnecessary.
  //
  // To address this, as we are traversing the graph, we record modules we've
  // visited along with the level when we visited it. If we encounter a module
  // again through some other path, and the level this time is less than the
  // level we've already recorded, then we know we don't need to revisit that
  // module or — crucially — any of its dependencies. Therefore we can skip
  // whole sections of the graph.
  //
  // In addition, in a large enough system, some files could import files that end
  // up importing themselves later on:
  //
  // - `foo.js` could import `bar.js`, which imports `baz.js`, which imports `foo.js`, which...
  //
  // These are called circular dependencies, and we detect them by tracking the
  // files that depend on a file (dependents) in addition to the files on which
  // that file depends (dependencies). In the example above, `baz.js` has a
  // dependency `foo.js`, and its chain of dependents is `bar.js` -> `foo.js`
  // (working backward from `baz.js`). The chain of dependents of `baz.js`
  // includes `foo.js`, so we say `foo.js` is a circular dependency of `baz.js`,
  // and we don't need to follow it.

  let modulesToFill: Module[] = entryModuleIds.map((moduleId) => {
    return {
      id: moduleId,
      dependents: [],
      dependencies: [],
      level: 0,
      isExternal: false,
      hasBeenConverted: /\.tsx?$/u.test(moduleId),
    };
  });
  const modulesById: Record<string, Module> = {};

  while (modulesToFill.length > 0) {
    const currentModule = modulesToFill[0];

    if (currentModule.level > 100) {
      throw new Error(
        "Can't build module partitions, as the dependency graph is being traversed ad infinitum.",
      );
    }

    const dependencyModulesToFill: Module[] = [];
    for (const nonCanonicalDependencyModuleId of dependenciesByModuleId[
      currentModule.id
    ]) {
      // If the file path of the module is located in `node_modules`, use the
      // name of the package as the ID
      let dependencyModuleId;
      const npmPackageMatch = nonCanonicalDependencyModuleId.match(
        /^node_modules\/(?:(@[^/]+)\/)?([^/]+)\/.+$/u,
      );
      if (npmPackageMatch) {
        dependencyModuleId =
          npmPackageMatch[1] === undefined
            ? `${npmPackageMatch[2]}`
            : `${npmPackageMatch[1]}/${npmPackageMatch[2]}`;
      } else {
        dependencyModuleId = nonCanonicalDependencyModuleId;
      }

      // Skip circular dependencies
      if (
        findDirectAndIndirectDependentIdsOf(currentModule).has(
          dependencyModuleId,
        )
      ) {
        continue;
      }

      // Skip files that weren't on the original list of JavaScript files to
      // convert, as we don't want them to show up on the status dashboard
      if (
        !npmPackageMatch &&
        !allowedFilePaths.includes(
          dependencyModuleId.replace(/\.tsx?$/u, '.js'),
        )
      ) {
        continue;
      }

      let existingDependencyModule = modulesById[dependencyModuleId];

      if (existingDependencyModule === undefined) {
        existingDependencyModule = {
          id: dependencyModuleId,
          dependents: [currentModule],
          dependencies: [],
          level: currentModule.level + 1,
          isExternal: Boolean(npmPackageMatch),
          hasBeenConverted: /\.tsx?$/u.test(dependencyModuleId),
        };
        dependencyModulesToFill.push(existingDependencyModule);
      } else if (currentModule.level + 1 > existingDependencyModule.level) {
        existingDependencyModule.level = currentModule.level + 1;
        // Update descendant modules' levels
        dependencyModulesToFill.push(existingDependencyModule);
      } else {
        // There is no point in descending into dependencies of this module
        // if the new level of the module would be <= the existing level,
        // because all of the dependencies from this point on are guaranteed
        // to have a higher level and are therefore already at the right
        // level.
      }

      if (
        !existingDependencyModule.dependents.some(
          (m) => m.id === currentModule.id,
        )
      ) {
        existingDependencyModule.dependents.push(currentModule);
      }

      if (
        !currentModule.dependencies.some(
          (m) => m.id === existingDependencyModule.id,
        )
      ) {
        currentModule.dependencies.push(existingDependencyModule);
      }
    }
    if (dependencyModulesToFill.length > 0) {
      modulesToFill.push(...dependencyModulesToFill);
    }

    if (!(currentModule.id in modulesById)) {
      modulesById[currentModule.id] = currentModule;
    }
    modulesToFill = modulesToFill.slice(1);
  }

  return modulesById;
}

/**
 * Given a file in the dependency graph, returns all of the names of the files
 * which import that file directly or through some other file.
 *
 * @param module - A module in the graph.
 * @returns The ids of the modules which are direct and indirect dependents of
 * the module.
 */
function findDirectAndIndirectDependentIdsOf(module: Module): Set<string> {
  let modulesToProcess = [module];
  const allDependentIds = new Set<string>();
  while (modulesToProcess.length > 0) {
    const currentModule = modulesToProcess[0];
    for (const dependent of currentModule.dependents) {
      if (!allDependentIds.has(dependent.id)) {
        allDependentIds.add(dependent.id);
        modulesToProcess.push(dependent);
      }
    }
    modulesToProcess = modulesToProcess.slice(1);
  }
  return allDependentIds;
}

/**
 * Partitions modules in the dependency graph by level (see {@link buildModulesWithLevels}
 * for an explanation). This will be used to render those modules on the
 * dashboard in groups.
 *
 * @param modulesById - An object that maps the id of a module to an object that
 * represents that module.
 * @returns An array where each item represents a level and is the module ids
 * that match that level, sorted by largest level (leaves) to smallest level
 * (roots).
 */
function partitionModulesByLevel(
  modulesById: Record<string, Module>,
): ModulePartition[] {
  const levels = Object.values(modulesById).map((module) => module.level);
  const maxLevel = Math.max(...levels);
  const modulePartitions: ModulePartition[] = [];
  for (let i = 0; i <= maxLevel; i++) {
    modulePartitions[i] = { level: i + 1, children: [] };
  }
  Object.values(modulesById).forEach((module) => {
    modulePartitions[module.level].children.push({
      id: module.id,
      hasBeenConverted: module.hasBeenConverted,
      dependentIds: module.dependents.map((dependent) => dependent.id).sort(),
      dependencyIds: module.dependencies
        .map((dependency) => dependency.id)
        .sort(),
    });
  });
  Object.values(modulePartitions).forEach((partition) => {
    partition.children.sort((a, b) => {
      if (a.id < b.id) {
        return -1;
      } else if (a.id > b.id) {
        return 1;
      }
      return 0;
    });
  });
  return modulePartitions.reverse();
}
