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

const STEP_TITLE_ID = 'mfa-step-title';
const STEP_DESCRIPTION_ID = 'mfa-step-description';
const STEP_MESSAGE_ID = 'mfa-step-message';

/**
 * Names a step's input after the step title, and describes it with the step
 * description and the message under it, for screen readers. `TextField` sets
 * `aria-invalid` from `isError`.
 */
export const INPUT_A11Y_PROPS = {
  'aria-labelledby': STEP_TITLE_ID,
  'aria-describedby': `${STEP_DESCRIPTION_ID} ${STEP_MESSAGE_ID}`,
};

/**
 * A message under a step's input, announced by screen readers when it
 * appears. Only one shows at a time.
 *
 * @param props - The message's props.
 * @param props.isError - Whether it is an error, rather than a status.
 * @param props.children - The message.
 */
export const StepMessage = ({
  isError = false,
  children,
}: {
  isError?: boolean;
  children: ReactNode;
}) => (
  <Text
    asChild
    variant={TextVariant.BodyMd}
    color={isError ? TextColor.ErrorDefault : TextColor.TextAlternative}
  >
    <p
      id={STEP_MESSAGE_ID}
      role={isError ? 'alert' : 'status'}
      data-testid={isError ? MfaFlowTestIds.ERROR : undefined}
    >
      {children}
    </p>
  </Text>
);

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
  return <StepMessage isError>{t(getErrorMessageKey(code))}</StepMessage>;
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
      <Text asChild variant={TextVariant.HeadingLg}>
        <h2 id={STEP_TITLE_ID}>{title}</h2>
      </Text>
      {description ? (
        <Text
          asChild
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
        >
          <p id={STEP_DESCRIPTION_ID}>{description}</p>
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
