const path = require('path');
const { PassThrough, Transform } = require('stream');
const {
  removeFencedCode,
  lintTransformedFile,
} = require('@metamask/build-utils');
const { getESLintInstance } = require('./utils');

module.exports = {
  createRemoveFencedCodeTransform,
};

class RemoveFencedCodeTransform extends Transform {
  /**
   * A transform stream that calls {@link removeFencedCode} on the complete
   * string contents of the file read by Browserify.
   *
   * Optionally lints the file if it was modified.
   *
   * @param {string} filePath - The path to the file being transformed.
   * @param {import('./remove-fenced-code').Features} features - Features that are currently enabled.
   * @param {boolean} shouldLintTransformedFiles - Whether the file should be
   * linted if modified by the transform.
   */
  constructor(filePath, features, shouldLintTransformedFiles) {
    super();
    this.filePath = filePath;
    this.features = features;
    this.shouldLintTransformedFiles = shouldLintTransformedFiles;
    this._fileBuffers = [];
  }

  // This function is called whenever data is written to the stream.
  // It concatenates all buffers for the current file into a single buffer.
  _transform(buffer, _encoding, next) {
    this._fileBuffers.push(buffer);
    next();
  }

  // "flush" is called when all data has been written to the
  // stream, immediately before the "end" event is emitted.
  // It applies the transform to the concatenated file contents.
  _flush(end) {
    let fileContent, didModify;
    try {
      [fileContent, didModify] = removeFencedCode(
        this.filePath,
        Buffer.concat(this._fileBuffers).toString('utf8'),
        this.features,
      );
    } catch (error) {
      return end(error);
    }

    const pushAndEnd = () => {
      this.push(fileContent);
      end();
    };

    if (this.shouldLintTransformedFiles && didModify) {
      return lintTransformedFile(
        getESLintInstance(),
        this.filePath,
        fileContent,
      )
        .then(pushAndEnd)
        .catch((error) => end(error));
    }
    return pushAndEnd();
  }
}

/**
 * A factory for a Browserify transform that removes fenced code from all
 * JavaScript source files. The transform is applied to files with the following
 * extensions:
 *   - `.js`
 *   - `.cjs`
 *   - `.mjs`
 *   - `.ts`
 *   - `.tsx`
 *
 * For details on how the transform mutates source files, see
 * {@link removeFencedCode} and the documentation.
 *
 * If specified (and by default), the transform will call ESLint on the text
 * contents of any file that it modifies. The transform will error if such a
 * file is ignored by ESLint, since linting is our first line of defense against
 * making un-syntactic modifications to files using code fences.
 *
 * @param {import('./remove-fenced-code').Features} features - Features that are currently enabled.
 * @param {boolean} shouldLintTransformedFiles - Whether to lint transformed files.
 * @returns {(filePath: string) => Transform} The transform function.
 */
function createRemoveFencedCodeTransform(
  features,
  shouldLintTransformedFiles = true,
) {
  // Browserify transforms are functions that receive a file name and return a
  // duplex stream. The stream receives the file contents piecemeal in the form
  // of Buffers.
  // To apply our code fencing transform, we concatenate all buffers and convert
  // them to a single string, then apply the actual transform function on that
  // string.

  /**
   * Returns a transform stream that removes fenced code from JavaScript/TypeScript files. For non-JavaScript
   * files, a pass-through stream is returned.
   *
   * @param filePath - The file path to transform.
   * @returns {Transform} The transform stream.
   */
  return function removeFencedCodeTransform(filePath) {
    if (
      !['.js', '.cjs', '.mjs', '.ts', '.tsx'].includes(path.extname(filePath))
    ) {
      return new PassThrough();
    }

    return new RemoveFencedCodeTransform(
      filePath,
      features,
      shouldLintTransformedFiles,
    );
  };
}
