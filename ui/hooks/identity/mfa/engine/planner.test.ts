import {
  MFA_CREDENTIAL_TYPES,
  type EnrolledCredential,
} from '@metamask/profile-sync-controller/sdk';
import {
  getEnrollmentMaxSessionAgeMs,
  getMethodStatuses,
  planEnroll,
  planVerifyOrEnroll,
} from './planner';
import type { PlanContext, VerifyOrEnrollRequest } from './types';

const NOW = 1_800_000_000_000;
const SECOND = 1000;
const MINUTE = 60 * SECOND;

const passkey: EnrolledCredential = { type: 'passkey', status: 'active' };
const email: EnrolledCredential = {
  type: 'email_otp',
  status: 'active',
  email: 'a@b.co',
  verified: true,
};
const providerEmail: EnrolledCredential = {
  type: 'email_otp',
  status: 'active',
  verified: true,
};
const pendingEmail: EnrolledCredential = {
  type: 'email_otp',
  status: 'pending',
  email: 'pending@b.co',
  verified: false,
};

const KALSHI: VerifyOrEnrollRequest = {
  methods: ['email_otp', 'passkey'],
  verifyWith: 'passkey',
};

const buildContext = (overrides: Partial<PlanContext> = {}): PlanContext => ({
  platform: 'mobile',
  credentials: [],
  session: null,
  flowStartedAt: NOW - SECOND,
  now: NOW,
  introShown: false,
  ...overrides,
});

describe('getMethodStatuses', () => {
  it('ranks every credential type the controller knows', () => {
    expect(Object.keys(getMethodStatuses([], 'mobile')).sort()).toStrictEqual(
      [...MFA_CREDENTIAL_TYPES].sort(),
    );
  });

  it('offers every method to a profile with nothing set up on mobile', () => {
    const statuses = getMethodStatuses([], 'mobile');

    expect(statuses.passkey).toMatchObject({
      isActive: false,
      canVerify: false,
      canEnroll: true,
    });
    expect(statuses.email_otp).toMatchObject({
      isActive: false,
      canVerify: false,
      canEnroll: true,
    });
  });

  it('lets an active passkey be verified and another one added', () => {
    expect(getMethodStatuses([passkey], 'mobile').passkey).toStrictEqual({
      method: 'passkey',
      isActive: true,
      canVerify: true,
      canEnroll: true,
      pendingEmail: undefined,
      credentials: [passkey],
    });
  });

  it('blocks a second email once one is active', () => {
    expect(getMethodStatuses([email], 'mobile').email_otp).toMatchObject({
      isActive: true,
      canVerify: true,
      canEnroll: false,
    });
  });

  it('treats a provider-backed email with no address as active', () => {
    expect(
      getMethodStatuses([providerEmail], 'mobile').email_otp,
    ).toMatchObject({ isActive: true, canVerify: true, canEnroll: false });
  });

  it('treats a pending email as not set up and keeps its address', () => {
    expect(getMethodStatuses([pendingEmail], 'mobile').email_otp).toMatchObject(
      {
        isActive: false,
        canVerify: false,
        canEnroll: true,
        pendingEmail: 'pending@b.co',
      },
    );
  });

  it('keeps passkeys listed on the extension but unusable there', () => {
    expect(getMethodStatuses([passkey], 'extension').passkey).toMatchObject({
      isActive: true,
      canVerify: false,
      canEnroll: false,
    });
  });
});

describe('planVerifyOrEnroll', () => {
  it('sets up email then the passkey for a profile with nothing, so the passkey setup is the proof', () => {
    expect(planVerifyOrEnroll(KALSHI, buildContext())).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'intro', missing: ['email_otp', 'passkey'] },
        { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
        { kind: 'setup', method: 'passkey', prefillEmail: undefined },
      ],
    });
  });

  it('confirms with the provider email before the first passkey, whose setup is the proof', () => {
    expect(
      planVerifyOrEnroll(
        KALSHI,
        buildContext({ credentials: [providerEmail] }),
      ),
    ).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'intro', missing: ['passkey'] },
        { kind: 'confirm', options: ['email_otp'] },
        { kind: 'setup', method: 'passkey', prefillEmail: undefined },
      ],
    });
  });

  it('keeps the cost order among the verifyWith methods', () => {
    expect(
      planVerifyOrEnroll(
        { ...KALSHI, verifyWith: ['email_otp', 'passkey'] },
        buildContext(),
      ),
    ).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'intro', missing: ['passkey', 'email_otp'] },
        { kind: 'setup', method: 'passkey', prefillEmail: undefined },
        { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
      ],
    });
  });

  it('verifies with the passkey again after adding email, whose setup replaced the session', () => {
    const context = buildContext({ credentials: [passkey], introShown: true });

    expect(planVerifyOrEnroll(KALSHI, context)).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'confirm', options: ['passkey'] },
        { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
        { kind: 'verify', options: ['passkey'] },
      ],
    });
  });

  it('returns no steps when everything is set up and a matching session is live', () => {
    const context = buildContext({
      credentials: [passkey, email],
      session: { obtainedAt: NOW - 10 * MINUTE, amr: ['passkey'] },
    });

    expect(planVerifyOrEnroll(KALSHI, context)).toStrictEqual({
      ok: true,
      steps: [],
    });
  });

  it('verifies when everything is set up and no session is live', () => {
    expect(
      planVerifyOrEnroll(
        KALSHI,
        buildContext({ credentials: [passkey, email] }),
      ),
    ).toStrictEqual({
      ok: true,
      steps: [{ kind: 'verify', options: ['passkey'] }],
    });
  });

  it('verifies when the live session was proven with another method', () => {
    const context = buildContext({
      credentials: [passkey, email],
      session: { obtainedAt: NOW - SECOND, amr: ['email_otp'] },
    });

    expect(planVerifyOrEnroll(KALSHI, context)).toStrictEqual({
      ok: true,
      steps: [{ kind: 'verify', options: ['passkey'] }],
    });
  });

  it('verifies when the live session is older than the requested maximum age', () => {
    const context = buildContext({
      credentials: [passkey, email],
      session: { obtainedAt: NOW - 5 * MINUTE, amr: ['passkey'] },
    });

    expect(
      planVerifyOrEnroll({ ...KALSHI, maxSessionAgeMs: 5 * MINUTE }, context),
    ).toStrictEqual({
      ok: true,
      steps: [{ kind: 'verify', options: ['passkey'] }],
    });
  });

  it('accepts a session proven during this flow whatever the maximum age', () => {
    const context = buildContext({
      credentials: [passkey, email],
      session: { obtainedAt: NOW - 10, amr: ['passkey'] },
    });

    expect(
      planVerifyOrEnroll({ ...KALSHI, maxSessionAgeMs: 0 }, context),
    ).toStrictEqual({ ok: true, steps: [] });
  });

  it('offers every accepted method, cheapest first, when verifyWith is a list', () => {
    const context = buildContext({ credentials: [email, passkey] });

    expect(
      planVerifyOrEnroll(
        { ...KALSHI, verifyWith: ['email_otp', 'passkey'] },
        context,
      ),
    ).toStrictEqual({
      ok: true,
      steps: [{ kind: 'verify', options: ['passkey', 'email_otp'] }],
    });
  });

  it('only sets up methods when verifyWith is omitted', () => {
    expect(
      planVerifyOrEnroll({ methods: ['email_otp'] }, buildContext()),
    ).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'intro', missing: ['email_otp'] },
        { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
      ],
    });
  });

  it('does not repeat the intro once it was shown', () => {
    expect(
      planVerifyOrEnroll(
        { methods: ['email_otp'] },
        buildContext({ introShown: true }),
      ),
    ).toStrictEqual({
      ok: true,
      steps: [{ kind: 'setup', method: 'email_otp', prefillEmail: undefined }],
    });
  });
  it('treats a pending email as missing and prefills its address', () => {
    expect(
      planVerifyOrEnroll(
        { methods: ['email_otp'] },
        buildContext({ credentials: [pendingEmail] }),
      ),
    ).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'intro', missing: ['email_otp'] },
        { kind: 'setup', method: 'email_otp', prefillEmail: 'pending@b.co' },
      ],
    });
  });

  describe('confirming before adding a factor', () => {
    const request: VerifyOrEnrollRequest = { methods: ['email_otp'] };

    it('skips the confirmation when the session was proven during this flow', () => {
      const context = buildContext({
        credentials: [passkey],
        flowStartedAt: NOW - 10 * MINUTE,
        session: { obtainedAt: NOW - 5 * MINUTE, amr: ['passkey'] },
        introShown: true,
      });

      expect(planVerifyOrEnroll(request, context)).toStrictEqual({
        ok: true,
        steps: [
          { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
        ],
      });
    });

    it('skips the confirmation when the session is under 2 minutes old', () => {
      const context = buildContext({
        credentials: [passkey],
        session: { obtainedAt: NOW - 90 * SECOND, amr: ['passkey'] },
        introShown: true,
      });

      expect(planVerifyOrEnroll(request, context)).toStrictEqual({
        ok: true,
        steps: [
          { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
        ],
      });
    });

    it('confirms when the session predates the flow and is 2 minutes old', () => {
      const context = buildContext({
        credentials: [passkey],
        session: { obtainedAt: NOW - 2 * MINUTE, amr: ['passkey'] },
        introShown: true,
      });

      expect(planVerifyOrEnroll(request, context)).toStrictEqual({
        ok: true,
        steps: [
          { kind: 'confirm', options: ['passkey'] },
          { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
        ],
      });
    });

    it('offers every active method, cheapest first', () => {
      const context = buildContext({
        credentials: [email, passkey],
        introShown: true,
      });

      expect(planEnroll('passkey', context)).toStrictEqual({
        ok: true,
        steps: [
          { kind: 'confirm', options: ['passkey', 'email_otp'] },
          { kind: 'setup', method: 'passkey', prefillEmail: undefined },
        ],
      });
    });
  });

  describe('rejections', () => {
    it('rejects a verifyWith method missing from methods', () => {
      expect(
        planVerifyOrEnroll(
          { methods: ['email_otp'], verifyWith: 'passkey' },
          buildContext(),
        ),
      ).toStrictEqual({ ok: false, code: 'invalid_request' });
    });

    it('rejects a passkey setup on the extension', () => {
      expect(
        planVerifyOrEnroll(KALSHI, buildContext({ platform: 'extension' })),
      ).toStrictEqual({ ok: false, code: 'passkey_unsupported' });
    });

    it('rejects a passkey verification on the extension', () => {
      const context = buildContext({
        platform: 'extension',
        credentials: [passkey, email],
      });

      expect(planVerifyOrEnroll(KALSHI, context)).toStrictEqual({
        ok: false,
        code: 'passkey_unsupported',
      });
    });

    it('rejects adding email on the extension when only a passkey could confirm it', () => {
      const context = buildContext({
        platform: 'extension',
        credentials: [passkey],
      });

      expect(
        planVerifyOrEnroll({ methods: ['email_otp'] }, context),
      ).toStrictEqual({ ok: false, code: 'passkey_unsupported' });
    });
  });

  it('plans an email-only flow on the extension, whose setup is the proof', () => {
    expect(
      planVerifyOrEnroll(
        { methods: ['email_otp'], verifyWith: 'email_otp' },
        buildContext({ platform: 'extension' }),
      ),
    ).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'intro', missing: ['email_otp'] },
        { kind: 'setup', method: 'email_otp', prefillEmail: undefined },
      ],
    });
  });
});

describe('planEnroll', () => {
  it('sets up the first method without confirming', () => {
    expect(planEnroll('passkey', buildContext())).toStrictEqual({
      ok: true,
      steps: [{ kind: 'setup', method: 'passkey', prefillEmail: undefined }],
    });
  });

  it('confirms before adding another passkey', () => {
    expect(
      planEnroll('passkey', buildContext({ credentials: [passkey] })),
    ).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'confirm', options: ['passkey'] },
        { kind: 'setup', method: 'passkey', prefillEmail: undefined },
      ],
    });
  });

  it('prefills a pending email', () => {
    expect(
      planEnroll('email_otp', buildContext({ credentials: [pendingEmail] })),
    ).toStrictEqual({
      ok: true,
      steps: [
        { kind: 'setup', method: 'email_otp', prefillEmail: 'pending@b.co' },
      ],
    });
  });

  it('rejects a second email', () => {
    expect(
      planEnroll('email_otp', buildContext({ credentials: [email] })),
    ).toStrictEqual({ ok: false, code: 'email_already_enrolled' });
  });

  it('rejects a passkey on the extension', () => {
    expect(
      planEnroll('passkey', buildContext({ platform: 'extension' })),
    ).toStrictEqual({ ok: false, code: 'passkey_unsupported' });
  });
});

describe('getEnrollmentMaxSessionAgeMs', () => {
  it('uses 2 minutes early in a flow', () => {
    expect(getEnrollmentMaxSessionAgeMs(NOW - SECOND, NOW)).toBe(2 * MINUTE);
  });

  it('covers the whole flow once it lasts longer than 2 minutes', () => {
    expect(getEnrollmentMaxSessionAgeMs(NOW - 10 * MINUTE, NOW)).toBe(
      10 * MINUTE,
    );
  });
});
