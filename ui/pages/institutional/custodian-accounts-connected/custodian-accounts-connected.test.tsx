import React from 'react';
import { render, waitFor } from '@testing-library/react';
import CustodianAccountsConnected from './custodian-accounts-connected';
import { Box } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
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

    await waitFor(() => {
      expect(
        getByText('allCustodianAccountsConnectedTitle'),
      ).toBeInTheDocument();
    });
  });
});
