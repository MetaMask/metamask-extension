#!/usr/bin/env python3
"""Inject @swc/core@1.16.2 + ts/tsx loader fixes into an AMO source tree.

Usage:
  inject-amo-swc-bump.py <SOURCE_DIR> <PATCHES_DIR>
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path


def main() -> None:
  if len(sys.argv) != 3:
    raise SystemExit("Usage: inject-amo-swc-bump.py <SOURCE_DIR> <PATCHES_DIR>")

  source = Path(sys.argv[1])
  patches = Path(sys.argv[2])
  webpack = source / "development/webpack/webpack.config.ts"
  envloader = source / "development/webpack/utils/loaders/envValidationLoader.ts"
  bundle = source / "bundle.sh"

  for rel in (
    "development/webpack/webpack.config.ts",
    "development/webpack/utils/loaders/envValidationLoader.ts",
  ):
    src = patches / rel
    dst = source / rel
    if src.is_file():
      dst.parent.mkdir(parents=True, exist_ok=True)
      shutil.copy2(src, dst)
      print(f"AGENT: copied {rel} from bump ref", flush=True)

  env_text = envloader.read_text(encoding="utf-8")
  if "const tsx = /\\.tsx$/u.test(resourcePath)" not in env_text:
    old_env = """  if (isTypeScript) {
    return { syntax: 'typescript', tsx: true };
  }"""
    new_env = """  if (isTypeScript) {
    // @swc/core >= 1.16 treats generics in .ts as JSX when tsx:true.
    const tsx = /\\.tsx$/u.test(resourcePath);
    return { syntax: 'typescript', tsx };
  }"""
    if old_env not in env_text:
      raise SystemExit("envValidationLoader inject point missing")
    envloader.write_text(env_text.replace(old_env, new_env, 1), encoding="utf-8")

  w = webpack.read_text(encoding="utf-8")
  if "const tsLoader = getSwcLoader('typescript', false" not in w:
    old_loader = (
      "const tsxLoader = getSwcLoader('typescript', true, safeVariables, swcConfig);"
    )
    new_loader = (
      "const tsLoader = getSwcLoader('typescript', false, safeVariables, swcConfig);\n"
      "const tsxLoader = getSwcLoader('typescript', true, safeVariables, swcConfig);"
    )
    if old_loader not in w:
      raise SystemExit("tsxLoader declaration not found")
    w = w.replace(old_loader, new_loader, 1)

    lines = w.splitlines(True)
    out: list[str] = []
    i = 0
    while i < len(lines):
      if lines[i].strip() == "{" and i + 1 < len(lines):
        window = "".join(lines[i : i + 12])
        if "test: TYPESCRIPT_FILE_RE," in window and "use: tsxLoader" in window:
          excl = None
          end = None
          for j in range(i, min(i + 14, len(lines))):
            if "exclude:" in lines[j]:
              excl = lines[j]
            if lines[j].strip().startswith("},"):
              end = j
              break
          if excl is None or end is None:
            out.append(lines[i])
            i += 1
            continue
          indent = lines[i][: len(lines[i]) - len(lines[i].lstrip())]
          excl_body = excl.lstrip()
          out.extend(
            [
              f"{indent}{{\n",
              f"{indent}  // typescript without JSX (@swc/core >= 1.16)\n",
              f"{indent}  test: /\\.(?:ts|mts)$/u,\n",
              f"{indent}  {excl_body}",
              f"{indent}  use: tsLoader,\n",
              f"{indent}}},\n",
              f"{indent}{{\n",
              f"{indent}  // typescript JSX\n",
              f"{indent}  test: /\\.tsx$/u,\n",
              f"{indent}  {excl_body}",
              f"{indent}  use: tsxLoader,\n",
              f"{indent}}},\n",
            ]
          )
          i = end + 1
          continue
      out.append(lines[i])
      i += 1
    webpack.write_text("".join(out), encoding="utf-8")

  b = bundle.read_text(encoding="utf-8")
  if "yarn add @swc/core@1.16.2" not in b:
    match = re.search(r"(?mu)^yarn\s*$", b)
    if not match:
      raise SystemExit("bundle.sh yarn install line not found")
    insert_at = match.end()
    b = f"{b[:insert_at]}\nyarn add @swc/core@1.16.2\n{b[insert_at:]}"
    bundle.write_text(b, encoding="utf-8")

  helpers = (source / "development/webpack/utils/helpers.ts").read_text(
    encoding="utf-8"
  )
  if "runtimeChunkRe" in helpers or "mangle: false" in helpers:
    raise SystemExit("helpers unexpectedly have nomangle fix; abort")

  print("AGENT: injected SWC 1.16.2 + loader fixes; stock mangle confirmed", flush=True)


if __name__ == "__main__":
  main()
