import { useCallback, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import { MetaMetricsEventLocation } from '../../../../../shared/constants/metametrics';
import { getRemoteFeatureFlags } from '../../../../../shared/lib/selectors/remote-feature-flags';
import { useConfirmContext } from '../../../../pages/confirmations/context/confirm';
import type { ScamQuestionnaireProps } from './scam-questionnaire';

const SCAM_QUESTIONNAIRE_CONFIRM_FLAG_KEY =
  'productSafetyScamQuestionnaireConfirmEnabled';

type OnCancelHandler = (args: {
  location: MetaMetricsEventLocation;
}) => void | Promise<void>;

export type UseConfirmScamQuestionnaireResult = {
  isScamQuestionnaireRequired: boolean;
  isScamQuestionnaireVisible: boolean;
  showScamQuestionnaire: () => void;
  scamQuestionnaireProps: ScamQuestionnaireProps;
};

function matchesScamDomain(origin: string, domain: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === domain || hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

export function useConfirmScamQuestionnaire({
  onCancel,
}: {
  onCancel: OnCancelHandler;
}): UseConfirmScamQuestionnaireResult {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const [isScamQuestionnaireVisible, setVisible] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);

  const remoteFlags = useSelector(getRemoteFeatureFlags);
  const scamDomains =
    (remoteFlags[SCAM_QUESTIONNAIRE_CONFIRM_FLAG_KEY] as
      | string[]
      | undefined) ?? [];

  const { origin } = currentConfirmation ?? {};
  const isDappInitiated = Boolean(origin && origin !== ORIGIN_METAMASK);
  const isScamOrigin =
    isDappInitiated &&
    scamDomains.some((domain) =>
      matchesScamDomain(origin as string, domain),
    );

  const isScamQuestionnaireRequired = isScamOrigin && !hasPassed;

  const showScamQuestionnaire = useCallback(() => {
    setVisible(true);
  }, []);

  const hideScamQuestionnaire = useCallback(() => {
    setVisible(false);
  }, []);

  const onScamComplete = useCallback(() => {
    setHasPassed(true);
    setVisible(false);
  }, []);

  const onScamReject = useCallback(() => {
    setVisible(false);
    onCancel({ location: MetaMetricsEventLocation.Confirmation });
  }, [onCancel]);

  return {
    isScamQuestionnaireRequired,
    isScamQuestionnaireVisible,
    showScamQuestionnaire,
    scamQuestionnaireProps: {
      onCleanPass: onScamComplete,
      onBypass: onScamComplete,
      onReject: onScamReject,
      onDismiss: hideScamQuestionnaire,
      location: 'confirmations_flow',
    },
  };
}
