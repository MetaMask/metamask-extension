import React from 'react';
import { it } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import type {
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
import SuccessStep, { SUCCESS_AUTO_CLOSE_MS } from './success-step';

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
  it('lists the missing methods and continues', () => {
    const onAction = jest.fn();
    render(
      <IntroStep
        {...buildState({ name: 'intro', missing: ['email_otp'] })}
        reason={{ operation: 'test', enrollDescription: 'Why we ask' }}
        onAction={onAction}
      />,
    );

    expect(screen.getByText('Why we ask')).toBeInTheDocument();
    expect(
      screen.getByText(messages.mfaMethodEmail.message),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({ type: 'continue' });
  });

  it('shows the generic line when the feature gives none', () => {
    render(
      <IntroStep
        {...buildState({ name: 'intro', missing: ['email_otp'] })}
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
    email: 'a@b.co',
    codeSent,
  });

  beforeEach(() => {
    jest.useFakeTimers({ now: 1_000_000 });
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
      messages.mfaOtpDescriptionWithEmail.message.replace('$1', 'a@b.co'),
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

  it('submits with the button', () => {
    const { onAction } = renderCode(otp(true));

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '12345' },
    });
    expect(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON)).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '123456' },
    });
    onAction.mockClear();
    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitCode',
      code: '123456',
    });
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
    renderCode(otp(true), {
      error: 'otp_resend_cooldown',
      resendAvailableAt: Date.now() + 30_000,
    });

    expect(
      screen.getByText(messages.mfaOtpResendIn.message.replace('$1', '30')),
    ).toBeInTheDocument();
    expect(screen.queryByTestId(MfaFlowTestIds.ERROR)).toBeNull();
    expect(screen.queryByTestId(MfaFlowTestIds.RESEND_BUTTON)).toBeNull();
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

describe('SuccessStep', () => {
  it('dismisses by itself or with the button', () => {
    jest.useFakeTimers();
    const onAction = jest.fn();
    render(
      <SuccessStep
        {...buildState({ name: 'success' })}
        reason={reason}
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    expect(onAction).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(SUCCESS_AUTO_CLOSE_MS);
    });
    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenLastCalledWith({ type: 'dismiss' });
    jest.useRealTimers();
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
      screen.getByText(messages.mfaErrorGeneric.message),
    ).toBeInTheDocument();
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
