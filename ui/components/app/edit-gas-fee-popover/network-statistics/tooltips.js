import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import Tooltip from '../../../ui/tooltip';

const NetworkStatusTooltip = ({ children, html, title }) => (
  <Tooltip position="top" html={html} title={title} theme="tippy-tooltip-info">
    {children}
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

export const NetworkStabilityTooltip = ({ children, color, tooltipLabel }) => {
  const t = useI18nContext();

  return (
    <NetworkStatusTooltip
      html={t('networkStatusStabilityFeeTooltip', [
        <strong
          key="network-status__tooltip"
          className="network-status__tooltip-label"
          style={{ color }}
        >
          {t(tooltipLabel)}
        </strong>,
      ])}
    >
      {children}
    </NetworkStatusTooltip>
  );
};

NetworkStabilityTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  tooltipLabel: PropTypes.string.isRequired,
};
