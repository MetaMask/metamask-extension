import React from 'react';
import { renderWithProvider, screen } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import AdvancedGasFeeInputSubtext from './advanced-gas-fee-input-subtext';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn().mockResolvedValue(null),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

const renderComponent = ({ props = {}, state = {} } = {}) => {
  const store = configureStore(state);
  return renderWithProvider(<AdvancedGasFeeInputSubtext {...props} />, store);
};

describe('AdvancedGasFeeInputSubtext', () => {
  describe('when "latest" is non-nullish', () => {
    it('should render the latest fee if given a fee', () => {
      renderComponent({
        props: {
          latest: '123.12345',
        },
      });

      expect(screen.getByText('123.12 GWEI')).toBeInTheDocument();
    });

    it('should render the latest fee range if given a fee range', () => {
      renderComponent({
        props: {
          latest: ['123.456', '456.789'],
        },
      });

      expect(screen.getByText('123.46 - 456.79 GWEI')).toBeInTheDocument();
    });

    it('should render a fee trend arrow image if given "up" as the trend', () => {
      renderComponent({
        props: {
          latest: '123.12345',
          trend: 'up',
        },
      });

      expect(screen.getByTitle('up arrow')).toBeInTheDocument();
    });

    it('should render a fee trend arrow image if given "down" as the trend', () => {
      renderComponent({
        props: {
          latest: '123.12345',
          trend: 'down',
        },
      });

      expect(screen.getByTitle('down arrow')).toBeInTheDocument();
    });

    it('should render a fee trend arrow image if given "level" as the trend', () => {
      renderComponent({
        props: {
          latest: '123.12345',
          trend: 'level',
        },
      });

      expect(screen.getByTitle('level arrow')).toBeInTheDocument();
    });

    it('should not render a fee trend arrow image if given an invalid trend', () => {
      // Suppress warning from PropTypes, which we expect
      jest.spyOn(console, 'error').mockImplementation();

      renderComponent({
        props: {
          latest: '123.12345',
          trend: 'whatever',
        },
      });

      expect(screen.queryByTestId('fee-arrow')).not.toBeInTheDocument();
    });

    it('should not render a fee trend arrow image if given a nullish trend', () => {
      renderComponent({
        props: {
          latest: '123.12345',
          trend: null,
        },
      });

      expect(screen.queryByTestId('fee-arrow')).not.toBeInTheDocument();
    });
  });

  describe('when "latest" is nullish', () => {
    it('should not render the container for the latest fee', () => {
      renderComponent({
        props: {
          latest: null,
        },
      });

      expect(screen.queryByTestId('latest')).not.toBeInTheDocument();
    });
  });

  describe('when "historical" is not nullish', () => {
    it('should render the historical fee if given a fee', () => {
      renderComponent({
        props: {
          historical: '123.12345',
        },
      });

      expect(screen.getByText('123.12 GWEI')).toBeInTheDocument();
    });

    it('should render the historical fee range if given a fee range', () => {
      renderComponent({
        props: {
          historical: ['123.456', '456.789'],
        },
      });

      expect(screen.getByText('123.46 - 456.79 GWEI')).toBeInTheDocument();
    });
  });

  describe('when "historical" is nullish', () => {
    it('should not render the container for the historical fee', () => {
      renderComponent({
        props: {
          historical: null,
        },
      });

      expect(screen.queryByTestId('historical')).not.toBeInTheDocument();
    });
  });
});
