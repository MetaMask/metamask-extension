/** @jest-environment node */

/**
 * The spacing-grid config block sits at the end of .eslintrc.js, and its rule
 * is core `no-restricted-syntax` under the design-system plugin, so its
 * selectors never replace the `no-restricted-syntax` configs that other blocks
 * set on the same files (the TypeScript block and the confirmations override
 * both set it). These tests resolve the flat config ESLint actually uses and
 * lint the flagged syntax, so moving the rule or its selectors fails here.
 *
 * Unit coverage: this is ESLint config cascade, not a screen, a controller
 * seam, or a component interaction.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Linter } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { it as jestIt } from '@jest/globals';

import designSystemPlugin from './design-system-plugin';

const REPO_ROOT = path.join(__dirname, '..', '..');
const SPACING_RULE = 'design-system/spacing-grid';
const REASON_RULE = 'design-system/spacing-grid-disable-reason';
const SYNTAX_RULE = 'no-restricted-syntax';
const EXPECTED_SELECTOR_COUNT = 9;

const UI_SOURCE_FILE = 'ui/pages/asset/components/chart/asset-chart.tsx';
const UI_JS_SOURCE_FILE =
  'ui/components/ui/sender-to-recipient/sender-to-recipient.component.js';
const SHARED_SOURCE_FILE = 'shared/lib/fetch-with-cache.ts';
const CONFIRMATIONS_FILE = 'ui/pages/confirmations/confirm/confirm.tsx';
const UI_TEST_FILE =
  'ui/pages/asset/components/chart/advanced-chart-iframe.test.tsx';
const STORIES_FILE = 'ui/components/component-library/text/text.stories.tsx';
const MOCKS_FILE = 'ui/__mocks__/actions.js';

const OFF_GRID = 'Spacing is off the 4px grid';
const ARBITRARY = 'Arbitrary spacing values';

const ANCHOR_FILES = [
  UI_SOURCE_FILE,
  UI_JS_SOURCE_FILE,
  SHARED_SOURCE_FILE,
  CONFIRMATIONS_FILE,
  UI_TEST_FILE,
  STORIES_FILE,
  MOCKS_FILE,
];

type SpacingCase = {
  name: string;
  file: string;
  code: string;
  messages: string[];
};

const SPACING_CASES: SpacingCase[] = [
  {
    name: 'flags off-grid spacing numbers in a style object',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ padding: 15, marginTop: 6, gap: 1.5, columnGap: 98 }} />;',
    messages: [OFF_GRID, OFF_GRID, OFF_GRID, OFF_GRID],
  },
  {
    name: 'flags a negative off-grid margin',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ marginLeft: -10 }} />;',
    messages: [OFF_GRID],
  },
  {
    name: 'flags logical spacing keys',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ paddingInline: 10, marginBlockEnd: 3 }} />;',
    messages: [OFF_GRID, OFF_GRID],
  },
  {
    name: 'flags off-grid literals in ternary branches, including a negative',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ paddingTop: expanded ? 22 : 0, marginTop: collapsed ? -10 : 6 }} />;',
    messages: [OFF_GRID, OFF_GRID, OFF_GRID],
  },
  {
    name: 'allows spacing on the 4px grid',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ padding: 16, marginTop: 0, rowGap: 104, marginLeft: -8, paddingBottom: 100 }} />;',
    messages: [],
  },
  {
    name: 'allows on-grid ternary branches',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ padding: expanded ? 8 : 0 }} />;',
    messages: [],
  },
  {
    name: 'ignores keys that are not spacing',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ width: 15, borderRadius: 6, top: 3, paddingSize: 5 }} />;',
    messages: [],
  },
  {
    name: 'ignores spacing keys outside a style attribute',
    file: UI_SOURCE_FILE,
    code: 'const styles = { marginTop: 6 }; const other = { marginBottom: 1 };',
    messages: [],
  },
  {
    name: 'ignores Box-prop objects, which use the design-system scale',
    file: UI_SOURCE_FILE,
    code: 'const a = <Box labelProps={{ marginBottom: 1 }} paddingLeft={2} />;',
    messages: [],
  },
  {
    name: 'flags off-grid px strings in a style object',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ margin: "1px 4px", padding: "6px", gap: "-2px" }} />;',
    messages: [OFF_GRID, OFF_GRID, OFF_GRID],
  },
  {
    name: 'flags px strings in ternary branches',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ margin: expanded ? "6px" : "8px" }} />;',
    messages: [OFF_GRID],
  },
  {
    name: 'allows px strings on the grid and non-px units',
    file: UI_SOURCE_FILE,
    code: 'const a = <div style={{ margin: "4px 8px", padding: "0px", gap: "0.5rem", width: "1px" }} />;',
    messages: [],
  },
  {
    name: 'flags arbitrary spacing classes in className',
    file: UI_SOURCE_FILE,
    code: `const a = <div className="pt-[22px] mx-4" />; const b = <div className={\`mb-[10px] \${extra}\`} />;`,
    messages: [ARBITRARY, ARBITRARY],
  },
  {
    name: 'flags arbitrary spacing classes behind variants, important and the space family',
    file: UI_SOURCE_FILE,
    code: 'const a = <div className="dark:p-[3px]" />; const b = <div className="md:gap-[6px]" />; const c = <div className="!-mt-[2px]" />; const d = <div className="space-y-[10px]" />;',
    messages: [ARBITRARY, ARBITRARY, ARBITRARY, ARBITRARY],
  },
  {
    name: 'flags arbitrary spacing classes in classnames, clsx and twMerge arguments',
    file: UI_SOURCE_FILE,
    code: 'const a = classnames("mt-[6px]", cond ? "p-[10px]" : "p-2"); const b = clsx("gap-x-[14px]"); const c = twMerge("mb-[3px] px-4"); const d = classnames({ "space-x-[9px]": isActive });',
    messages: [ARBITRARY, ARBITRARY, ARBITRARY, ARBITRARY, ARBITRARY],
  },
  {
    name: 'reports a className wrapping a classnames call once',
    file: UI_SOURCE_FILE,
    code: 'const a = <div className={classnames("p-[6px]")} />;',
    messages: [ARBITRARY],
  },
  {
    name: 'allows scale classes, other properties, calc() and interpolated values',
    file: UI_SOURCE_FILE,
    code: `const a = <div className="p-4 mt-0.5 h-[15px] w-[200px]" />; const b = <div className="pb-[calc(16px+env(safe-area-inset-bottom))]" />; const c = <div className={\`mb-[\${inset}px]\`} />; const d = <div className="p-[var(--x)]" />;`,
    messages: [],
  },
];

type ResolvedRules = Record<
  string,
  Record<string, unknown[] | null | undefined>
>;

/**
 * Jest's vm cannot dynamically import the ESLint config (ESLint loads config
 * files through dynamic import). Ask a plain Node process for the rules
 * ESLint would use for these files.
 */
const loadResolvedRules = (files: string[]): ResolvedRules => {
  const unique = [...new Set(files)];
  const outPath = path.join(
    os.tmpdir(),
    `spacing-grid-eslint-${process.pid}.json`,
  );
  const script = `
const { ESLint } = require('eslint');
const fs = require('node:fs');
const path = require('node:path');
const files = ${JSON.stringify(unique)};
const cwd = ${JSON.stringify(REPO_ROOT)};
const outPath = ${JSON.stringify(outPath)};
const eslint = new ESLint({ cwd, overrideConfigFile: path.join(cwd, '.eslintrc.js') });
(async () => {
  const rules = {};
  for (const file of files) {
    const config = await eslint.calculateConfigForFile(path.join(cwd, file));
    rules[file] = config.rules;
  }
  fs.writeFileSync(outPath, JSON.stringify(rules));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '' },
  });
  if (result.status !== 0) {
    throw new Error(
      `Failed to resolve ESLint config (status ${result.status}).\n${result.stderr}`,
    );
  }
  const parsed = JSON.parse(fs.readFileSync(outPath, 'utf8')) as ResolvedRules;
  fs.unlinkSync(outPath);
  return parsed;
};

const selectorsOf = (options: unknown[] | null | undefined): string[] =>
  (options ?? [])
    .slice(1)
    .map((option) => (option as { selector?: string }).selector ?? '');

describe('design-system spacing grid', () => {
  const resolvedRules: ResolvedRules = loadResolvedRules(ANCHOR_FILES);
  const linter = new Linter({ cwd: REPO_ROOT });

  describe('config cascade', () => {
    it('re-exports core no-restricted-syntax as the spacing-grid rule', () => {
      expect(designSystemPlugin.rules['spacing-grid']).toBe(
        builtinRules.get(SYNTAX_RULE),
      );
    });

    for (const file of [
      UI_SOURCE_FILE,
      UI_JS_SOURCE_FILE,
      SHARED_SOURCE_FILE,
    ]) {
      it(`applies to ${file} as an error with the spacing selectors`, () => {
        const rule = resolvedRules[file]?.[SPACING_RULE];

        expect(rule?.[0]).toBe(2);
        expect(rule).toHaveLength(EXPECTED_SELECTOR_COUNT + 1);
      });

      it(`applies the disable-reason rule to ${file}`, () => {
        expect(resolvedRules[file]?.[REASON_RULE]).toStrictEqual([2]);
      });
    }

    for (const file of [UI_TEST_FILE, STORIES_FILE, MOCKS_FILE]) {
      it(`does not apply to ${file}`, () => {
        const rules = resolvedRules[file] ?? {};

        expect(rules[SPACING_RULE]).toBeUndefined();
        expect(rules[REASON_RULE]).toBeUndefined();
      });
    }

    it('keeps the base no-restricted-syntax bans on ui source', () => {
      const options = resolvedRules[UI_SOURCE_FILE]?.[SYNTAX_RULE];

      expect(selectorsOf(options)).toStrictEqual([
        'WithStatement',
        'SequenceExpression',
      ]);
    });

    it('keeps the confirmations no-restricted-syntax override next to the spacing rule', () => {
      const options = resolvedRules[CONFIRMATIONS_FILE]?.[SYNTAX_RULE];
      const selectors = selectorsOf(options);

      expect(selectors).toHaveLength(1);
      expect(selectors[0]).toContain('ImportSpecifier');
      expect(resolvedRules[CONFIRMATIONS_FILE]?.[SPACING_RULE]?.[0]).toBe(2);
    });
  });

  describe('selectors', () => {
    const lintSpacing = (file: string, code: string): string[] => {
      const options = resolvedRules[file]?.[SPACING_RULE];
      if (!Array.isArray(options)) {
        throw new Error(`No ${SPACING_RULE} config was resolved for ${file}`);
      }
      return linter
        .verify(
          code,
          {
            files: ['**/*.{js,jsx,ts,tsx}'],
            languageOptions: {
              ecmaVersion: 2022,
              sourceType: 'module',
              parserOptions: { ecmaFeatures: { jsx: true } },
            },
            plugins: { 'design-system': designSystemPlugin },
            rules: { [SPACING_RULE]: options as unknown as Linter.RuleEntry },
          },
          { filename: path.join(REPO_ROOT, file) },
        )
        .filter((message) => message.ruleId === SPACING_RULE)
        .map((message) => message.message);
    };

    jestIt.each(SPACING_CASES)('$name', ({ file, code, messages }) => {
      const result = lintSpacing(file, code);

      expect(
        result.map(
          (item) =>
            [OFF_GRID, ARBITRARY].find((prefix) => item.startsWith(prefix)) ??
            item,
        ),
      ).toStrictEqual(messages);
    });
  });

  describe('disable reasons', () => {
    const lintReasons = (code: string): string[] =>
      linter
        .verify(
          code,
          {
            files: ['**/*.{js,jsx,ts,tsx}'],
            languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
            plugins: { 'design-system': designSystemPlugin },
            rules: { [REASON_RULE]: 2 },
          },
          { filename: path.join(REPO_ROOT, UI_SOURCE_FILE) },
        )
        .filter((message) => message.ruleId === REASON_RULE)
        .map((message) => message.message);

    it('flags a disable without a reason', () => {
      expect(
        lintReasons(
          '// eslint-disable-next-line design-system/spacing-grid\nconst a = 1;\n',
        ),
      ).toHaveLength(1);
    });

    it('allows a disable with a reason', () => {
      expect(
        lintReasons(
          '// eslint-disable-next-line design-system/spacing-grid -- 2px half-step\nconst a = 1;\n',
        ),
      ).toStrictEqual([]);
    });
  });
});
