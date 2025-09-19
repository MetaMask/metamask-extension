// Animation Timing Constants
export const ANIMATION_TIMINGS = {
  // Card transition timings (slowed by 50ms)
  CARD_TRANSITION_DURATION: 400,
  CARD_EXIT_DURATION: 300,
  CARD_ENTER_DURATION: 250,
  CARD_ENTER_DELAY: 100,

  // Empty state timings
  EMPTY_STATE_IDLE_TIME: 1000, // 1 second pause before fold
  EMPTY_STATE_DURATION: 350, // Total fold animation duration
  EMPTY_STATE_FADE_DURATION: 200,
  EMPTY_STATE_FOLD_DURATION: 300,

  // Carousel fold animation
  CAROUSEL_FOLD_DURATION: 350,
} as const;

// Layout Constants
export const LAYOUT_CONSTANTS = {
  CONTAINER_HEIGHT: 106, // BANNER_HEIGHT + 6px
  CARD_HEIGHT: 100, // BANNER_HEIGHT
  IMAGE_SIZE: 76, // Image width and height
  CARD_PADDING_HORIZONTAL: 16,
  CARD_PADDING_VERTICAL: 12,
  IMAGE_TEXT_GAP: 16,
  TEXT_HEADER_GAP: 8,
  TEXT_BODY_MARGIN_TOP: 4,
} as const;

// Z-Index Values
export const Z_INDEX = {
  NEXT_CARD: 1,
  CURRENT_CARD: 2,
  EXITING_CARD: 3,
} as const;

// Scale Values for Animations
export const SCALE_VALUES = {
  CURRENT_CARD: 1,
  NEXT_CARD: 0.95,
  EXIT_CARD: 1.015,
} as const;

// Max slides allowed
export const MAX_SLIDES = 8;
