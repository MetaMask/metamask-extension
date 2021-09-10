const path = require('path');
const pump = require('pump');
const through = require('through2');
const { PassThrough } = require('readable-stream');
const { BuildTypes } = require('../utils');

module.exports = {
  createRemoveFencedCodeTransform,
  removeFencedCode,
};

/*
///: BEGIN:ONLY_INCLUDE_IN(flask)
AssetsController: this.assetsController.store,
PluginController: this.pluginController,
///: END:ONLY_INCLUDE_IN
 */

/**
 *
 * @param {string} buildType - The type of the current build.
 */
function createRemoveFencedCodeTransform(buildType) {
  if (!(buildType in BuildTypes)) {
    throw new Error(
      `Metamask build: Code fencing transform received unrecognized build type: "${buildType}"`,
    );
  }

  // The transform is function that receives a file as an argument, and returns
  // duplex stream that applies the transform logic by operating on the file
  // contents as a buffer with a particular encoding (in our case always utf8).
  // "next" is called at the end of the transform operation to inform browserify
  // that it can continue to the next transform.
  return function removeFencedCodeTransform(fileName) {
    if (!['.js', '.cjs', '.mjs'].includes(path.extname(fileName))) {
      return new PassThrough();
    }

    let allBuffers = [];

    return pump(
      // Concatenate all buffers for the current file into a single buffer.
      through(
        function (partialBuffer, _encoding, next) {
          allBuffers.push(partialBuffer);
          next();
        },
        function (end) {
          this.push(Buffer.concat(allBuffers));
          allBuffers = null;
          end();
        },
      ),
      // Apply the transform
      through(function (fileBuffer, _encoding, next) {
        this.push(
          removeFencedCode(fileName, buildType, fileBuffer.toString('utf8')),
        );
        next();
      }),
      // Handle errors from either through stream
      (error) => {
        if (error) {
          console.error(
            `"removeFencedCodeTransform" encountered an error: ${error.message}`,
          );
          throw error;
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
  [DirectiveCommands.ONLY_INCLUDE_IN]: (params, fileName) => {
    params.forEach((param) => {
      if (!(param in BuildTypes)) {
        throw new Error(
          `Invalid code fence parameters in file "${fileName}" for command "${DirectiveCommands.ONLY_INCLUDE_IN}": "${param}" is not a valid build type.`,
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

/**
 * @param {string} fileContents - The contents of the current file.
 * @returns
 */
function removeFencedCode(fileName, typeOfCurrentBuild, fileContents) {
  const matchedLines = [...fileContents.matchAll(linesWithFenceRegex)];
  // console.log('MATCHED LINES', matchedLines)

  // If we didn't match any lines, return the unmodified file contents.
  if (matchedLines.length === 0) {
    return fileContents;
  }

  // Parse fence lines
  const parsedDirectives = matchedLines.map((matchArray) => {
    const line = matchArray[0];

    if (!fenceSentinelRegex.test(line)) {
      throw new Error(
        getInvalidFenceLineMessage(
          fileName,
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
          fileName,
          line,
          `Fence sentinel must be followed by a single space and an alphabetical string of two or more characters.`,
        ),
      );
    }

    const directiveMatches = unfencedLine.trim().match(directiveParsingRegex);
    if (!directiveMatches) {
      throw new Error(
        getInvalidFenceLineMessage(
          fileName,
          line,
          `Failed to parse fence directive.`,
        ),
      );
    }

    const [, terminus, command, parameters] = directiveMatches;

    if (!(terminus in DirectiveTerminuses)) {
      throw new Error(
        getInvalidFenceLineMessage(
          fileName,
          line,
          `Line contains invalid directive terminus "${terminus}".`,
        ),
      );
    }
    if (!(command in DirectiveCommands)) {
      throw new Error(
        getInvalidFenceLineMessage(
          fileName,
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
        fileName,
        `A valid fence consists of a "BEGIN" and "END" directive pair, but the file contains an uneven number of directives.`,
      ),
    );
  }

  const splicingIndices = [];
  let currentCommand;
  let shouldRemove = false;

  for (let i = 0; i < parsedDirectives.length; i++) {
    const { line, indices, terminus, command, parameters } = parsedDirectives[
      i
    ];
    if (i % 2 === 0) {
      if (terminus !== DirectiveTerminuses.BEGIN) {
        throw new Error(
          getInvalidFencePairMessage(
            fileName,
            line,
            `The first directive of a pair must be a "BEGIN" directive.`,
          ),
        );
      }

      currentCommand = command;
      // Throws an error if the command parameters are invalid
      CommandValidators[command](parameters, fileName);

      if (parameters.includes(typeOfCurrentBuild)) {
        shouldRemove = false;
      } else {
        shouldRemove = true;
        // Add start index of BEGIN directive line to splicing indices
        splicingIndices.push(indices[0]);
      }
    } else {
      if (terminus !== DirectiveTerminuses.END) {
        throw new Error(
          getInvalidFencePairMessage(
            fileName,
            line,
            `The second directive of a pair must be an "END" directive.`,
          ),
        );
      }

      if (command !== currentCommand) {
        throw new Error(
          getInvalidFencePairMessage(
            fileName,
            line,
            `Expected "END" directive to have command "${currentCommand}" but found "${command}".`,
          ),
        );
      }

      if (shouldRemove) {
        // Add end index of END directive line to splicing indices
        splicingIndices.push(indices[1]);
      }
    }
  }

  return multiSplice(fileContents, splicingIndices);
}

/**
 *
 * @param {string} string - The string to splice.
 * @param {number[]} splicingIndices - Indices to splice.
 * @returns {string} The spliced string.
 */
function multiSplice(string, splicingIndices) {
  const parts = [];

  // Get the first part to be included
  // The substring() call returns an empty string if splicingIndices[0] is 0,
  // which is exactly what we want in that case.
  parts.push(string.substring(0, splicingIndices[0]));

  // This loop gets us all the parts that should be included except the first
  // and the last
  for (let i = 2; i < splicingIndices.length; i += 2) {
    parts.push(string.substring(splicingIndices[i - 1], splicingIndices[i]));
  }

  // Get the last part to be included
  parts.push(string.substring(splicingIndices[splicingIndices.length - 1]));
  return parts.join('');
}

/**
 * @param {string} fileName - The name of the file with the error.
 * @param {string} line - The contents of the line with the error.
 * @param {string} details - An explanation of the error.
 * @returns The error message.
 */
function getInvalidFenceLineMessage(fileName, line, details) {
  return `Invalid fence line in file "${fileName}": "${line}":\n${details}`;
}

/**
 * @param {string} fileName - The name of the file with the error.
 * @param {string} details - An explanation of the error.
 * @returns The error message.
 */
function getInvalidFenceStructureMessage(fileName, details) {
  return `Invalid fence structure in file "${fileName}":\n${details}`;
}

/**
 * @param {string} fileName - The name of the file with the error.
 * @param {string} line - The contents of the line with the error.
 * @param {string} details - An explanation of the error.
 * @returns The error message.
 */
function getInvalidFencePairMessage(fileName, line, details) {
  return `Invalid fence pair in file "${fileName}" due to line "${line}":\n${details}`;
}
