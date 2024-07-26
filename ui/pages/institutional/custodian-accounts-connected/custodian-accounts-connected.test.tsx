import React from 'react';
import { render } from '@testing-library/react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import CustodianAccountsConnected from './custodian-accounts-connected';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

describe('CustodianAccountsConnected', () => {
  const useI18nContextMock = useI18nContext as jest.Mock;

  beforeEach(() => {
    useI18nContextMock.mockReturnValue((key: string) => key);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render CustodianAccountsConnected', async () => {
    const { container, getByText } = render(<CustodianAccountsConnected />);
    expect(container).toMatchSnapshot();

    expect(getByText('allCustodianAccountsConnectedTitle')).toBeInTheDocument();
  });
});
