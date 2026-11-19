import { join } from 'node:path';
import type { NodePath, PluginObj, PluginPass } from '@babel/core';
import type {
  LogicalExpression,
  NewExpression,
  StringLiteral,
  TemplateLiteral,
} from '@babel/types';

type ImportMetaUrlPluginOptions = {
  pattern?: string | RegExp;
  rootPath?: string;
};

type ImportMetaUrlPluginState = PluginPass & {
  opts: ImportMetaUrlPluginOptions;
};

/**
 * Babel plugin to transform `new URL(relativePath, import.meta.url)` expressions
 * when they match specified patterns.
 * @param options0
 * @param options0.types
 */
function importMetaUrlPlugin({
  types: t,
}: {
  types: typeof import('@babel/types');
}): PluginObj<ImportMetaUrlPluginState> {
  function isTargetNewURL(path: NodePath<NewExpression>): boolean {
    const { node } = path;
    const firstArg = node.arguments[0];
    const secondArg = node.arguments[1];
    return (
      t.isNewExpression(node) &&
      t.isIdentifier(node.callee, { name: 'URL' }) &&
      node.arguments.length === 2 &&
      firstArg !== undefined &&
      (t.isStringLiteral(firstArg) || t.isTemplateLiteral(firstArg)) &&
      t.isMemberExpression(secondArg) &&
      t.isMetaProperty(secondArg.object) &&
      secondArg.object.meta.name === 'import' &&
      t.isIdentifier(secondArg.object.property, { name: 'meta' }) &&
      t.isIdentifier(secondArg.property, { name: 'url' })
    );
  }

  function getRelativePath(arg: StringLiteral | TemplateLiteral): string {
    if (t.isStringLiteral(arg)) {
      return arg.value;
    }
    return arg.quasis.map((q) => q.value.raw).join('___');
  }

  function matchesPattern(
    relativePath: string,
    pattern: string | RegExp,
  ): boolean {
    if (typeof pattern === 'string') {
      return relativePath === pattern;
    }
    return pattern.test(relativePath);
  }

  function buildNewPathArg(
    originalArg: StringLiteral | TemplateLiteral,
    rootPath: string,
    pattern: string | RegExp,
  ): StringLiteral | TemplateLiteral {
    if (t.isStringLiteral(originalArg)) {
      if (pattern instanceof RegExp) {
        const match = originalArg.value.match(pattern);
        if (match) {
          const filename = match[1];
          const ext = originalArg.value.split('.').slice(1).join('.');
          const urlSafePath = join(rootPath, `${filename}.${ext}`).replace(
            /\\/gu,
            '/',
          );
          return t.stringLiteral(urlSafePath);
        }
      }
      const urlSafePath = join(rootPath, originalArg.value).replace(
        /\\/gu,
        '/',
      );
      return t.stringLiteral(urlSafePath);
    }

    const quasis = [...originalArg.quasis];
    const expressions = [...originalArg.expressions];
    const firstQuasi = quasis[0];
    const cookedPrefix = firstQuasi.value.cooked ?? firstQuasi.value.raw;

    quasis[0] = t.templateElement(
      {
        raw: rootPath + firstQuasi.value.raw,
        cooked: rootPath + cookedPrefix,
      },
      firstQuasi.tail,
    );

    return t.templateLiteral(quasis, expressions);
  }

  function buildBaseArg(): LogicalExpression {
    return t.logicalExpression(
      '||',
      t.optionalMemberExpression(
        t.memberExpression(t.identifier('self'), t.identifier('document')),
        t.identifier('baseURI'),
        false,
        true,
      ),
      t.memberExpression(
        t.memberExpression(t.identifier('self'), t.identifier('location')),
        t.identifier('href'),
      ),
    );
  }

  function buildNewExpression(
    pathArg: StringLiteral | TemplateLiteral,
    baseArg: LogicalExpression,
  ): NewExpression {
    return t.newExpression(t.identifier('URL'), [pathArg, baseArg]);
  }

  return {
    visitor: {
      NewExpression(path, state) {
        const pattern = state.opts.pattern ?? '';
        const rootPath = state.opts.rootPath ?? '';

        if (!rootPath) {
          throw new Error('rootPath option is required');
        }

        if (!isTargetNewURL(path)) {
          return;
        }

        const originalArg = path.node.arguments[0];
        if (
          !originalArg ||
          (!t.isStringLiteral(originalArg) && !t.isTemplateLiteral(originalArg))
        ) {
          return;
        }

        const relativePath = getRelativePath(originalArg);

        if (matchesPattern(relativePath, pattern)) {
          const pathArg = buildNewPathArg(originalArg, rootPath, pattern);
          const baseArg = buildBaseArg();
          path.replaceWith(buildNewExpression(pathArg, baseArg));
        }
      },
    },
  };
}

// Babel loads this file via `require()` from `babel.config.js`.
module.exports = importMetaUrlPlugin;
