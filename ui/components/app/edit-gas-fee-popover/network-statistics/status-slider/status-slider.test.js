import React from 'react';

import { renderWithProvider } from '../../../../../../test/jest';
import { GasFeeContext } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import StatusSlider from './status-slider';

const renderComponent = ({ networkCongestion }) => {
  const component = (
    <GasFeeContext.Provider value={{ gasFeeEstimates: { networkCongestion } }}>
      <StatusSlider />
    </GasFeeContext.Provider>
  );

  const store = configureStore();

  return renderWithProvider(component, store);
};

describe('StatusSlider', () => {
  it('should show "Not busy" when networkCongestion is less than 0.33', () => {
    const { getByText } = renderComponent({ networkCongestion: 0.32 });
    expect(getByText('Not busy')).toBeInTheDocument();
  });

  it('should show "Stable" when networkCongestion is 0.33', () => {
    const { getByText } = renderComponent({ networkCongestion: 0.33 });
    expect(getByText('Stable')).toBeInTheDocument();
  });

  it('should show "Stable" when networkCongestion is between 0.33 and 0.66', () => {
    const { getByText } = renderComponent({ networkCongestion: 0.5 });
    expect(getByText('Stable')).toBeInTheDocument();
  });

  it('should show "Busy" when networkCongestion is 0.66', () => {
    const { getByText } = renderComponent({ networkCongestion: 0.66 });
    expect(getByText('Busy')).toBeInTheDocument();
  });

  it('should show "Busy" when networkCongestion is greater than 0.66', () => {
    const { getByText } = renderComponent({ networkCongestion: 0.67 });
    expect(getByText('Busy')).toBeInTheDocument();
  });

  it('should show "Stable" if networkCongestion is not available yet', () => {
    const { getByText } = renderComponent({});
    expect(getByText('Stable')).toBeInTheDocument();
  });

  it('should position the arrow based on converting networkCongestion to a percentage rounded to the nearest 10', () => {
    const { getByTestId } = renderComponent({ networkCongestion: 0.23 });
    expect(getByTestId('status-slider-arrow-border')).toHaveStyle(
      'margin-left: 20%',
    );
  });

  it('should position the arrow in the middle if networkCongestion has not been set yet', () => {
    const { getByTestId } = renderComponent({});
    expect(getByTestId('status-slider-arrow-border')).toHaveStyle(
      'margin-left: 50%',
    );
  });

  it('should color the arrow and label based on converting networkCongestion to a percentage rounded to the nearest 10', () => {
    const { getByTestId } = renderComponent({ networkCongestion: 0.23 });
    expect(getByTestId('status-slider-arrow')).toHaveStyle(
      'border-top-color: #2D70BA',
    );
    expect(getByTestId('status-slider-label')).toHaveStyle('color: #2D70BA');
  });

  it('should color the arrow and label for the end position if networkCongestion rounds to 100%', () => {
    const { getByTestId } = renderComponent({ networkCongestion: 0.95 });
    expect(getByTestId('status-slider-arrow')).toHaveStyle(
      'border-top-color: #D73A49',
    );
    expect(getByTestId('status-slider-label')).toHaveStyle('color: #D73A49');
  });

  it('should color the arrow and label for the middle position if networkCongestion has not been set yet', () => {
    const { getByTestId } = renderComponent({});
    expect(getByTestId('status-slider-arrow')).toHaveStyle(
      'border-top-color: #6A5D92',
    );
    expect(getByTestId('status-slider-label')).toHaveStyle('color: #6A5D92');
  });
});
