import { MARGIN_VALUES, WIDTH_VALUES } from './constants';

export function getSlideMargin(index: number, totalSlides: number) {
  // Single slide case
  if (totalSlides === 1) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.OUTER_EDGE}`;
  }

  // Three or more slides case
  if (index === 0) {
    return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.NONE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.INNER_EDGE}`;
  }
  return `${MARGIN_VALUES.NONE} ${MARGIN_VALUES.NONE} ${MARGIN_VALUES.BOTTOM} ${MARGIN_VALUES.NONE}`;
}

export function getSlideWidth(index: number, totalSlides: number) {
  if (totalSlides === 1) {
    return WIDTH_VALUES.SINGLE_SLIDE;
  }

  if (index === 0) {
    return WIDTH_VALUES.MULTIPLE_SLIDES_BORDER;
  }

  return WIDTH_VALUES.MULTIPLE_SLIDES_CENTER;
}

export function getCenterSlidePercentage(totalSlides: number) {
  return totalSlides === 1 ? 100 : 90;
}
