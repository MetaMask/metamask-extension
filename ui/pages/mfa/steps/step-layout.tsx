import React, { type ReactNode } from 'react';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type {
  MfaFlowAction,
  MfaFlowErrorCode,
  MfaFlowState,
  MfaFlowStep,
  MfaReason,
} from '../../../hooks/identity/mfa/engine/types';
import { getErrorMessageKey } from '../labels';
import { MfaFlowTestIds } from '../test-ids';

/**
 * What every step screen receives. Screens only read state and send actions.
 */
export type StepProps<Name extends MfaFlowStep['name']> = {
  step: Extract<MfaFlowStep, { name: Name }>;
  state: MfaFlowState;
  reason: MfaReason;
  onAction: (action: MfaFlowAction) => void;
};

type StepLayoutProps = {
  title: string;
  description?: string;
  error?: MfaFlowErrorCode;
  top?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
};

/** The 2-step verification shield, above the title of the intro and picker. */
export const MfaShield = () => (
  <img
    src="./images/mfa-shield.png"
    alt=""
    width={64}
    height={67}
    className="self-center"
  />
);

export const StepError = ({ code }: { code: MfaFlowErrorCode }) => {
  const t = useI18nContext();
  return (
    <Text
      variant={TextVariant.BodyMd}
      color={TextColor.ErrorDefault}
      data-testid={MfaFlowTestIds.ERROR}
    >
      {t(getErrorMessageKey(code))}
    </Text>
  );
};

const StepLayout = ({
  title,
  description,
  error,
  top,
  children,
  footer,
}: StepLayoutProps) => (
  <Box flexDirection={BoxFlexDirection.Column} className="flex-1 min-h-0">
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      paddingHorizontal={4}
      paddingTop={4}
      paddingBottom={6}
      className="flex-1 overflow-y-auto"
    >
      {top}
      <Text variant={TextVariant.HeadingLg}>{title}</Text>
      {description ? (
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {description}
        </Text>
      ) : null}
      {children}
      {error ? <StepError code={error} /> : null}
    </Box>
    {footer ? (
      <Box flexDirection={BoxFlexDirection.Column} gap={2} padding={4}>
        {footer}
      </Box>
    ) : null}
  </Box>
);

export default StepLayout;
