import React from 'react';
import PropTypes from 'prop-types';

import { PRIORITY_LEVELS } from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import I18nValue from '../../ui/i18n-value';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography/typography';

import { COLORS } from '../../../helpers/constants/design-system';
import EditGasItem from './edit-gas-item';
import NetworkStatus from './network-status';

const EditGasFeePopover = ({ onClose }) => {
  const t = useI18nContext();

  return (
    <Popover
      title={t('editGasFeeModalTitle')}
      onClose={onClose}
      className="edit-gas-fee-popover"
    >
      <>
        {process.env.IN_TEST === 'true' ? null : <LoadingHeartBeat />}
        <div className="edit-gas-fee-popover__wrapper">
          <div className="edit-gas-fee-popover__content">
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
            <EditGasItem
              priorityLevel={PRIORITY_LEVELS.LOW}
              onClose={onClose}
            />
            <EditGasItem
              priorityLevel={PRIORITY_LEVELS.MEDIUM}
              onClose={onClose}
            />
            <EditGasItem
              priorityLevel={PRIORITY_LEVELS.HIGH}
              onClose={onClose}
            />
            <div className="edit-gas-fee-popover__content__separator" />
            <EditGasItem
              priorityLevel={PRIORITY_LEVELS.DAPP_SUGGESTED}
              onClose={onClose}
            />
            <EditGasItem
              priorityLevel={PRIORITY_LEVELS.CUSTOM}
              onClose={onClose}
            />
            <NetworkStatus />
            <Typography
              className="edit-gas-fee-popover__know-more"
              align="center"
              color={COLORS.UI4}
              fontSize="12px"
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

EditGasFeePopover.propTypes = {
  onClose: PropTypes.func,
};

export default EditGasFeePopover;
