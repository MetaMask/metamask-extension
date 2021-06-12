export function reconstructSource({
  definitions, // see eth-tx-project-info-server/src/gatherDefinitions
  typeId // `id` field present in https://www.trufflesuite.com/docs/truffle/codec/modules/_truffle_codec.format.types.html#userdefinedtype
}) {
  const [compilationId, astId] = typeId.split(":");

  const compilation = definitions.compilationsById[compilationId];

  const sourceRange = compilation.sourceRangesById[astId];
  const source = compilation.sourcesById[sourceRange.source.id];

  const lines = source.lines.slice(
    sourceRange.from.line,
    sourceRange.to.line + 1
  );

  return stripIndent(lines.join("\n"));
}

/*
 * HACK - this is copypasta'd from https://github.com/sindresorhus/strip-indent
 * due to package's inconveniently-imposed import asynchronicity requirements,
 * and @gnidan didn't dare attempt to sort out import() at time of writing
 */
function stripIndent(code) {
  const indent = minIndent(code);
  if (indent === 0) {
    return code;
  }
  const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
  return code.replace(regex, "");
}

/*
 * HACK - unfairly copypasta'd from https://github.com/jamiebuilds/min-indent,
 * even though their package did nothing wrong.
 */
function minIndent(code) {
  const match = code.match(/^[ \t]*(?=\S)/gm);
  if (!match) {
    return 0;
  }
  return match.reduce((r, a) => Math.min(r, a.length), Infinity);
}
