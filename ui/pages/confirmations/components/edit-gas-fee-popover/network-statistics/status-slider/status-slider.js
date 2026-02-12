import React from 'react';

import { NetworkCongestionThresholds } from '../../../../../../../shared/constants/gas';
import { useGasFeeContext } from '../../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { NetworkStabilityTooltip } from '../tooltips';

/* eslint-disable @metamask/design-tokens/color-no-hex */
const DEFAULT_GRADIENT_START = '#037DD6';
const DEFAULT_GRADIENT_END = '#D73A49';
/* eslint-enable @metamask/design-tokens/color-no-hex */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeHexColor = (value) => {
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  if (value.length === 7) {
    return value;
  }
  return null;
};

const parseRgbColor = (value) => {
  const match = value
    .replace(/\s+/gu, '')
    .match(/^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/u);
  if (!match) {
    return null;
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
};

const parseHexColor = (value) => {
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
};

const parseColor = (value) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }
  if (trimmed.startsWith('rgb')) {
    return parseRgbColor(trimmed);
  }
  return null;
};

const rgbToHex = ({ r, g, b }) => {
  const toHex = (channel) => channel.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const getCssVariableValue = (variableName, fallback) => {
  if (typeof window === 'undefined' || !window.getComputedStyle) {
    return fallback;
  }
  const style = window.getComputedStyle(document.documentElement);
  let value = style.getPropertyValue(variableName).trim();
  let depth = 0;
  while (value.startsWith('var(') && depth < 5) {
    const match = value.match(/^var\((--[^,)\s]+)\s*(?:,([^)]+))?\)$/u);
    if (!match) {
      break;
    }
    const nextValue = style.getPropertyValue(match[1]).trim();
    value = nextValue || (match[2] ? match[2].trim() : '');
    depth += 1;
  }
  return value || fallback;
};

const getGradientColor = (ratio) => {
  const startValue = getCssVariableValue(
    '--color-primary-default',
    DEFAULT_GRADIENT_START,
  );
  const endValue = getCssVariableValue(
    '--color-error-default',
    DEFAULT_GRADIENT_END,
  );
  const startColor =
    parseColor(startValue) ?? parseColor(DEFAULT_GRADIENT_START);
  const endColor = parseColor(endValue) ?? parseColor(DEFAULT_GRADIENT_END);
  if (!startColor || !endColor) {
    return DEFAULT_GRADIENT_START;
  }
  const clampedRatio = clamp(ratio, 0, 1);
  const color = {
    r: Math.round(startColor.r + (endColor.r - startColor.r) * clampedRatio),
    g: Math.round(startColor.g + (endColor.g - startColor.g) * clampedRatio),
    b: Math.round(startColor.b + (endColor.b - startColor.b) * clampedRatio),
  };
  return rgbToHex(color);
};

const determineStatusInfo = (givenNetworkCongestion) => {
  const networkCongestion = givenNetworkCongestion ?? 0.5;
  const colorIndex = Math.round(networkCongestion * 10);
  const sliderTickValue = colorIndex * 10;
  const color = getGradientColor(sliderTickValue / 100);

  if (networkCongestion >= NetworkCongestionThresholds.busy) {
    return {
      statusLabel: 'busy',
      tooltipLabel: 'highLowercase',
      color,
      sliderTickValue,
    };
  } else if (networkCongestion >= NetworkCongestionThresholds.stable) {
    return {
      statusLabel: 'stable',
      tooltipLabel: 'stableLowercase',
      color,
      sliderTickValue,
    };
  }
  return {
    statusLabel: 'notBusy',
    tooltipLabel: 'lowLowercase',
    color,
    sliderTickValue,
  };
};

const StatusSlider = () => {
  const t = useI18nContext();
  const { gasFeeEstimates } = useGasFeeContext();
  const statusInfo = determineStatusInfo(gasFeeEstimates.networkCongestion);

  return (
    <NetworkStabilityTooltip
      color={statusInfo.color}
      tooltipLabel={statusInfo.tooltipLabel}
    >
      <div className="status-slider">
        <div className="status-slider__arrow-container">
          <div
            className="status-slider__arrow-border"
            style={{
              marginLeft: `${statusInfo.sliderTickValue}%`,
            }}
            data-testid="status-slider-arrow-border"
          >
            <div
              className="status-slider__arrow"
              style={{
                borderTopColor: statusInfo.color,
              }}
              data-testid="status-slider-arrow"
            />
          </div>
        </div>
        <div className="status-slider__line" />
        <div
          className="status-slider__label"
          style={{ color: statusInfo.color }}
          data-testid="status-slider-label"
        >
          {t(statusInfo.statusLabel)}
        </div>
      </div>
    </NetworkStabilityTooltip>
  );
};

export default StatusSlider;
