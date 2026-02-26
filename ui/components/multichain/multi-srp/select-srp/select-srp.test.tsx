import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { SelectSrp, SelectSrpProps } from './select-srp';

const mockSrpName = 'Test Srp';

const defaultProps = {
  srpName: mockSrpName,
  srpAccounts: 5,
  onClick: jest.fn(),
};

const render = (props: SelectSrpProps = defaultProps) => {
  const mockStore = configureMockStore([])(mockState);
  return renderWithProvider(<SelectSrp {...props} />, mockStore);
};

describe('SelectSrp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with correct props', () => {
    const { getByTestId, getByText } = render();

    expect(getByTestId('select-srp-container')).toBeInTheDocument();
    expect(getByTestId(`select-srp-${mockSrpName}`)).toBeInTheDocument();
    expect(getByText(mockSrpName)).toBeInTheDocument();
    expect(getByText('5 accounts')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId(`select-srp-${mockSrpName}`));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('displays correct label text', () => {
    const { getByText } = render();

    expect(
      getByText(messages.selectSecretRecoveryPhrase.message),
    ).toBeInTheDocument();
  });

  it('displays description text', () => {
    const { getByText } = render();

    expect(
      getByText(messages.srpListSelectionDescription.message),
    ).toBeInTheDocument();
  });

  it('renders with zero accounts', () => {
    const props = {
      ...defaultProps,
      srpAccounts: 0,
    };
    const { getByText } = render(props);

    expect(getByText('0 account')).toBeInTheDocument();
  });
});
