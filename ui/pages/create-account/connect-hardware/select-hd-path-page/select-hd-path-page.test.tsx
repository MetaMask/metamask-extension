import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { LEDGER_HD_PATHS } from '../utils/hardware-hd-paths';
import type { SelectHdPathPageProps } from './select-hd-path-page.types';
import { SelectHdPathPage } from '.';

const defaultProps: SelectHdPathPageProps = {
  hdPaths: LEDGER_HD_PATHS,
  selectedPath: LEDGER_HD_PATHS[0].value,
  onPathChange: jest.fn(),
  onBack: jest.fn(),
};

const renderPage = (props: Partial<SelectHdPathPageProps> = {}) => {
  const mergedProps: SelectHdPathPageProps = {
    ...defaultProps,
    ...props,
  };

  return {
    props: mergedProps,
    ...renderWithProvider(<SelectHdPathPage {...mergedProps} />),
  };
};

describe('SelectHdPathPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the title, options, continue button, and initial selection', () => {
      renderPage({ selectedPath: LEDGER_HD_PATHS[1].value });

      expect(screen.getByText(tEn('selectHdPath'))).toBeInTheDocument();
      expect(screen.getAllByTestId('hardware-hd-path-option')).toHaveLength(3);
      expect(
        screen.getByTestId('select-hd-path-page-continue-button'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: LEDGER_HD_PATHS[1].name }),
      ).toBeChecked();
    });

    it('renders no HD path options when hdPaths is empty', () => {
      renderPage({ hdPaths: [] });

      expect(
        screen.queryByTestId('hardware-hd-path-option'),
      ).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('calls onBack when the back button is clicked', () => {
      const { props } = renderPage();

      fireEvent.click(screen.getByTestId('select-hd-path-page-back-button'));

      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('path selection', () => {
    it('updates the pending selection without calling onPathChange', () => {
      const { props } = renderPage();

      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));

      expect(
        screen.getByRole('checkbox', { name: LEDGER_HD_PATHS[1].name }),
      ).toBeChecked();
      expect(props.onPathChange).not.toHaveBeenCalled();
    });

    it('calls onPathChange with the pending path when Continue is clicked', () => {
      const { props } = renderPage();

      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));
      fireEvent.click(
        screen.getByTestId('select-hd-path-page-continue-button'),
      );

      expect(props.onPathChange).toHaveBeenCalledTimes(1);
      expect(props.onPathChange).toHaveBeenCalledWith(LEDGER_HD_PATHS[1].value);
    });

    it('calls onPathChange with the current path when Continue is clicked without changes', () => {
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId('select-hd-path-page-continue-button'),
      );

      expect(props.onPathChange).toHaveBeenCalledTimes(1);
      expect(props.onPathChange).toHaveBeenCalledWith(LEDGER_HD_PATHS[0].value);
    });
  });
});
