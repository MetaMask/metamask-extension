/* eslint-disable node/shebang */
const path = require('path');
const { promises: fs, constants: fsConstants } = require('fs');

async function isWritable(directory) {
  try {
    await fs.access(directory, fsConstants.W_OK);
    return true;
  } catch (error) {
    if (error.code !== 'EACCES') {
      throw error;
    }
    return false;
  }
}

async function getFirstParentDirectoryThatExists(directory) {
  let nextDirectory = directory;
  for (;;) {
    try {
      await fs.access(nextDirectory, fsConstants.F_OK);
      return nextDirectory;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      } else if (nextDirectory === path.dirname(nextDirectory)) {
        throw new Error('Failed to find parent directory that exists');
      }
      nextDirectory = path.dirname(nextDirectory);
    }
  }
}

module.exports = {
  isWritable,
  getFirstParentDirectoryThatExists,
};
