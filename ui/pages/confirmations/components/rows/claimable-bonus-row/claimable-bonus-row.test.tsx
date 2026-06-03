import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../../../components/app/musd/constants';
import { MetaMetricsEventName } from '../../../../../../shared/constants/metametrics';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { useIsTransactionPayLoading } from '../../../hooks/pay/useTransactionPayData';
import { ClaimableBonusRow } from './claimable-bonus-row';

jest.mock('../../../../../contexts/metametrics', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const _trackEvent = jest.fn().mockResolvedValue(undefined);
  const ctx = ReactActual.createContext({
    trackEvent: _trackEvent,
    bufferedTrace: jest.fn().mockResolvedValue(undefined),
    bufferedEndTrace: jest.fn().mockResolvedValue(undefined),
    onboardingParentContext: { current: null },
  });
  ctx.Provider = (({ children }: { children: React.ReactNode }) =>
    ReactActual.createElement(
      ReactActual.Fragment,
      null,
      children,
    )) as unknown as typeof ctx.Provider;
  return {
    MetaMetricsContext: ctx,
    LegacyMetaMetricsProvider: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(ReactActual.Fragment, null, children),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __mockTrackEvent: _trackEvent,
  };
});
const { __mockTrackEvent: mockTrackEvent } = jest.requireMock<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __mockTrackEvent: jest.Mock;
}>('../../../../../contexts/metametrics');

jest.mock('../../../hooks/pay/useTransactionPayData');

const mockStore = configureMockStore([]);

function render(props: { rowVariant?: ConfirmInfoRowSize } = {}) {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(
    <ClaimableBonusRow {...props} />,
    mockStore(state),
  );
}

describe('ClaimableBonusRow', () => {
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent.mockResolvedValue(undefined);
    useIsTransactionPayLoadingMock.mockReturnValue(false);
  });

  it('renders skeleton when loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId('claimable-bonus-row-skeleton')).toBeInTheDocument();
    expect(queryByTestId('claimable-bonus-row')).not.toBeInTheDocument();
  });

  it('renders the claimable bonus row with APY value', () => {
    const { getByTestId } = render();

    expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
    expect(getByTestId('claimable-bonus-value')).toHaveTextContent(
      `${MUSD_CONVERSION_APY}%`,
    );
  });

  it('exposes an accessible name on the claimable bonus info control', () => {
    const { getByRole } = render();

    expect(
      getByRole('button', {
        name: messages.musdClaimableBonusTooltipAria.message,
      }),
    ).toBeInTheDocument();
  });

  it('opens tooltip popover when info button is clicked', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId('claimable-bonus-tooltip-popover-button'));

    expect(getByTestId('claimable-bonus-tooltip-popover')).toBeInTheDocument();
  });

  it('closes tooltip popover when clicking outside', () => {
    const { getByTestId } = render();

    fireEvent.click(getByTestId('claimable-bonus-tooltip-popover-button'));
    expect(getByTestId('claimable-bonus-tooltip-popover')).toBeInTheDocument();

    fireEvent.click(document.body);
  });

  it('renders with Small variant', () => {
    const { getByTestId } = render({
      rowVariant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
    expect(getByTestId('claimable-bonus-value')).toHaveTextContent(
      `${MUSD_CONVERSION_APY}%`,
    );
  });

  it('renders with Default variant by default', () => {
    const { getByTestId } = render();

    expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
  });

  it('fires MusdBonusTermsOfUsePressed event when terms link is clicked', async () => {
    const { getByTestId } = render();

    await act(async () => {
      fireEvent.click(getByTestId('claimable-bonus-tooltip-popover-button'));
    });

    const termsLink = document.querySelector(
      `a[href="${MUSD_CONVERSION_BONUS_TERMS_OF_USE}"]`,
    ) as HTMLElement;
    expect(termsLink).not.toBeNull();
    fireEvent.click(termsLink);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: MetaMetricsEventName.MusdBonusTermsOfUsePressed,
        properties: expect.objectContaining({
          location: 'percentage_row',
          url: MUSD_CONVERSION_BONUS_TERMS_OF_USE,
        }),
      }),
    );
  });
});
