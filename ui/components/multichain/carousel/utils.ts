import { SolAccountType } from '@metamask/keyring-api';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import { MAX_SLIDES } from './constants';

export function getVisibleCarouselSlides(
  slides: CarouselSlide[],
  selectedAccountType?: string,
): CarouselSlide[] {
  return slides
    .filter((slide) => {
      if (
        slide.variableName === 'solana' &&
        selectedAccountType === SolAccountType.DataAccount
      ) {
        return false;
      }
      return !slide.dismissed;
    })
    .slice(0, MAX_SLIDES);
}
