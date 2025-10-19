/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  POL_TOKEN_IMAGE_URL,
  POLYGON_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { NetworkListItem } from '.';

const DEFAULT_PROPS = {
  name: POLYGON_DISPLAY_NAME,
  chainId: '0x1',
  iconSrc: POL_TOKEN_IMAGE_URL,
  selected: false,
  onClick: () => undefined,
  onDeleteClick: () => undefined,
};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

describe('NetworkListItem', () => {
  it('renders properly', () => {
    const { container } = render(<NetworkListItem {...DEFAULT_PROPS} />);
    expect(container).toMatchSnapshot();
  });

  it('does not render the delete icon when no onDeleteClick is clicked', () => {
    const { container } = render(
      <NetworkListItem {...DEFAULT_PROPS} onDeleteClick={null} />,
    );
    expect(
      container.querySelector('.multichain-network-list-item__delete'),
    ).toBeNull();
  });

  it('shows as selected when selected', () => {
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
    const onClick = jest.fn();
    const { container } = render(
      <NetworkListItem {...DEFAULT_PROPS} onClick={onClick} />,
    );
    fireEvent.click(container.querySelector('.multichain-network-list-item'));
    expect(onClick).toHaveBeenCalled();
  });

  it('executes onDeleteClick when the delete button is clicked', () => {
    const onDeleteClick = jest.fn();
    const onClick = jest.fn();

    const { getByTestId } = render(
      <NetworkListItem
        {...DEFAULT_PROPS}
        onDeleteClick={onDeleteClick}
        onClick={onClick}
      />,
    );

    fireEvent.click(getByTestId('network-list-item-options-button-0x1'));

    fireEvent.click(getByTestId('network-list-item-options-delete'));
    expect(onDeleteClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(0);
  });
});

describe('NetworkListItem - Gas fees sponsored', () => {
  const { useSelector } = require('react-redux');

  beforeEach(() => {
    useSelector.mockClear();
    useSelector.mockReturnValue(undefined);
  });

  it('renders "No network fee" label when gas fees are sponsored for the network', () => {
    useSelector.mockReturnValue({
      '0x1': true, // Mainnet has gas fees sponsored
    });

    const { getByText } = render(
      <NetworkListItem {...DEFAULT_PROPS} chainId="0x1" />,
    );
    expect(getByText('[noNetworkFee]')).toBeInTheDocument();
  });

  it('does not render "No network fee" label when gas fees sponsored for the network is false', () => {
    useSelector.mockReturnValue({
      '0x1': false, // Mainnet has gas fees sponsored
    });

    const { queryByText } = render(
      <NetworkListItem {...DEFAULT_PROPS} chainId="0x1" />,
    );
    expect(queryByText('[noNetworkFee]')).not.toBeInTheDocument();
  });

  it('does not render "No network fee" label when feature flag is not set', () => {
    // useSelector already returns undefined by default from beforeEach
    const { queryByText } = render(
      <NetworkListItem {...DEFAULT_PROPS} chainId="0x1" />,
    );

    expect(queryByText('[noNetworkFee]')).not.toBeInTheDocument();
  });

  it('handles CAIP format chainId for gas fees sponsored check', () => {
    useSelector.mockReturnValue({
      '0x1': true, // Mainnet has gas fees sponsored
    });

    const { getByText } = render(
      <NetworkListItem {...DEFAULT_PROPS} chainId="eip155:1" />,
    );

    expect(getByText('[noNetworkFee]')).toBeInTheDocument();
  });

  it('does not render "No network fee" label when chainId is undefined', () => {
    useSelector.mockReturnValue({
      '0x1': true,
    });

    const { queryByText } = render(
      <NetworkListItem {...DEFAULT_PROPS} chainId={undefined} />,
    );

    expect(queryByText('[noNetworkFee]')).not.toBeInTheDocument();
  });
});
