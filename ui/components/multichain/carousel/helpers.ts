import { MARGIN_VALUES, WIDTH_VALUES } from './constants';

export function getSlideMargin(index: number, totalSlides: number) {
  // Single slide case
  if (totalSlides === 1) {
    return `${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.CONTAINER_SIDE}`;
  }

  // Three or more slides case
  if (index === 0) {
    return `${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.SLIDE_BOTTOM} ${MARGIN_VALUES.CONTAINER_SIDE}`;
  }
  return `${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.ZERO} ${MARGIN_VALUES.SLIDE_BOTTOM} ${MARGIN_VALUES.ZERO}`;
}

export function getSlideWidth(index: number, totalSlides: number) {
  if (totalSlides === 1) {
    return `calc(${WIDTH_VALUES.FULL_WIDTH} - 32px)`;
  }

  if (index === 0) {
    return `calc(${WIDTH_VALUES.STANDARD_SLIDE} - ${MARGIN_VALUES.CONTAINER_SIDE})`;
  }

  return WIDTH_VALUES.STANDARD_SLIDE;
}

export function getCenterSlidePercentage(totalSlides: number) {
  return totalSlides === 1 ? 100 : 90;
}
