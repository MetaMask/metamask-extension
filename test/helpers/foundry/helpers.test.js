/* global jest */

export const Platform = {
  Windows: 'windows',
  Linux: 'linux',
  Darwin: 'darwin',
};

export const BinFormat = {
  Tar: 'tar',
  Zip: 'zip',
};

export const extractFrom = jest.fn();
export const getVersion = jest.fn();
export const parseArgs = jest.fn();
