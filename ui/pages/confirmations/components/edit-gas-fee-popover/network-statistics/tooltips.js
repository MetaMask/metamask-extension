import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import Box from '../../../../../components/ui/box';
import Tooltip from '../../../../../components/ui/tooltip';

import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

const NetworkStatusTooltip = ({ children, html, title }) => (
  <Tooltip position="top" html={html} title={title}>
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      {children}
    </Box>
  </Tooltip>
);

NetworkStatusTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  html: PropTypes.node,
  title: PropTypes.string,
};

export const BaseFeeTooltip = ({ children }) => {
  const t = useI18nContext();
  return (
    <NetworkStatusTooltip
      html={t('networkStatusBaseFeeTooltip', [
        <strong
          key="base_fee_medium_estimate"
          className="network-status__tooltip-label"
        >
          {t('medium')}
        </strong>,
        <strong
          key="base_fee_high_estimate"
          className="network-status__tooltip-label"
        >
          {t('high')}
        </strong>,
      ])}
    >
      {children}
    </NetworkStatusTooltip>
  );
};

BaseFeeTooltip.propTypes = {
  children: PropTypes.node.isRequired,
};

export const PriorityFeeTooltip = ({ children }) => {
  const t = useI18nContext();
  return (
    <NetworkStatusTooltip title={t('networkStatusPriorityFeeTooltip')}>
      {children}
    </NetworkStatusTooltip>
  );
};

PriorityFeeTooltip.propTypes = {
  children: PropTypes.node.isRequired,
};

export const NetworkStabilityTooltip = ({ children, tooltipLabel }) => {
  const t = useI18nContext();

  return (
    <NetworkStatusTooltip
      html={t('networkStatusStabilityFeeTooltip', [
        <span key="network-status__tooltip">{t(tooltipLabel)}</span>,
      ])}
    >
      {children}
    </NetworkStatusTooltip>
  );
};

NetworkStabilityTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  tooltipLabel: PropTypes.string.isRequired,
};
