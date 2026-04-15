import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';
import { CandlePeriod } from '../constants/chartConfig';
import { PerpsCandlePeriodModal } from './perps-candle-period-modal';

const mockT = jest.fn((key: string) => key);

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

const mockGetEnvironmentType = jest.fn();

jest.mock('../../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

describe('PerpsCandlePeriodModal', () => {
  const defaultProps = {
    isOpen: true,
    selectedPeriod: CandlePeriod.FiveMinutes,
    onClose: jest.fn(),
    onPeriodChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
  });

  it('renders as a bottom sheet in popup mode', () => {
    render(<PerpsCandlePeriodModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toHaveStyle({
      marginTop: 'auto',
      width: '100%',
      maxWidth: '100%',
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0',
    });
  });

  it('renders as a bottom sheet in sidepanel mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

    render(<PerpsCandlePeriodModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toHaveStyle({
      marginTop: 'auto',
      maxWidth: '100%',
    });
  });

  it('renders as a centered modal in fullscreen mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

    render(<PerpsCandlePeriodModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toHaveStyle({
      width: '100%',
    });
    expect(screen.getByRole('dialog')).not.toHaveStyle({
      marginTop: 'auto',
      borderBottomLeftRadius: '0',
    });
  });

  it('selects a period and closes the modal', () => {
    render(<PerpsCandlePeriodModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId('perps-candle-period-modal-30m'));

    expect(defaultProps.onPeriodChange).toHaveBeenCalledWith(
      CandlePeriod.ThirtyMinutes,
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('only marks 1M as selected when the monthly period is selected', () => {
    render(
      <PerpsCandlePeriodModal
        {...defaultProps}
        selectedPeriod={CandlePeriod.OneMonth}
      />,
    );

    expect(screen.getByTestId('perps-candle-period-modal-1M')).toHaveClass(
      'bg-overlay-inverse',
    );
    expect(screen.getByTestId('perps-candle-period-modal-1m')).not.toHaveClass(
      'bg-overlay-inverse',
    );
  });

  it('closes when the close button is clicked', () => {
    render(<PerpsCandlePeriodModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText(mockT('close')));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
