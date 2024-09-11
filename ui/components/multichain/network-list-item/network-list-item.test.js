/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  POL_TOKEN_IMAGE_URL,
  POLYGON_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { getLocalNetworkMenuRedesignFeatureFlag } from '../../../helpers/utils/feature-flags';
import { NetworkListItem } from '.';

const DEFAULT_PROPS = {
  name: POLYGON_DISPLAY_NAME,
  iconSrc: POL_TOKEN_IMAGE_URL,
  selected: false,
  onClick: () => undefined,
  onDeleteClick: () => undefined,
};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const generateUseSelectorRouter = (opts) => (selector) => {
  if (selector === getLocalNetworkMenuRedesignFeatureFlag) {
    return opts.networkMenuRedesign ?? false;
  }
  return undefined;
};

describe('NetworkListItem', () => {
  it('renders properly', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        networkMenuRedesign: false,
      }),
    );
    const { container } = render(<NetworkListItem {...DEFAULT_PROPS} />);
    expect(container).toMatchSnapshot();
  });

  it('does not render the delete icon when no onDeleteClick is clicked', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        networkMenuRedesign: false,
      }),
    );
    const { container } = render(
      <NetworkListItem {...DEFAULT_PROPS} onDeleteClick={null} />,
    );
    expect(
      container.querySelector('.multichain-network-list-item__delete'),
    ).toBeNull();
  });

  it('shows as selected when selected', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        networkMenuRedesign: false,
      }),
    );
    const { container } = render(
      <NetworkListItem {...DEFAULT_PROPS} selected />,
    );
    expect(
      container.querySelector(
        '.multichain-network-list-item__selected-indicator',
      ),
    ).toBeInTheDocument();
  });

  it('renders a tooltip when the network name is very long', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        networkMenuRedesign: false,
      }),
    );
    const { container } = render(
      <NetworkListItem
        {...DEFAULT_PROPS}
        name="This is a very long network name that will be truncated"
      />,
    );
    expect(
      container.querySelector('.multichain-network-list-item__tooltip'),
    ).toBeInTheDocument();
  });

  it('executes onClick when the item is clicked', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        networkMenuRedesign: false,
      }),
    );
    const onClick = jest.fn();
    const { container } = render(
      <NetworkListItem {...DEFAULT_PROPS} onClick={onClick} />,
    );
    fireEvent.click(container.querySelector('.multichain-network-list-item'));
    expect(onClick).toHaveBeenCalled();
  });

  it('executes onDeleteClick when the delete button is clicked', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        networkMenuRedesign: true,
      }),
    );
    const onDeleteClick = jest.fn();
    const onClick = jest.fn();

    const { getByTestId } = render(
      <NetworkListItem
        {...DEFAULT_PROPS}
        onDeleteClick={onDeleteClick}
        onClick={onClick}
      />,
    );

    fireEvent.click(getByTestId('network-list-item-options-button'));

    fireEvent.click(getByTestId('network-list-item-options-delete'));
    expect(onDeleteClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(0);
  });
});
