const {
  FULL_SCREEN_DESIGN_MIN_WIDTH,
} = require('../../../shared/constants/layout');

// Wide enough for the fullscreen design to apply whenever its feature flag is
// on, so that the flag alone decides which layout a test runs in.
const DEFAULT_WINDOW_SIZE = {
  width: FULL_SCREEN_DESIGN_MIN_WIDTH + 100,
  height: 1080,
};

// Used by tests that need the narrow (popup-like) layout.
const CONSTRAINED_WINDOW_SIZE = { width: 320, height: 600 };

module.exports = { DEFAULT_WINDOW_SIZE, CONSTRAINED_WINDOW_SIZE };
