import { showSnapAccountExperimentalToggle } from './snap-accounts';

describe('showSnapAccountExperimentalToggle', () => {
  beforeEach(() => {
    process.env = Object.assign(process.env, {
      KEYRING_SNAPS_AVAILABILITY_DATE: '02 Nov 2023 15:00:00 GMT',
    });
  });

  afterEach(() => {
    delete process.env.KEYRING_SNAPS_AVAILABILITY_DATE;
  });

  it('returns false if the current date is before November 2, 2023', () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2023, 9, 31, 5)));
    expect(showSnapAccountExperimentalToggle()).toBe(false);
  });

  it('returns true if the current date is after November 2, 2023', () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2023, 10, 3, 5)));
    expect(showSnapAccountExperimentalToggle()).toBe(true);
  });
});
