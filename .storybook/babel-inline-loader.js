const { transformAsync } = require('@babel/core');

module.exports = async function babelInlineLoader(source, inputSourceMap) {
  const callback = this.async();

  try {
    const result = await transformAsync(source, {
      filename: this.resourcePath,
      sourceMaps: true,
      inputSourceMap: inputSourceMap || undefined,
      configFile: true,
      babelrc: true,
      sourceType: 'unambiguous',
    });

    callback(null, result?.code ?? source, result?.map ?? inputSourceMap);
  } catch (error) {
    callback(error);
  }
};
