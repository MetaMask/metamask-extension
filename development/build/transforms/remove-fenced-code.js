const path = require('path');
const through = require('through2');
const { PassThrough } = require('readable-stream');
const { BuildTypes } = require('../utils');
const { lintTransformedFile } = require('./utils');

/**
 * @typedef {import('readable-stream').Duplex} Duplex
 */

module.exports = {
  createRemoveFencedCodeTransform,
  removeFencedCode,
};

/**
 * @param {string} buildType - The type of the current build.
 * @returns {(filePath: string) => Duplex} The transform function.
 */
function createRemoveFencedCodeTransform(buildType) {
  if (!(buildType in BuildTypes)) {
    throw new Error(
      `Metamask build: Code fencing transform received unrecognized build type "${buildType}".`,
    );
  }

  // Browserify transforms are functions that receive a file name and return a
  // duplex stream. The stream receives the file contents piecemeal in the form
  // of Buffers.
  // To apply our code fencing transform, we concatenate all buffers and convert
  // them to a single string, then apply the actual transform function on that
  // string.
  /**
   * @returns {Duplex}
   */
  return function removeFencedCodeTransform(filePath) {
    if (!['.js', '.cjs', '.mjs'].includes(path.extname(filePath))) {
      return new PassThrough();
    }

    const fileBuffers = [];

    return through(
      // This function is called whenever data is written to the stream.
      // It concatenates all buffers for the current file into a single buffer.
      function (fileBuffer, _encoding, next) {
        fileBuffers.push(fileBuffer);
        next();
      },

      // This "flush" function is called when all data has been written to the
      // stream, immediately before the "end" event is emitted.
      // It applies the transform to the concatenated file contents.
      function (end) {
        const [fileContent, didModify] = removeFencedCode(
          filePath,
          buildType,
          Buffer.concat(fileBuffers).toString('utf8'),
        );

        const _end = () => {
          this.push(fileContent);
          end();
        };

        if (didModify) {
          lintTransformedFile(fileContent, filePath)
            .then(_end)
            .catch((error) => this.destroy(error));
        } else {
          _end();
        }
      },
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
    params.forEach((param) => {
      if (!(param in BuildTypes)) {
        throw new Error(
          `Invalid code fence parameters in file "${filePath}" for command "${DirectiveCommands.ONLY_INCLUDE_IN}": "${param}" is not a valid build type.`,
        );
      }
    });
  },
};

// Matches lines starting with "///:", optionally preceded by whitespace
const linesWithFenceRegex = /^.*\/\/\/:.*$/gmu;

// Matches the first "///:" in a string
const fenceSentinelRegex = /^\s*\/\/\/:/u;

// Breaks a fence directive into its constituent components
// At this stage of parsing, we are looking for one of:
// - TERMINUS:COMMAND(PARAMS)
// - TERMINUS:COMMAND
const directiveParsingRegex = /^([A-Z]+):([A-Z_]+)(?:\(([\w,]+)\))?$/u;

/*
///: BEGIN:ONLY_INCLUDE_IN(flask)
AssetsController: this.assetsController.store,
PluginController: this.pluginController,
///: END:ONLY_INCLUDE_IN
 */

/**
 * @param {string} filePath - The path to the file being transformed.
 * @param {string} typeOfCurrentBuild - The type of the current build process.
 * @param {string} fileContent - The contents of the file being transformed.
 * @returns {[string, modified]} A tuple of the post-transform file contents and
 * a boolean indicating whether they were modified.
 */
function removeFencedCode(filePath, typeOfCurrentBuild, fileContent) {
  const matchedLines = [...fileContent.matchAll(linesWithFenceRegex)];

  // If we didn't match any lines, return the unmodified file contents.
  if (matchedLines.length === 0) {
    return [fileContent, false];
  }

  // Parse fence lines
  const parsedDirectives = matchedLines.map((matchArray) => {
    const line = matchArray[0];

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
    // performing string operations
    const indices = [matchArray.index, matchArray.index + line.length + 1];

    const unfencedLine = line.replace(fenceSentinelRegex, '');
    if (!/^ \w\w+/u.test(unfencedLine)) {
      throw new Error(
        getInvalidFenceLineMessage(
          filePath,
          line,
          `Fence sentinel must be followed by a single space and an alphabetical string of two or more characters.`,
        ),
      );
    }

    const directiveMatches = unfencedLine.trim().match(directiveParsingRegex);
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

    if (!(terminus in DirectiveTerminuses)) {
      throw new Error(
        getInvalidFenceLineMessage(
          filePath,
          line,
          `Line contains invalid directive terminus "${terminus}".`,
        ),
      );
    }
    if (!(command in DirectiveCommands)) {
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
        `A valid fence consists of two fence lines, but the file contains an uneven number of fence lines.`,
      ),
    );
  }

  // The below for-loop iterates over the parsed fence directives and performs
  // the following work:
  // - Ensures that the array of parsed directives consist of valid directive
  //   pairs, as specified in the README
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
      `MetaMask build: Internal error while transforming file "${filePath}":\nCollected an uneven number of splicing indices: "${splicingIndices.length}"`,
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
 * follows: [ start, end, start, end, start, end, ... ]
 *
 * @param {string} string - The string to splice.
 * @param {number[]} splicingIndices - Indices to splice at.
 * @returns {string} The spliced string.
 */
function multiSplice(string, splicingIndices) {
  const retainedParts = [];

  // Get the first part to be included
  // The substring() call returns an empty string if splicingIndices[0] is 0,
  // which is exactly what we want in that case.
  retainedParts.push(string.substring(0, splicingIndices[0]));

  // This loop gets us all parts of the string that should be retained, except
  // the first and the last
  for (let i = 2; i < splicingIndices.length; i += 2) {
    retainedParts.push(
      string.substring(splicingIndices[i - 1], splicingIndices[i]),
    );
  }

  // Get the last part to be included
  retainedParts.push(
    string.substring(splicingIndices[splicingIndices.length - 1]),
  );
  return retainedParts.join('');
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
