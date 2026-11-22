// Jest runs these tests through Babel/CommonJS, but a few Node `.mts` scripts
// use `import.meta.url` for their direct-execution guard. Rewrite that one ESM
// expression to its CommonJS equivalent so tests can import those scripts.
module.exports = function transformImportMetaUrl({ types: t }) {
  return {
    name: 'transform-import-meta-url-for-jest',
    visitor: {
      MemberExpression(memberPath) {
        const { node } = memberPath;
        if (
          t.isMetaProperty(node.object) &&
          node.object.meta.name === 'import' &&
          node.object.property.name === 'meta' &&
          t.isIdentifier(node.property, { name: 'url' })
        ) {
          memberPath.replaceWith(
            t.memberExpression(
              t.callExpression(
                t.memberExpression(
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral('node:url'),
                  ]),
                  t.identifier('pathToFileURL'),
                ),
                [t.identifier('__filename')],
              ),
              t.identifier('href'),
            ),
          );
        }
      },
    },
  };
};
