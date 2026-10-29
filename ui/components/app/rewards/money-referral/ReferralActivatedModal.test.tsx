import { fillInviteAcceptedBodyDate } from './ReferralActivatedModal';

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

describe('fillInviteAcceptedBodyDate', () => {
  it('fills the cashback window from start through end', () => {
    expect(
      fillInviteAcceptedBodyDate(
        'Earn up to 10% {date}.',
        'Invite body',
        '2026-09-01T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        formatDate,
      ),
    ).toBe('Earn up to 10% from 2026-09-01 through 2026-12-01.');
  });

  it('uses the fallback when either date is missing or invalid', () => {
    expect(
      fillInviteAcceptedBodyDate(
        'Earn {date}.',
        'Invite body',
        '2026-09-01T00:00:00.000Z',
        null,
        formatDate,
      ),
    ).toBe('Invite body');
    expect(
      fillInviteAcceptedBodyDate(
        'Earn {date}.',
        'Invite body',
        'not-a-date',
        '2026-12-01T00:00:00.000Z',
        formatDate,
      ),
    ).toBe('Invite body');
  });

  it('leaves a template that has no date placeholder unchanged', () => {
    expect(
      fillInviteAcceptedBodyDate(
        'Earn up to 10%.',
        'Invite body',
        '2026-09-01T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        formatDate,
      ),
    ).toBe('Earn up to 10%.');
  });
});
