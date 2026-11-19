import ts from 'typescript';
import { getPublicMethodNamesOfLegacyBackgroundApiService } from './legacy-background-api-service';
import { ResolutionContext } from './module-resolution';

describe('getPublicMethodNamesOfLegacyBackgroundApiService', () => {
  it('includes a public method', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { exposed() {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('includes a public async method', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { async exposed() {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('includes a public explicitly public method', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { public exposed() {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('includes a public getter', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { get exposed() { return 1; } }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('includes a public arrow property', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { exposed = () => {}; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('includes a public async arrow property', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { exposed = async () => {}; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('includes a public function property', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { exposed = function () {}; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('excludes a data field', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { field = 42; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a uninitialized field', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { field: unknown; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a constructor', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { constructor() {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a setter', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { set field(value) {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a private method', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { private hidden() {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a protected method', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { protected hidden() {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a private identifier method', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { #hidden() {} }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a private getter', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { private get hidden() { return 1; } }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a protected getter', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { protected get hidden() { return 1; } }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a private arrow', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { private hidden = () => {}; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a protected arrow', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { protected hidden = () => {}; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('excludes a private identifier arrow', () => {
    const { sourceFile, context } = parseSource(
      `class LegacyBackgroundApiService { #hidden = () => {}; }`,
    );

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set());
  });

  it('ignores members of nested and unrelated classes', () => {
    const { sourceFile, context } = parseSource(`class Other { unrelated() {} }
      class LegacyBackgroundApiService {
        exposed() { class Nested { nested() {} } }
      }`);

    const names = getPublicMethodNamesOfLegacyBackgroundApiService(
      sourceFile,
      context,
    );

    expect(names).toStrictEqual(new Set(['exposed']));
  });

  it('throws when the service class is missing', () => {
    const { sourceFile, context } = parseSource('class OtherService {}');

    expect(() =>
      getPublicMethodNamesOfLegacyBackgroundApiService(sourceFile, context),
    ).toThrow('LegacyBackgroundApiService was not found');
  });
});

/**
 * Parses a service fixture without loading the repository's source files.
 *
 * @param source - The complete source of the service fixture.
 * @returns The parsed source and an empty resolution context.
 */
function parseSource(source: string) {
  const sourceFile = ts.createSourceFile(
    'service.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const context = {
    sourceFilesByPath: new Map<string, ts.SourceFile>(),
  } satisfies ResolutionContext;

  return { sourceFile, context };
}
