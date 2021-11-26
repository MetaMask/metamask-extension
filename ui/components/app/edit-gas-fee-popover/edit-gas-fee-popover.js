import React from 'react';

import { PRIORITY_LEVELS } from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import ErrorMessage from '../../ui/error-message';
import I18nValue from '../../ui/i18n-value';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography/typography';

import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { useGasFeeContext } from '../../../contexts/gasFee';
import EditGasItem from './edit-gas-item';
import NetworkStatus from './network-status';

const EditGasFeePopover = () => {
  const { balanceError } = useGasFeeContext();
  const t = useI18nContext();
  const { closeModal, currentModal } = useTransactionModalContext();

  if (currentModal !== 'editGasFee') return null;

  return (
    <Popover
      title={t('editGasFeeModalTitle')}
      onClose={() => closeModal('editGasFee')}
      className="edit-gas-fee-popover"
    >
      <>
        {process.env.IN_TEST === 'true' ? null : <LoadingHeartBeat />}
        <div className="edit-gas-fee-popover__wrapper">
          <div className="edit-gas-fee-popover__content">
            {balanceError && (
              <ErrorMessage errorKey={INSUFFICIENT_FUNDS_ERROR_KEY} />
            )}
            <div className="edit-gas-fee-popover__content__header">
              <span className="edit-gas-fee-popover__content__header-option">
                <I18nValue messageKey="gasOption" />
              </span>
              <span className="edit-gas-fee-popover__content__header-time">
                <I18nValue messageKey="time" />
              </span>
              <span className="edit-gas-fee-popover__content__header-max-fee">
                <I18nValue messageKey="maxFee" />
              </span>
            </div>
            <EditGasItem priorityLevel={PRIORITY_LEVELS.LOW} />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.MEDIUM} />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.HIGH} />
            <div className="edit-gas-fee-popover__content__separator" />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.DAPP_SUGGESTED} />
            <EditGasItem priorityLevel={PRIORITY_LEVELS.CUSTOM} />
            <NetworkStatus />
            <Typography
              className="edit-gas-fee-popover__know-more"
              align="center"
              color={COLORS.UI4}
              tag={TYPOGRAPHY.Paragraph}
              variant={TYPOGRAPHY.H7}
            >
              <I18nValue
                messageKey="learmMoreAboutGas"
                options={[
                  <a
                    key="learnMoreLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://metamask.zendesk.com/hc/en-us/articles/4404600179227-User-Guide-Gas"
                  >
                    <I18nValue messageKey="learnMore" />
                  </a>,
                ]}
              />
            </Typography>
          </div>
        </div>
      </>
    </Popover>
  );
};

export default EditGasFeePopover;
