#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

type BackupEntry = {
  backupPath: string;
  sourcePath: string;
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const attributionProjectDirectory = path.join(
  scriptDirectory,
  'generate-attributions',
);
const backupTargets = ['.yarn', '.yarnrc.yml', 'package.json'];

function getYarnCommand(): string {
  return process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
): void {
  const options = {
    cwd,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit' as const,
  };

  if (process.platform === 'win32' && command.endsWith('.cmd')) {
    execFileSync('cmd.exe', ['/d', '/c', command, ...args], options);
    return;
  }

  execFileSync(command, args, options);
}

function shouldRestoreWorkspace(): boolean {
  return !process.env.CI || process.env.FORCE_CLEANUP === 'true';
}

function getPathEnvironment(): NodeJS.ProcessEnv {
  const attributionBinDirectory = path.join(
    attributionProjectDirectory,
    'node_modules',
    '.bin',
  );
  const existingPath = process.env.PATH;

  return {
    PATH: existingPath
      ? `${attributionBinDirectory}${path.delimiter}${existingPath}`
      : attributionBinDirectory,
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function backupWorkspaceFiles(): Promise<{
  entries: BackupEntry[];
  tempDirectory: string;
}> {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'metamask-attributions-'),
  );
  const entries: BackupEntry[] = [];

  for (const backupTarget of backupTargets) {
    const sourcePath = path.join(projectDirectory, backupTarget);
    if (!(await pathExists(sourcePath))) {
      continue;
    }

    const backupPath = path.join(tempDirectory, backupTarget);
    entries.push({ backupPath, sourcePath });
    await cp(sourcePath, backupPath, {
      force: true,
      recursive: true,
    });
  }

  return { entries, tempDirectory };
}

async function restoreWorkspaceFiles(entries: BackupEntry[]): Promise<void> {
  for (const { sourcePath } of entries) {
    await rm(sourcePath, { force: true, recursive: true });
  }

  for (const { backupPath, sourcePath } of entries) {
    await cp(backupPath, sourcePath, {
      force: true,
      recursive: true,
    });
  }
}

async function unsetRootPostinstallScript(): Promise<void> {
  const packageJsonPath = path.join(projectDirectory, 'package.json');
  const packageJsonContents = await readFile(packageJsonPath, {
    encoding: 'utf8',
  });
  const packageJson = JSON.parse(packageJsonContents);

  delete packageJson.scripts.postinstall;

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

async function main(): Promise<void> {
  const shouldRestore = shouldRestoreWorkspace();
  const workspaceBackup = shouldRestore
    ? await backupWorkspaceFiles()
    : undefined;
  let thrownError: unknown;

  try {
    runCommand(getYarnCommand(), [], attributionProjectDirectory);
    runCommand(
      getYarnCommand(),
      ['allow-scripts'],
      attributionProjectDirectory,
    );

    await unsetRootPostinstallScript();

    const pathEnvironment = getPathEnvironment();
    runCommand(
      getYarnCommand(),
      ['plugin', 'remove', '@yarnpkg/plugin-allow-scripts'],
      projectDirectory,
      pathEnvironment,
    );
    runCommand(
      getYarnCommand(),
      ['workspaces', 'focus', '--production'],
      projectDirectory,
      pathEnvironment,
    );
    runCommand(
      getYarnCommand(),
      ['generate-attribution', '-o', projectDirectory, '-b', projectDirectory],
      attributionProjectDirectory,
    );
  } catch (error) {
    thrownError = error;
  } finally {
    if (workspaceBackup) {
      await restoreWorkspaceFiles(workspaceBackup.entries);
      await rm(workspaceBackup.tempDirectory, {
        force: true,
        recursive: true,
      });
      runCommand(getYarnCommand(), [], projectDirectory);
    }
  }

  if (thrownError) {
    throw thrownError;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
