import { SolAccountType } from '@metamask/keyring-api';
import type { CarouselSlide } from '../../../../shared/constants/app-state';
import { MAX_SLIDES } from './constants';
import { getVisibleCarouselSlides } from './utils';

function createSlide(
  id: string,
  overrides: Partial<CarouselSlide> = {},
): CarouselSlide {
  return {
    id,
    title: id,
    description: id,
    image: `${id}.png`,
    ...overrides,
  };
}

describe('getVisibleCarouselSlides', () => {
  it('excludes dismissed slides', () => {
    expect(
      getVisibleCarouselSlides([
        createSlide('visible'),
        createSlide('dismissed', { dismissed: true }),
      ]),
    ).toStrictEqual([createSlide('visible')]);
  });

  it('excludes the Solana slide for a Solana data account', () => {
    expect(
      getVisibleCarouselSlides(
        [
          createSlide('solana', { variableName: 'solana' }),
          createSlide('other'),
        ],
        SolAccountType.DataAccount,
      ),
    ).toStrictEqual([createSlide('other')]);
  });

  it('limits visible slides', () => {
    const slides = Array.from({ length: MAX_SLIDES + 2 }, (_, index) =>
      createSlide(`slide-${index}`),
    );

    expect(getVisibleCarouselSlides(slides)).toStrictEqual(
      slides.slice(0, MAX_SLIDES),
    );
  });
});
