#!/usr/bin/env python3
"""Surgically inject @swc/core@1.16.2 + ts/tsx loader fixes into tagged AMO source.

Matches the local Docker harness (.cursor/amo-13471-10x-swc-bump.sh):
  - in-place envValidationLoader tsx-by-extension patch
  - in-place webpack.config.ts .ts/.tsx loader split on stock TYPESCRIPT_FILE_RE
  - yarn add @swc/core@1.16.2 after install in bundle.sh
  - leave helpers.ts stock (no file copies from the bump branch)

Usage:
  inject-amo-swc-bump.py <SOURCE_DIR> [PATCHES_DIR]
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> None:
  if len(sys.argv) not in (2, 3):
    raise SystemExit(
      "Usage: inject-amo-swc-bump.py <SOURCE_DIR> [PATCHES_DIR]"
    )

  source = Path(sys.argv[1])
  webpack = source / "development/webpack/webpack.config.ts"
  envloader = source / "development/webpack/utils/loaders/envValidationLoader.ts"
  bundle = source / "bundle.sh"
  helpers_path = source / "development/webpack/utils/helpers.ts"

  # --- envValidationLoader: tsx only for .tsx (surgical, tagged-source shape) ---
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
    print("AGENT: patched envValidationLoader.ts in place", flush=True)
  else:
    print("AGENT: envValidationLoader.ts already tsx-aware", flush=True)

  # --- webpack.config.ts: split .ts / .tsx loaders on stock TYPESCRIPT_FILE_RE ---
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
    print("AGENT: patched webpack.config.ts loader split in place", flush=True)
  else:
    print("AGENT: webpack.config.ts already has tsLoader", flush=True)

  if r"test: /\.(?:ts|mts)$/u" not in webpack.read_text(encoding="utf-8"):
    raise SystemExit("webpack.ts/tsx split missing after inject")

  # --- bundle.sh: after yarn install, bump @swc/core ---
  b = bundle.read_text(encoding="utf-8")
  if "yarn add @swc/core@1.16.2" not in b:
    match = re.search(r"(?mu)^yarn\s*$", b)
    if not match:
      raise SystemExit("bundle.sh yarn install line not found")
    insert_at = match.end()
    b = f"{b[:insert_at]}\nyarn add @swc/core@1.16.2\n{b[insert_at:]}"
    bundle.write_text(b, encoding="utf-8")
    print("AGENT: inserted yarn add @swc/core@1.16.2 in bundle.sh", flush=True)

  helpers = helpers_path.read_text(encoding="utf-8")
  if "runtimeChunkRe" in helpers or "mangle: false" in helpers:
    raise SystemExit("helpers unexpectedly have nomangle fix; abort")
  # Apples-to-apples with local Docker: helpers must stay stock tagged shape.
  if "TYPESCRIPT_TSX_FILE_RE" in helpers:
    raise SystemExit(
      "helpers unexpectedly has TYPESCRIPT_TSX_FILE_RE; "
      "use surgical inject, do not copy bump-branch helpers"
    )

  print(
    "AGENT: surgical SWC 1.16.2 inject done; stock helpers/mangle confirmed",
    flush=True,
  )


if __name__ == "__main__":
  main()
