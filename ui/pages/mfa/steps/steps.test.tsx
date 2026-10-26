import React from 'react';
import { it } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import type {
  MfaFlowErrorCode,
  MfaFlowState,
  MfaFlowStep,
  MfaReason,
} from '../../../hooks/identity/mfa/engine/types';
import { MfaFlowTestIds } from '../test-ids';
import CodeStep from './code-step';
import EmailEntryStep from './email-entry-step';
import FailureStep from './failure-step';
import IntroStep from './intro-step';
import PasskeyStep from './passkey-step';
import PickerStep from './picker-step';
import TotpSetupStep from './totp-setup-step';

const mockCopy = jest.fn();
const mockUseCopyToClipboard = jest.fn();
let mockIsCopied = false;
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: (...args: unknown[]) => {
    mockUseCopyToClipboard(...args);
    return [mockIsCopied, mockCopy];
  },
}));

const reason = { operation: 'test' };

const buildState = <Step extends MfaFlowStep>(
  step: Step,
  extra: Partial<MfaFlowState> = {},
) => ({
  step,
  state: {
    step,
    busy: false,
    progress: { current: 1, total: 1 },
    ...extra,
  },
});

const render = (ui: React.ReactElement) =>
  renderWithProvider(ui, configureMockStore()(mockState));

describe('IntroStep', () => {
  it('lists every requested method, ticks those set up and continues', () => {
    const onAction = jest.fn();
    render(
      <IntroStep
        {...buildState({
          name: 'intro',
          methods: ['email_otp', 'passkey'],
          missing: ['passkey'],
          email: 'chris@metamask.com',
        })}
        reason={{ operation: 'test', enrollDescription: 'Why we ask' }}
        onAction={onAction}
      />,
    );

    expect(screen.getByText('Why we ask')).toBeInTheDocument();
    expect(
      screen.getByTestId(`${MfaFlowTestIds.INTRO_METHOD}-email_otp-done`),
    ).toBeInTheDocument();
    expect(screen.getByText('c•••@metamask.com')).toBeInTheDocument();
    expect(
      screen.getByTestId(`${MfaFlowTestIds.INTRO_METHOD}-passkey`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mfaIntroPasskeyDescription.message),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'continue' });
  });

  it('describes how each missing method works', () => {
    render(
      <IntroStep
        {...buildState({
          name: 'intro',
          methods: ['email_otp', 'passkey'],
          missing: ['email_otp', 'passkey'],
        })}
        reason={reason}
        onAction={jest.fn()}
      />,
    );

    expect(
      screen.getByText(messages.mfaIntroEmailDescription.message),
    ).toBeInTheDocument();
  });

  it('says a set-up passkey is saved, and shows no address for an email it does not know', () => {
    render(
      <IntroStep
        {...buildState({
          name: 'intro',
          methods: ['email_otp', 'passkey'],
          missing: [],
        })}
        reason={reason}
        onAction={jest.fn()}
      />,
    );

    expect(
      screen.getByText(messages.mfaIntroPasskeyDone.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${MfaFlowTestIds.INTRO_METHOD}-email_otp-done`),
    ).toBeInTheDocument();
  });

  it('shows the generic line when the feature gives none', () => {
    render(
      <IntroStep
        {...buildState({
          name: 'intro',
          methods: ['email_otp'],
          missing: ['email_otp'],
        })}
        reason={{ operation: 'test', verifyDescription: 'Not this one' }}
        onAction={jest.fn()}
      />,
    );

    expect(
      screen.getByText(messages.mfaIntroDescription.message),
    ).toBeInTheDocument();
  });
});

describe('PickerStep', () => {
  it('leads with the passkey, then the other methods below an "or"', () => {
    const onAction = jest.fn();
    render(
      <PickerStep
        {...buildState({
          name: 'picker',
          purpose: 'verify',
          options: ['email_otp', 'passkey'],
        })}
        reason={reason}
        onAction={onAction}
      />,
    );

    // The options come email first; the passkey still leads.
    expect(
      screen
        .getAllByText(
          new RegExp(
            `^(${messages.mfaPickerPasskey.message}|${messages.mfaPickerOr.message}|${messages.mfaPickerEmailOtp.message})$`,
            'u',
          ),
        )
        .map((node) => node.textContent),
    ).toStrictEqual([
      messages.mfaPickerPasskey.message,
      messages.mfaPickerOr.message,
      messages.mfaPickerEmailOtp.message,
    ]);
    fireEvent.click(
      screen.getByTestId(`${MfaFlowTestIds.PICKER_OPTION}-passkey`),
    );
    expect(onAction).toHaveBeenCalledWith({
      type: 'choose',
      method: 'passkey',
    });
  });

  it('sends the chosen method', () => {
    const onAction = jest.fn();
    render(
      <PickerStep
        {...buildState({
          name: 'picker',
          purpose: 'verify',
          options: ['passkey', 'email_otp'],
        })}
        reason={reason}
        onAction={onAction}
      />,
    );

    fireEvent.click(
      screen.getByTestId(`${MfaFlowTestIds.PICKER_OPTION}-email_otp`),
    );
    expect(onAction).toHaveBeenCalledWith({
      type: 'choose',
      method: 'email_otp',
    });
  });

  it.each<['verify' | 'confirm', MfaReason, boolean]>([
    [
      'verify',
      { operation: 'test', verifyDescription: 'To send $20.00' },
      true,
    ],
    ['verify', { operation: 'test' }, false],
    [
      'confirm',
      { operation: 'test', verifyDescription: 'To send $20.00' },
      false,
    ],
  ])(
    'shows the feature line only to verify (%s)',
    (purpose, pickerReason, isShown) => {
      render(
        <PickerStep
          {...buildState({
            name: 'picker',
            purpose,
            options: ['passkey', 'email_otp'],
          })}
          reason={pickerReason}
          onAction={jest.fn()}
        />,
      );

      expect(screen.queryByText('To send $20.00') !== null).toBe(isShown);
    },
  );
});

describe('PickerStep with an authenticator app', () => {
  it('offers the authenticator app among the other methods', () => {
    const onAction = jest.fn();
    render(
      <PickerStep
        {...buildState({
          name: 'picker',
          purpose: 'verify',
          options: ['totp', 'email_otp'],
        })}
        reason={reason}
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByText(messages.mfaPickerTotp.message));
    expect(onAction).toHaveBeenCalledWith({ type: 'choose', method: 'totp' });
  });
});

describe('EmailEntryStep', () => {
  it('prefills the pending address and submits it trimmed', () => {
    const onAction = jest.fn();
    render(
      <EmailEntryStep
        {...buildState({ name: 'emailEntry', prefillEmail: ' a@b.co ' })}
        reason={reason}
        onAction={onAction}
      />,
    );

    const input = screen.getByRole('textbox', {
      name: messages.mfaEmailEntryTitle.message,
    }) as HTMLInputElement;
    expect(input.value).toBe(' a@b.co ');
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitEmail',
      email: 'a@b.co',
    });
  });

  it('submits with Enter', () => {
    const onAction = jest.fn();
    render(
      <EmailEntryStep
        {...buildState({ name: 'emailEntry', prefillEmail: 'a@b.co' })}
        reason={reason}
        onAction={onAction}
      />,
    );

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitEmail',
      email: 'a@b.co',
    });
  });

  it.each([
    'nope',
    'a@b',
    'a@b..co',
    'a@.co',
    'a b@c.co',
    '.a@b.co',
    'a.@b.co',
    'a..b@c.co',
    '@b.co',
    'a@@b.co',
    'a@b.co.',
  ])('rejects %s without sending it', (address) => {
    const onAction = jest.fn();
    render(
      <EmailEntryStep
        {...buildState(
          { name: 'emailEntry' },
          { error: 'credential_already_enrolled' },
        )}
        reason={reason}
        onAction={onAction}
      />,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: address } });
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));

    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.mfaEmailEntryInvalid.message,
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('shows an enrollment failure under the email field', () => {
    render(
      <EmailEntryStep
        {...buildState(
          { name: 'emailEntry', prefillEmail: 'a@b.co' },
          { error: 'server_error' },
        )}
        reason={reason}
        onAction={jest.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.mfaErrorGeneric.message,
    );
  });

  it('accepts dots inside the local part', () => {
    const onAction = jest.fn();
    render(
      <EmailEntryStep
        {...buildState({ name: 'emailEntry', prefillEmail: 'first.last@b.co' })}
        reason={reason}
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitEmail',
      email: 'first.last@b.co',
    });
  });

  it('shows the error for an address already in use', () => {
    render(
      <EmailEntryStep
        {...buildState(
          { name: 'emailEntry', prefillEmail: 'a@b.co' },
          { error: 'credential_already_enrolled' },
        )}
        reason={reason}
        onAction={jest.fn()}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      expect.stringContaining(messages.mfaErrorEmailTaken.message),
    );
  });
});

describe('CodeStep', () => {
  const otp = (codeSent: boolean): Extract<MfaFlowStep, { name: 'otp' }> => ({
    name: 'otp',
    purpose: 'verify',
    method: 'email_otp',
    email: 'a@b.co',
    codeSent,
  });
  const totpCode = (
    codeSent = true,
  ): Extract<MfaFlowStep, { name: 'otp' }> => ({
    name: 'otp',
    purpose: 'verify',
    method: 'totp',
    codeSent,
  });

  beforeEach(() => {
    jest.useFakeTimers({ now: 1_000_000 });
    // jsdom does not implement it; Paste focuses the page before reading.
    jest.spyOn(window, 'focus').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const ui = (
    step: Extract<MfaFlowStep, { name: 'otp' }>,
    state: MfaFlowState,
    onAction: jest.Mock,
  ) => (
    <CodeStep step={step} state={state} reason={reason} onAction={onAction} />
  );

  const renderCode = (
    step: Extract<MfaFlowStep, { name: 'otp' }>,
    extra: Partial<MfaFlowState> = {},
  ) => {
    const onAction = jest.fn();
    const props = buildState(step, extra);
    return { onAction, ...render(ui(props.step, props.state, onAction)) };
  };

  it('does not submit before the code is sent', () => {
    const { onAction } = renderCode(otp(false), { busy: true });

    expect(
      screen.getByText(messages.mfaOtpSending.message),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '123456' },
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('ignores typing while a sent code is being checked', () => {
    const { onAction } = renderCode(otp(true), { busy: true });

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '123456' },
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('offers to resend after the code failed to send', () => {
    renderCode(otp(false), { error: 'server_error' });

    expect(
      screen.getByTestId(MfaFlowTestIds.RESEND_BUTTON),
    ).toBeInTheDocument();
  });

  it('submits once six digits are entered', () => {
    const { onAction } = renderCode(otp(true));
    const input = screen.getByRole('textbox', {
      name: messages.mfaOtpTitle.message,
    });

    expect(input).toHaveAccessibleDescription(
      messages.mfaOtpDescriptionWithEmail.message.replace('$1', 'a•••@b.co'),
    );
    expect(input).toHaveAttribute('maxlength', '6');
    fireEvent.change(input, { target: { value: '12a3' } });
    expect(onAction).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '123456' } });
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitCode',
      code: '123456',
    });
  });

  it('submits a code typed while it was sending once it is sent', () => {
    const onAction = jest.fn();
    const sending = buildState(otp(false), { busy: true });
    const { rerender } = render(ui(sending.step, sending.state, onAction));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '123456' },
    });
    expect(onAction).not.toHaveBeenCalled();

    const sent = buildState(otp(true));
    rerender(ui(sent.step, sent.state, onAction));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitCode',
      code: '123456',
    });
  });

  it('offers a new code once the one on screen expired', () => {
    const { onAction } = renderCode(otp(true), { error: 'flow_expired' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.mfaErrorCodeExpired.message,
    );
    fireEvent.click(screen.getByText(messages.mfaOtpGetNewCode.message));
    expect(onAction).toHaveBeenCalledWith({ type: 'resend' });
  });

  it('shows a wrong code and lets the user resend', () => {
    const { onAction } = renderCode(otp(true), { error: 'invalid_code' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.mfaErrorInvalidCode.message,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.RESEND_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'resend' });
  });

  it('counts down instead of showing the cooldown error', () => {
    const { onAction } = renderCode(otp(true), {
      error: 'otp_resend_cooldown',
      resendAvailableAt: Date.now() + 30_000,
    });

    expect(
      screen.getByText(messages.mfaOtpResendIn.message.replace('$1', '30')),
    ).toBeInTheDocument();
    expect(screen.queryByTestId(MfaFlowTestIds.ERROR)).toBeNull();
    expect(screen.getByTestId(MfaFlowTestIds.RESEND_BUTTON)).toBeDisabled();
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.RESEND_BUTTON));
    expect(onAction).not.toHaveBeenCalled();
  });

  it('lets the user resend once the cooldown ends, without its error', () => {
    const { onAction } = renderCode(otp(true), {
      error: 'rate_limited',
      resendAvailableAt: Date.now() + 1_000,
    });

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(screen.queryByTestId(MfaFlowTestIds.ERROR)).toBeNull();
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.RESEND_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'resend' });
  });

  it('shows a cooldown that came without a wait time', () => {
    renderCode(otp(true), { error: 'rate_limited' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.mfaErrorCooldown.message,
    );
  });

  it('sends the first code by itself once the cooldown ends', () => {
    const { onAction } = renderCode(otp(false), {
      error: 'otp_resend_cooldown',
      resendAvailableAt: Date.now() + 2_000,
    });

    expect(
      screen.getByText(messages.mfaOtpSendIn.message.replace('$1', '2')),
    ).toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(2_000);
    });
    expect(onAction).toHaveBeenCalledWith({ type: 'resend' });
  });

  it('waits out a new cooldown before sending again', () => {
    const onAction = jest.fn();
    const props = buildState(otp(false), { busy: true });
    const { rerender } = render(ui(props.step, props.state, onAction));

    rerender(
      ui(
        props.step,
        {
          ...props.state,
          busy: false,
          error: 'rate_limited',
          resendAvailableAt: Date.now() + 30_000,
        },
        onAction,
      ),
    );
    expect(onAction).not.toHaveBeenCalled();
  });

  it('clears the code and announces a new one after the old one expired', () => {
    const onAction = jest.fn();
    const props = buildState(otp(true));
    const { rerender } = render(ui(props.step, props.state, onAction));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '123' },
    });

    rerender(ui(props.step, { ...props.state, codeResent: true }, onAction));

    expect(screen.getByRole('status')).toHaveTextContent(
      messages.mfaOtpResent.message,
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('asks for the code from the authenticator app, with nothing to resend', () => {
    const { onAction } = renderCode(totpCode());

    expect(
      screen.getByText(messages.mfaOtpDescriptionTotp.message),
    ).toBeInTheDocument();
    expect(screen.queryByTestId(MfaFlowTestIds.RESEND_BUTTON)).toBeNull();
    expect(screen.queryByTestId(MfaFlowTestIds.PRIMARY_BUTTON)).toBeNull();

    fireEvent.change(screen.getByTestId(MfaFlowTestIds.CODE_INPUT), {
      target: { value: '123456' },
    });
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitCode',
      code: '123456',
    });
  });

  it.each([
    ['email', otp(true)],
    ['authenticator app', totpCode()],
  ])(
    'keeps every %s digit visible with a loading indicator while verifying',
    (_method, step) => {
      const onAction = jest.fn();
      const props = buildState(step);
      const { rerender } = render(ui(props.step, props.state, onAction));

      fireEvent.change(screen.getByTestId(MfaFlowTestIds.CODE_INPUT), {
        target: { value: '123456' },
      });
      expect(
        screen.queryByTestId(MfaFlowTestIds.VERIFYING_INDICATOR),
      ).toBeNull();

      rerender(ui(props.step, { ...props.state, busy: true }, onAction));

      expect(
        screen.getByRole('status', {
          name: messages.mfaOtpVerifying.message,
        }),
      ).toHaveAttribute('data-testid', MfaFlowTestIds.VERIFYING_INDICATOR);
      expect(screen.getByText('6')).toBeInTheDocument();
    },
  );

  it.each<[MfaFlowErrorCode, string]>([
    ['flow_expired', messages.mfaErrorTotpExpired.message],
    ['invalid_code', messages.mfaErrorInvalidTotpCode.message],
  ])('words %s for the authenticator app', (error, message) => {
    renderCode(totpCode(), { error });

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('offers to try again when the app verification failed to start', () => {
    const { onAction } = renderCode(totpCode(false), {
      error: 'server_error',
    });

    expect(
      screen.getByText(messages.mfaErrorGeneric.message),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.RESEND_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'resend' });
  });

  it('shows a cooldown and its countdown before trying again', () => {
    renderCode(totpCode(false), {
      error: 'rate_limited',
      resendAvailableAt: 1_000_000 + 30_000,
    });

    expect(
      screen.getByText(messages.mfaErrorCooldown.message),
    ).toBeInTheDocument();
    const retry = screen.getByTestId(MfaFlowTestIds.RESEND_BUTTON);
    expect(retry).toHaveTextContent(
      messages.mfaOtpRetryIn.message.replace('$1', '30'),
    );
    expect(retry).toBeDisabled();
  });
});

describe('PasskeyStep', () => {
  it('shows why the passkey failed and tries again', () => {
    const onAction = jest.fn();
    render(
      <PasskeyStep
        {...buildState(
          { name: 'passkey', purpose: 'verify' },
          { error: 'passkey_ceremony_cancelled' },
        )}
        reason={reason}
        onAction={onAction}
      />,
    );

    expect(
      screen.getByText(messages.mfaPasskeyTitleVerify.message),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.mfaErrorPasskeyCancelled.message,
    );
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'continue' });
  });
});

describe('FailureStep', () => {
  it('offers a retry when the error allows it', () => {
    const onAction = jest.fn();
    render(
      <FailureStep
        {...buildState({
          name: 'failure',
          code: 'server_error',
          canRetry: true,
        })}
        reason={reason}
        onAction={onAction}
      />,
    );

    expect(
      screen.getByText(messages.mfaFailureTitle.message),
    ).toBeInTheDocument();
    expect(screen.queryByText(messages.mfaErrorGeneric.message)).toBeNull();
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'retry' });
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.SECONDARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'dismiss' });
  });

  it('only offers to close for a final error', () => {
    render(
      <FailureStep
        {...buildState({
          name: 'failure',
          code: 'max_identifiers_reached',
          canRetry: false,
        })}
        reason={reason}
        onAction={jest.fn()}
      />,
    );

    expect(
      screen.getByText(messages.mfaErrorLimitReached.message),
    ).toBeInTheDocument();
    expect(screen.queryByTestId(MfaFlowTestIds.PRIMARY_BUTTON)).toBeNull();
  });
});

describe('TotpSetupStep', () => {
  beforeEach(() => {
    mockIsCopied = false;
  });

  const setup = (
    isRestart = false,
  ): Extract<MfaFlowStep, { name: 'totpSetup' }> => ({
    name: 'totpSetup',
    secret: 'JBSWY3DPEHPK3PXP',
    qrCode: 'data:image/png;base64,QR',
    setupUri: 'otpauth://totp/MetaMask?secret=JBSWY3DPEHPK3PXP',
    isRestart,
  });

  const renderSetup = (step = setup()) => {
    const onAction = jest.fn();
    const props = buildState(step);
    return {
      onAction,
      ...render(
        <TotpSetupStep
          step={props.step}
          state={props.state}
          reason={reason}
          onAction={onAction}
        />,
      ),
    };
  };

  it('shows the QR code and the setup key in groups', () => {
    renderSetup();

    expect(screen.getByTestId(MfaFlowTestIds.TOTP_QR_IMAGE)).toHaveAttribute(
      'src',
      'data:image/png;base64,QR',
    );
    expect(screen.getByTestId(MfaFlowTestIds.TOTP_SETUP_KEY)).toHaveTextContent(
      'JBSW Y3DP EHPK 3PXP',
    );
    expect(
      screen.getByTestId(MfaFlowTestIds.TOTP_COPY_KEY),
    ).toHaveAccessibleName(
      `${messages.mfaTotpSetupKey.message} JBSW Y3DP EHPK 3PXP`,
    );
    expect(
      screen.getByText(messages.mfaTotpSetupManual.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mfaTotpSetupDescription.message),
    ).not.toHaveTextContent('Then enter the 6-digit code it shows.');
  });

  it('copies the setup key as sensitive data when the key section is clicked', () => {
    renderSetup();

    fireEvent.click(screen.getByTestId(MfaFlowTestIds.TOTP_COPY_KEY));

    expect(mockUseCopyToClipboard).toHaveBeenCalledWith({ sensitive: true });
    expect(mockCopy).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP');
  });

  it('announces when the setup key is copied', () => {
    mockIsCopied = true;
    renderSetup();

    expect(screen.getByRole('status')).toHaveTextContent(
      messages.mfaTotpSetupCopied.message,
    );
    expect(
      screen.getByTestId(MfaFlowTestIds.TOTP_COPY_KEY),
    ).toHaveAccessibleName(
      `${messages.mfaTotpSetupKey.message} JBSW Y3DP EHPK 3PXP`,
    );
  });

  it('warns that an earlier setup key stopped working', () => {
    renderSetup(setup(true));

    expect(
      screen.getByText(messages.mfaTotpSetupRestarted.message),
    ).toBeInTheDocument();
  });

  it('continues to the code', () => {
    const { onAction } = renderSetup();

    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));

    expect(onAction).toHaveBeenCalledWith({ type: 'continue' });
  });
});
