import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { SelectSrp } from './select-srp';

const mockI18nContext = jest.fn((key, args) => {
  if (key === 'srpListNumberOfAccounts') {
    return `${args[0]} accounts`;
  }
  return key;
});

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockI18nContext,
}));

const mockSRPName = 'Test SRP';

const defaultProps = {
  srpName: mockSRPName,
  srpAccounts: 5,
  onClick: jest.fn(),
};

describe('SelectSRP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with correct props', () => {
    const { getByTestId, getByText } = render(<SelectSrp {...defaultProps} />);

    expect(getByTestId('select-srp-container')).toBeInTheDocument();
    expect(getByTestId(`select-srp-${mockSRPName}`)).toBeInTheDocument();
    expect(getByText(mockSRPName)).toBeInTheDocument();
    expect(getByText('5 accounts')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const { getByTestId } = render(<SelectSrp {...defaultProps} />);

    fireEvent.click(getByTestId('select-srp-Test SRP'));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('displays correct label text', () => {
    const { getByText } = render(<SelectSrp {...defaultProps} />);

    expect(getByText('selectSecretRecoveryPhrase')).toBeInTheDocument();
  });

  it('displays description text', () => {
    const { getByText } = render(<SelectSrp {...defaultProps} />);

    expect(getByText('srpListSelectionDescription')).toBeInTheDocument();
  });

  it('renders with zero accounts', () => {
    const props = {
      ...defaultProps,
      srpAccounts: 0,
    };
    const { getByText } = render(<SelectSrp {...props} />);

    expect(getByText('0 accounts')).toBeInTheDocument();
  });
});
