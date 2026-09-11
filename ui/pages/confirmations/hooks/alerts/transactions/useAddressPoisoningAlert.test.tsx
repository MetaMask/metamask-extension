import React from 'react';
import { renderHook } from '@testing-library/react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AddressPoisoningAlertContent } from '../../../components/send/address-poisoning-alert-content/address-poisoning-alert-content';
import { getSendRecipients } from '../../../utils/getSendRecipients';
import { useTransactionMetadataRequestOptional } from '../../transactions/useTransactionMetadataRequest';
import {
  type AddressPoisoningDetectionResult,
  useAddressPoisoningDetection,
} from '../../send/useAddressPoisoningDetection';
import { AlertsName } from '../constants';
import { useAddressPoisoningAlert } from './useAddressPoisoningAlert';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../utils/getSendRecipients');
jest.mock('../../transactions/useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequestOptional: jest.fn(),
}));
jest.mock('../../send/useAddressPoisoningDetection', () => ({
  useAddressPoisoningDetection: jest.fn(),
}));

const mockUseI18nContext = jest.mocked(useI18nContext);
const mockGetSendRecipients = jest.mocked(getSendRecipients);
const mockUseTransactionMetadataRequestOptional = jest.mocked(
  useTransactionMetadataRequestOptional,
);
const mockUseAddressPoisoningDetection = jest.mocked(
  useAddressPoisoningDetection,
);

describe('useAddressPoisoningAlert', () => {
  const recipient = '0x1111ffffffffffffffffffffffffffffffffaaaa';
  const knownAddress = '0x111122223333444455556666777788889999aaaa';
  const diffIndices = [6, 7];
  const match = {
    knownAddress,
    prefixMatchLength: 4,
    suffixMatchLength: 4,
    poisoningScore: 8,
    diffIndices,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue((key: string) => key);
    mockUseTransactionMetadataRequestOptional.mockReturnValue(
      {} as TransactionMeta,
    );
    mockGetSendRecipients.mockReturnValue([recipient]);
    mockUseAddressPoisoningDetection.mockReturnValue({
      isPoisoningSuspect: false,
      bestMatch: null,
      matches: [],
      pending: false,
    });
  });

  const noAlertCases: {
    name: string;
    recipientAddress: string | undefined;
    detection: AddressPoisoningDetectionResult;
  }[] = [
    {
      name: 'recipient address is missing',
      recipientAddress: undefined,
      detection: {
        isPoisoningSuspect: true,
        bestMatch: match,
        matches: [match],
        pending: false,
      },
    },
    {
      name: 'address is not a poisoning suspect',
      recipientAddress: recipient,
      detection: {
        isPoisoningSuspect: false,
        bestMatch: match,
        matches: [match],
        pending: false,
      },
    },
    {
      name: 'best match is missing',
      recipientAddress: recipient,
      detection: {
        isPoisoningSuspect: true,
        bestMatch: null,
        matches: [],
        pending: false,
      },
    },
  ];

  for (const { name, recipientAddress, detection } of noAlertCases) {
    it(`returns no alerts when ${name}`, () => {
      mockGetSendRecipients.mockReturnValue(
        recipientAddress ? [recipientAddress] : [],
      );
      mockUseAddressPoisoningDetection.mockReturnValue(detection);

      const { result } = renderHook(() => useAddressPoisoningAlert());

      expect(result.current).toEqual([]);
    });
  }

  it('returns no alerts when transaction metadata is missing', () => {
    mockUseTransactionMetadataRequestOptional.mockReturnValue(undefined);
    mockUseAddressPoisoningDetection.mockReturnValue({
      isPoisoningSuspect: true,
      bestMatch: match,
      matches: [match],
      pending: false,
    });

    const { result } = renderHook(() => useAddressPoisoningAlert());

    expect(result.current).toEqual([]);
    expect(mockGetSendRecipients).not.toHaveBeenCalled();
  });

  it('returns an address poisoning alert for a suspect recipient', () => {
    mockUseAddressPoisoningDetection.mockReturnValue({
      isPoisoningSuspect: true,
      bestMatch: match,
      matches: [match],
      pending: false,
    });

    const { result } = renderHook(() => useAddressPoisoningAlert());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      key: AlertsName.AddressPoisoning,
      field: RowAlertKey.InteractingWith,
      reason: 'addressPoisoningTitle',
      inlineAlertText: 'addressPoisoningBadge',
      severity: Severity.Danger,
      isBlocking: false,
    });

    const content = result.current[0].content as React.ReactElement<{
      children: React.ReactNode;
    }>;
    const children = React.Children.toArray(content.props.children);
    const detailsWrapper = children[1] as React.ReactElement<{
      children: React.ReactElement<{
        address: string;
        knownAddress: string;
        diffIndices: number[];
      }>;
    }>;
    const details = detailsWrapper.props.children;

    expect(details.type).toBe(AddressPoisoningAlertContent);
    expect(details.props).toMatchObject({
      address: recipient,
      knownAddress,
      diffIndices,
    });
  });
});
