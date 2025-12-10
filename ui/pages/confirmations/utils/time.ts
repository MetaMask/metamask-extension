import humanizeDuration, { Options } from 'humanize-duration';

const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      m: () => 'min',
      s: () => 'sec',
    },
  },
});

const withoutUnitHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      m: () => '',
      s: () => '',
    },
  },
});

export const toHumanEstimatedTimeRange = (min: number, max: number) => {
  if (!min || !max) {
    return undefined;
  }

  // Determine if we should show in minutes or seconds
  const minInSeconds = min / 1000;
  const maxInSeconds = max / 1000;
  const useMinutes = maxInSeconds >= 60;

  const options = {
    units: useMinutes ? ['m'] : ['s'],
    round: false,
    spacer: ' ',
    decimal: '.',
    maxDecimalPoints: 1,
  } as Options;

  // Handle edge case for values close to a minute
  const adjustedMin =
    useMinutes && minInSeconds >= 59 && minInSeconds < 60 ? 60000 : min;

  return `${withoutUnitHumanizer(adjustedMin, options)}- ${shortEnglishHumanizer(max, options)}`;
};

export const toHumanSeconds = (milliseconds: number): string => {
  const options = {
    units: ['s'],
    round: false,
    spacer: ' ',
    decimal: '.',
    maxDecimalPoints: 0,
  } as Options;

  return shortEnglishHumanizer(milliseconds, options);
};
