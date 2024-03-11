import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  NotificationDetailAsset,
  NotificationDetailAssetProps,
} from './notification-detail-asset';

describe('NotificationDetailAsset', () => {
  const defaultProps: NotificationDetailAssetProps = {
    icon: {
      src: 'test-src',
      badge: {
        src: 'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
      },
    },
    label: 'Test Label',
    detail: 'Test Detail',
    fiatValue: 'Test Fiat Value',
    value: 'Test Value',
  };

  it('renders without crashing', () => {
    render(<NotificationDetailAsset {...defaultProps} />);
    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.detail)).toBeInTheDocument();
    if (defaultProps.fiatValue) {
      expect(screen.getByText(defaultProps.fiatValue)).toBeInTheDocument();
    }
    if (defaultProps.value) {
      expect(screen.getByText(defaultProps.value)).toBeInTheDocument();
    }
  });

  it('does not render value text when value prop is not provided', () => {
    const { value, ...propsWithoutValue } = defaultProps;
    render(<NotificationDetailAsset {...propsWithoutValue} />);
    if (value) {
      expect(screen.queryByText(value)).not.toBeInTheDocument();
    }
  });
});
