import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { arch, platform } from 'node:os';

export enum SpeculosPlatform {
  Linux = 'linux',
  Mac = 'darwin',
}

export enum SpeculosArch {
  Amd64 = 'amd64',
  Arm64 = 'arm64',
}

export function normalizeArch(systemArch: string = arch()): SpeculosArch {
  if (systemArch.startsWith('arm')) {
    return SpeculosArch.Arm64;
  }
  if (systemArch === 'x64') {
    try {
      const result = execSync(
        'sysctl -n sysctl.proc_translated 2>/dev/null',
      );
      if (result[0] === 1) {
        return SpeculosArch.Arm64;
      }
    } catch {
      // sysctl not available or not Rosetta
    }
  }
  return SpeculosArch.Amd64;
}

export function getPlatformArch(): string {
  const p = platform() === 'darwin' ? SpeculosPlatform.Mac : SpeculosPlatform.Linux;
  const a = normalizeArch();
  return `${p}-${a}`;
}
