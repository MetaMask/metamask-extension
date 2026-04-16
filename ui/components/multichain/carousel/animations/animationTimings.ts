// Centralized animation timing configuration
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

// Animation easing functions
export const ANIMATION_EASINGS = {
  EASE_IN_OUT: 'ease-in-out',
  EASE_OUT: 'ease-out',
  CUBIC_BEZIER_SMOOTH: 'cubic-bezier(0.33, 1, 0.68, 1)',
} as const;

// Export for external use
export default ANIMATION_TIMINGS;
