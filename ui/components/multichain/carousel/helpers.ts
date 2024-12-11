import { MARGIN_VALUES, WIDTH_VALUES } from './constants';

export function getSlideMargin(index: number, totalSlides: number) {
  // Single slide case
  if (totalSlides === 1) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`;
  }

  // Two slides case
  if (totalSlides === 2) {
    return index === 0
      ? `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.INNER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`
      : `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.INNER_EDGE}`;
  }

  // Three or more slides case
  if (index === 0) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.NONE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.OUTER_EDGE}`;
  }
  if (index === totalSlides - 1) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.NONE}`;
  }
  return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.INNER_EDGE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.INNER_EDGE}`;
}

export function getSlideWidth(totalSlides: number) {
  return totalSlides === 1
    ? WIDTH_VALUES.SINGLE_SLIDE
    : WIDTH_VALUES.MULTIPLE_SLIDES;
}

export function getCenterSlidePercentage(totalSlides: number) {
  return totalSlides === 1 ? 92 : 90;
}
