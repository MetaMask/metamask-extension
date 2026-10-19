import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  IconName,
} from '@metamask/design-system-react';
import Spinner from '../../components/ui/spinner';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useActiveMfaFlow } from '../../hooks/identity/mfa/engine/useActiveMfaFlow';
import { MfaFlowTestIds } from './test-ids';
import IntroStep from './steps/intro-step';
import PickerStep from './steps/picker-step';
import EmailEntryStep from './steps/email-entry-step';
import CodeStep from './steps/code-step';
import PasskeyStep from './steps/passkey-step';
import FailureStep from './steps/failure-step';

/**
 * Full-page view that renders the running MFA flow. Leaving it cancels the
 * flow; it goes back once the flow settles.
 */
const MfaFlowHost = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const active = useActiveMfaFlow();
  const flow = active?.flow;
  const cancelTimer = useRef<ReturnType<typeof setTimeout>>();

  // StrictMode re-runs effects in development: deferring the cancel lets the
  // re-run keep the flow.
  useEffect(() => {
    clearTimeout(cancelTimer.current);
    return () => {
      cancelTimer.current = setTimeout(() =>
        flow?.dispatch({ type: 'cancel' }),
      );
    };
  }, [flow]);

  useEffect(() => {
    if (flow) {
      return;
    }
    if (location.key === 'default') {
      navigate(DEFAULT_ROUTE, { replace: true });
    } else {
      navigate(-1);
    }
  }, [flow, location.key, navigate]);

  if (!active) {
    return null;
  }

  const { state } = active;
  const { step } = state;
  const isPicker = step.name === 'picker';
  const cancel = () => active.flow.dispatch({ type: 'cancel' });
  const key = 'purpose' in step ? `${step.name}-${step.purpose}` : step.name;
  const shared = {
    state,
    reason: active.flow.reason,
    onAction: active.flow.dispatch,
  };

  const renderStep = () => {
    switch (step.name) {
      case 'intro':
        return <IntroStep key={key} {...shared} step={step} />;
      case 'picker':
        return <PickerStep key={key} {...shared} step={step} />;
      case 'emailEntry':
        return <EmailEntryStep key={key} {...shared} step={step} />;
      case 'otp':
        return <CodeStep key={key} {...shared} step={step} />;
      case 'passkey':
        return <PasskeyStep key={key} {...shared} step={step} />;
      case 'failure':
        return <FailureStep key={key} {...shared} step={step} />;
      default:
        return (
          <Box
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            className="flex-1"
            aria-busy="true"
            aria-label={t('loading')}
          >
            <Spinner />
          </Box>
        );
    }
  };

  return (
    // A centred column, as wide as the onboarding flow's, so wide windows
    // and the side panel show the same phone-width screens.
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full max-w-[446px] mx-auto bg-default"
      data-testid={`${MfaFlowTestIds.CONTAINER}-${step.name}`}
    >
      {/* The picker mirrors mobile's sheet, closed from its end; the other
          steps go back from their start. */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={
          isPicker ? BoxJustifyContent.End : BoxJustifyContent.Start
        }
        padding={4}
      >
        <ButtonIcon
          iconName={isPicker ? IconName.Close : IconName.ArrowLeft}
          ariaLabel={t(isPicker ? 'close' : 'back')}
          onClick={cancel}
          data-testid={
            isPicker ? MfaFlowTestIds.CLOSE_BUTTON : MfaFlowTestIds.BACK_BUTTON
          }
        />
      </Box>
      {renderStep()}
    </Box>
  );
};

export default MfaFlowHost;
