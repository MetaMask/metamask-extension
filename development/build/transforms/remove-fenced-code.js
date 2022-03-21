const path = require('path');
const { PassThrough, Transform } = require('stream');
const { BuildType } = require('../../lib/build-type');
const { lintTransformedFile } = require('./utils');

const hasKey = (obj, key) => Reflect.hasOwnProperty.call(obj, key);

module.exports = {
  createRemoveFencedCodeTransform,
  removeFencedCode,
};

class RemoveFencedCodeTransform extends Transform {
  /**
   * A transform stream that calls {@link removeFencedCode} on the complete
   * string contents of the file read by Browserify.
   *
   * Optionally lints the file if it was modified.
   *
   * @param {string} filePath - The path to the file being transformed.
   * @param {string} buildType - The type of the current build process.
   * @param {boolean} shouldLintTransformedFiles - Whether the file should be
   * linted if modified by the transform.
   */
  constructor(filePath, buildType, shouldLintTransformedFiles) {
    super();
    this.filePath = filePath;
    this.buildType = buildType;
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
        this.buildType,
        Buffer.concat(this._fileBuffers).toString('utf8'),
      );
    } catch (error) {
      return end(error);
    }

    const pushAndEnd = () => {
      this.push(fileContent);
      end();
    };

    if (this.shouldLintTransformedFiles && didModify) {
      return lintTransformedFile(fileContent, this.filePath)
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
 *
 * For details on how the transform mutates source files, see
 * {@link removeFencedCode} and the documentation.
 *
 * If specified (and by default), the transform will call ESLint on the text
 * contents of any file that it modifies. The transform will error if such a
 * file is ignored by ESLint, since linting is our first line of defense against
 * making un-syntactic modifications to files using code fences.
 *
 * @param {string} buildType - The type of the current build.
 * @param {boolean} shouldLintTransformedFiles - Whether to lint transformed files.
 * @returns {(filePath: string) => Transform} The transform function.
 */
function createRemoveFencedCodeTransform(
  buildType,
  shouldLintTransformedFiles = true,
) {
  if (!hasKey(BuildType, buildType)) {
    throw new Error(
      `Code fencing transform received unrecognized build type "${buildType}".`,
    );
  }

  // Browserify transforms are functions that receive a file name and return a
  // duplex stream. The stream receives the file contents piecemeal in the form
  // of Buffers.
  // To apply our code fencing transform, we concatenate all buffers and convert
  // them to a single string, then apply the actual transform function on that
  // string.

  /**
   * Returns a transform stream that removes fenced code from JavaScript files. For non-JavaScript
   * files, a pass-through stream is returned.
   *
   * @param filePath - The file path to transform.
   * @returns {Transform} The transform stream.
   */
  return function removeFencedCodeTransform(filePath) {
    if (!['.js', '.cjs', '.mjs'].includes(path.extname(filePath))) {
      return new PassThrough();
    }

    return new RemoveFencedCodeTransform(
      filePath,
      buildType,
      shouldLintTransformedFiles,
    );
  };
}

const DirectiveTerminuses = {
  BEGIN: 'BEGIN',
  END: 'END',
};

const DirectiveCommands = {
  ONLY_INCLUDE_IN: 'ONLY_INCLUDE_IN',
};

const CommandValidators = {
  [DirectiveCommands.ONLY_INCLUDE_IN]: (params, filePath) => {
    if (!params || params.length === 0) {
      throw new Error(
        getInvalidParamsMessage(
          filePath,
          DirectiveCommands.ONLY_INCLUDE_IN,
          `No params specified.`,
        ),
      );
    }

    params.forEach((param) => {
      if (!hasKey(BuildType, param)) {
        throw new Error(
          getInvalidParamsMessage(
            filePath,
            DirectiveCommands.ONLY_INCLUDE_IN,
            `"${param}" is not a valid build type.`,
          ),
        );
      }
    });
  },
};

// Matches lines starting with "///:", and any preceding whitespace, except
// newlines. We except newlines to avoid eating blank lines preceding a fenced
// line.
// Double-negative RegEx credit: https://stackoverflow.com/a/3469155
const linesWithFenceRegex = /^[^\S\r\n]*\/\/\/:.*$/gmu;

// Matches the first "///:" in a string, and any preceding whitespace
const fenceSentinelRegex = /^\s*\/\/\/:/u;

// Breaks a fence directive into its constituent components
// At this stage of parsing, we are looking for one of:
// - TERMINUS:COMMAND(PARAMS)
// - TERMINUS:COMMAND
const directiveParsingRegex = /^([A-Z]+):([A-Z_]+)(?:\(((?:\w+,)*\w+)\))?$/u;

/**
 * Removes fenced code from the given JavaScript source string. "Fenced code"
 * includes the entire fence lines, including their trailing newlines, and the
 * lines that they surround.
 *
 * A valid fence consists of two well-formed fence lines, separated by one or
 * more lines that should be excluded. The first line must contain a `BEGIN`
 * directive, and the second most contain an `END` directive. Both directives
 * must specify the same command.
 *
 * Here's an example of a valid fence:
 *
 * ```javascript
 *   ///: BEGIN:ONLY_INCLUDE_IN(flask)
 *   console.log('I am Flask.');
 *   ///: END:ONLY_INCLUDE_IN
 * ```
 *
 * For details, please see the documentation.
 *
 * @param {string} filePath - The path to the file being transformed.
 * @param {string} typeOfCurrentBuild - The type of the current build.
 * @param {string} fileContent - The contents of the file being transformed.
 * @returns {[string, modified]} A tuple of the post-transform file contents and
 * a boolean indicating whether they were modified.
 */
function removeFencedCode(filePath, typeOfCurrentBuild, fileContent) {
  // Do not modify the file if we detect an inline sourcemap. For reasons
  // yet to be determined, the transform receives every file twice while in
  // watch mode, the second after Babel has transpiled the file. Babel adds
  // inline source maps to the file, something we will never do in our own
  // source files, so we use the existence of inline source maps to determine
  // whether we should ignore the file.
  if (/^\/\/# sourceMappingURL=/gmu.test(fileContent)) {
    return [fileContent, false];
  }

  // If we didn't match any lines, return the unmodified file contents.
  const matchedLines = [...fileContent.matchAll(linesWithFenceRegex)];

  if (matchedLines.length === 0) {
    return [fileContent, false];
  }

  // Parse fence lines
  const parsedDirectives = matchedLines.map((matchArray) => {
    const line = matchArray[0];

    /* istanbul ignore next: should be impossible */
    if (!fenceSentinelRegex.test(line)) {
      throw new Error(
        getInvalidFenceLineMessage(
          filePath,
          line,
          `Fence sentinel may only appear at the start of a line, optionally preceded by whitespace.`,
        ),
      );
    }

    // Store the start and end indices of each line
    // Increment the end index by 1 to including the trailing newline when
    // performing string operations.
    const indices = [matchArray.index, matchArray.index + line.length + 1];

    const lineWithoutSentinel = line.replace(fenceSentinelRegex, '');
    if (!/^ \w\w+/u.test(lineWithoutSentinel)) {
      throw new Error(
        getInvalidFenceLineMessage(
          filePath,
          line,
          `Fence sentinel must be followed by a single space and an alphabetical string of two or more characters.`,
        ),
      );
    }

    const directiveMatches = lineWithoutSentinel
      .trim()
      .match(directiveParsingRegex);

    if (!directiveMatches) {
      throw new Error(
        getInvalidFenceLineMessage(
          filePath,
          line,
          `Failed to parse fence directive.`,
        ),
      );
    }

    // The first element of a RegEx match array is the input
    const [, terminus, command, parameters] = directiveMatches;

    if (!hasKey(DirectiveTerminuses, terminus)) {
      throw new Error(
        getInvalidFenceLineMessage(
          filePath,
          line,
          `Line contains invalid directive terminus "${terminus}".`,
        ),
      );
    }

    if (!hasKey(DirectiveCommands, command)) {
      throw new Error(
        getInvalidFenceLineMessage(
          filePath,
          line,
          `Line contains invalid directive command "${command}".`,
        ),
      );
    }

    const parsed = {
      line,
      indices,
      terminus,
      command,
    };

    if (parameters !== undefined) {
      parsed.parameters = parameters.split(',');
    }
    return parsed;
  });

  if (parsedDirectives.length % 2 !== 0) {
    throw new Error(
      getInvalidFenceStructureMessage(
        filePath,
        `A valid fence consists of two fence lines, but the file contains an uneven number, "${parsedDirectives.length}", of fence lines.`,
      ),
    );
  }

  // The below for-loop iterates over the parsed fence directives and performs
  // the following work:
  // - Ensures that the array of parsed directives consists of valid directive
  //   pairs, as specified in the documentation.
  // - For each directive pair, determines whether their fenced lines should be
  //   removed for the current build, and if so, stores the indices we will use
  //   to splice the file content string.

  const splicingIndices = [];
  let shouldSplice = false;
  let currentCommand;

  for (let i = 0; i < parsedDirectives.length; i++) {
    const { line, indices, terminus, command, parameters } = parsedDirectives[
      i
    ];
    if (i % 2 === 0) {
      if (terminus !== DirectiveTerminuses.BEGIN) {
        throw new Error(
          getInvalidFencePairMessage(
            filePath,
            line,
            `The first directive of a pair must be a "BEGIN" directive.`,
          ),
        );
      }

      currentCommand = command;
      // Throws an error if the command parameters are invalid
      CommandValidators[command](parameters, filePath);

      if (parameters.includes(typeOfCurrentBuild)) {
        shouldSplice = false;
      } else {
        shouldSplice = true;
        // Add start index of BEGIN directive line to splicing indices
        splicingIndices.push(indices[0]);
      }
    } else {
      if (terminus !== DirectiveTerminuses.END) {
        throw new Error(
          getInvalidFencePairMessage(
            filePath,
            line,
            `The second directive of a pair must be an "END" directive.`,
          ),
        );
      }

      /* istanbul ignore next: impossible until there's more than one command */
      if (command !== currentCommand) {
        throw new Error(
          getInvalidFencePairMessage(
            filePath,
            line,
            `Expected "END" directive to have command "${currentCommand}" but found "${command}".`,
          ),
        );
      }

      // Forbid empty fences
      const { line: previousLine, indices: previousIndices } = parsedDirectives[
        i - 1
      ];
      if (fileContent.substring(previousIndices[1], indices[0]).trim() === '') {
        throw new Error(
          `Empty fence found in file "${filePath}":\n${previousLine}\n${line}\n`,
        );
      }

      if (shouldSplice) {
        // Add end index of END directive line to splicing indices
        splicingIndices.push(indices[1]);
      }
    }
  }

  // This indicates that the present build type should include all fenced code,
  // and so we just returned the unmodified file contents.
  if (splicingIndices.length === 0) {
    return [fileContent, false];
  }

  /* istanbul ignore next: should be impossible */
  if (splicingIndices.length % 2 !== 0) {
    throw new Error(
      `Internal error while transforming file "${filePath}":\nCollected an uneven number of splicing indices: "${splicingIndices.length}"`,
    );
  }

  return [multiSplice(fileContent, splicingIndices), true];
}

/**
 * Returns a copy of the given string, without the character ranges specified
 * by the splicing indices array.
 *
 * The splicing indices must be a non-empty, even-length array of non-negative
 * integers, specifying the character ranges to remove from the given string, as
 * follows:
 *
 * `[ start, end, start, end, start, end, ... ]`
 *
 * @param {string} toSplice - The string to splice.
 * @param {number[]} splicingIndices - Indices to splice at.
 * @returns {string} The spliced string.
 */
function multiSplice(toSplice, splicingIndices) {
  const retainedSubstrings = [];

  // Get the first part to be included
  // The substring() call returns an empty string if splicingIndices[0] is 0,
  // which is exactly what we want in that case.
  retainedSubstrings.push(toSplice.substring(0, splicingIndices[0]));

  // This loop gets us all parts of the string that should be retained, except
  // the first and the last.
  // It iterates over all "end" indices of the array except the last one, and
  // pushes the substring between each "end" index and the next "begin" index
  // to the array of retained substrings.
  if (splicingIndices.length > 2) {
    // Note the boundary index of "splicingIndices.length - 1". This loop must
    // not iterate over the last element of the array.
    for (let i = 1; i < splicingIndices.length - 1; i += 2) {
      retainedSubstrings.push(
        toSplice.substring(splicingIndices[i], splicingIndices[i + 1]),
      );
    }
  }

  // Get the last part to be included
  retainedSubstrings.push(
    toSplice.substring(splicingIndices[splicingIndices.length - 1]),
  );
  return retainedSubstrings.join('');
}

/**
 * @param {string} filePath - The path to the file that caused the error.
 * @param {string} line - The contents of the line with the error.
 * @param {string} details - An explanation of the error.
 * @returns The error message.
 */
function getInvalidFenceLineMessage(filePath, line, details) {
  return `Invalid fence line in file "${filePath}": "${line}":\n${details}`;
}

/**
 * @param {string} filePath - The path to the file that caused the error.
 * @param {string} details - An explanation of the error.
 * @returns The error message.
 */
function getInvalidFenceStructureMessage(filePath, details) {
  return `Invalid fence structure in file "${filePath}":\n${details}`;
}

/**
 * @param {string} filePath - The path to the file that caused the error.
 * @param {string} line - The contents of the line with the error.
 * @param {string} details - An explanation of the error.
 * @returns The error message.
 */
function getInvalidFencePairMessage(filePath, line, details) {
  return `Invalid fence pair in file "${filePath}" due to line "${line}":\n${details}`;
}

/**
 * @param {string} filePath - The path to the file that caused the error.
 * @param {string} command - The command of the directive with the invalid
 * parameters.
 * @param {string} details - An explanation of the error.
 * @returns The error message.
 */
function getInvalidParamsMessage(filePath, command, details) {
  return `Invalid code fence parameters in file "${filePath}" for command "${command}":\n${details}`;
}
