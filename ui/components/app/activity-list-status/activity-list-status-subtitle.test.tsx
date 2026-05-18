import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../../../shared/constants/transaction';
import { ActivityListStatusSubtitle } from './activity-list-status-subtitle';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../ui/tooltip', () => {
  const MockTooltip = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  );

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
    __esModule: true,
    default: MockTooltip,
  };
});

describe('ActivityListStatusSubtitle', () => {
  it('renders signing status text', () => {
    render(<ActivityListStatusSubtitle status={TransactionStatus.approved} />);
    expect(screen.getByText('signing')).toBeInTheDocument();
  });

  it('renders nothing for confirmed status', () => {
    const { container } = render(
      <ActivityListStatusSubtitle status={TransactionStatus.confirmed} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders cancelled status text', () => {
    render(
      <ActivityListStatusSubtitle status={TransactionGroupStatus.cancelled} />,
    );
    expect(
      screen.getByText(TransactionGroupStatus.cancelled),
    ).toBeInTheDocument();
  });
});
