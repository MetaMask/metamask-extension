import React from 'react';
import { render } from '@testing-library/react';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import { TextAlign } from '../../../../helpers/constants/design-system';
import { AlertProvider, AlertProviderProps } from './alert-provider';

describe('AlertProvider', () => {
  const defaultProps: AlertProviderProps = {
    provider: SecurityProvider.Blockaid,
    paddingTop: 1,
    textAlign: TextAlign.Center,
  };

  it('renders correctly with required props', () => {
    const { container } = render(<AlertProvider {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('renders null if no provider is given', () => {
    const { container } = render(<AlertProvider />);
    expect(container).toBeEmptyDOMElement();
  });
});
