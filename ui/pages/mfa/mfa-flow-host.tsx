import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import Spinner from '../../components/ui/spinner';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useActiveMfaFlow } from '../../hooks/identity/mfa/engine/useActiveMfaFlow';
import type { MfaFlowState } from '../../hooks/identity/mfa/engine/types';
import { MfaFlowTestIds } from './test-ids';
import IntroStep from './steps/intro-step';
import PickerStep from './steps/picker-step';
import EmailEntryStep from './steps/email-entry-step';
import CodeStep from './steps/code-step';
import PasskeyStep from './steps/passkey-step';
import SuccessStep from './steps/success-step';
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
  const key = 'purpose' in step ? `${step.name}-${step.purpose}` : step.name;
  const shared = {
    state,
    reason: active.flow.reason,
    onAction: active.flow.dispatch,
  };

  const getProgressTitle = ({ progress }: MfaFlowState) =>
    progress.total > 1 && step.name !== 'success' && step.name !== 'failure'
      ? t('mfaProgress', [String(progress.current), String(progress.total)])
      : undefined;

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
      case 'success':
        return <SuccessStep key={key} {...shared} step={step} />;
      case 'failure':
        return <FailureStep key={key} {...shared} step={step} />;
      default:
        return (
          <Box
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            className="flex-1"
          >
            <Spinner />
          </Box>
        );
    }
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full bg-default"
      data-testid={`${MfaFlowTestIds.CONTAINER}-${step.name}`}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        padding={4}
      >
        <Text variant={TextVariant.HeadingSm}>{getProgressTitle(state)}</Text>
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          onClick={() => active.flow.dispatch({ type: 'cancel' })}
          data-testid={MfaFlowTestIds.CLOSE_BUTTON}
        />
      </Box>
      {renderStep()}
    </Box>
  );
};

export default MfaFlowHost;
