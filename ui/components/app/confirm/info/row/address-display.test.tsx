import React from 'react';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../../shared/constants/app';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { ConfirmInfoRowAddressDisplay } from './address-display';
import { TEST_ADDRESS } from './constants';

const getEnvironmentType = jest.requireMock(
  '../../../../../../app/scripts/lib/util',
).getEnvironmentType as jest.Mock;

jest.mock('../../../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

const defaultProps = {
  address: TEST_ADDRESS,
  chainId: '0x1',
  name: null as string | null,
  isAccount: false,
  image: undefined,
  displayState: TrustSignalDisplayState.Unknown,
};

const render = (props: Partial<typeof defaultProps> = {}) => {
  const store = configureStore({
    metamask: { ...mockState.metamask },
  });

  return renderWithProvider(
    <ConfirmInfoRowAddressDisplay {...defaultProps} {...props} />,
    store,
  );
};

describe('ConfirmInfoRowAddressDisplay', () => {
  it('renders display name element for unknown address', () => {
    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name')).toBeInTheDocument();
  });

  it('renders account name for known address', () => {
    const { getByTestId } = render({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Account 1',
      isAccount: true,
      displayState: TrustSignalDisplayState.Recognized,
    });
    expect(getByTestId('confirm-info-row-display-name')).toHaveTextContent(
      'Account 1',
    );
  });

  it('renders full address in fullscreen mode', () => {
    getEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

    const { getByTestId } = render();
    expect(getByTestId('confirm-info-row-display-name')).toHaveTextContent(
      TEST_ADDRESS,
    );
  });

  it('renders partially truncated address in side panel mode', () => {
    getEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

    const { getByTestId } = render();
    const textContent = getByTestId('confirm-info-row-display-name')
      .textContent as string;
    expect(textContent).toBe('0x5CfE73b6021E…474086a7e1');
  });

  it('renders truncated address in popup mode', () => {
    getEnvironmentType.mockReturnValue('popup');

    const { getByTestId } = render();
    const textContent = getByTestId('confirm-info-row-display-name')
      .textContent as string;
    expect(textContent).toBe('0x5CfE73b6021E…474086a7e1');
  });
});
