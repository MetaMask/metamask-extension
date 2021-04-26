import * as mockStore from './mock-store';
import * as rendering from './rendering';
import * as background from './background';
import * as MOCKS from './mocks';
import * as CONSTANTS from './constants';

module.exports = {
  ...mockStore,
  ...rendering,
  ...background,
  MOCKS,
  CONSTANTS,
};
