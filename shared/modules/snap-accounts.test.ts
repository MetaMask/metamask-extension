import { showSnapAccountExperimentalToggle } from './snap-accounts';

describe('showSnapAccountExperimentalToggle', () => {
  it('returns false if the current date is before November 2, 2023', () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2023, 9, 31, 5)));
    expect(showSnapAccountExperimentalToggle()).toBe(false);
  });

  it('returns true if the current date is after November 2, 2023', () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2023, 10, 3, 5)));
    expect(showSnapAccountExperimentalToggle()).toBe(true);
  });
});
