import * as React from 'react';
import { NameType } from '@metamask/name-controller';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useDisplayName } from '../../../hooks/useDisplayName';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import Name from './name';

jest.mock('../../../hooks/useDisplayName');

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const ADDRESS_NO_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54977';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const SAVED_NAME_MOCK = 'TestName';
const VARIATION_MOCK = 'testVariation';

const STATE_MOCK = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
  },
};

describe('Name', () => {
  const store = configureStore()(STATE_MOCK);
  const useDisplayNameMock = jest.mocked(useDisplayName);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders when no address value is passed', () => {
    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
      icon: {
        name: IconName.Question,
        color: undefined,
      },
    });

    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={''}
        variation={VARIATION_MOCK}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with no saved name', () => {
    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
      icon: {
        name: IconName.Question,
        color: undefined,
      },
    });

    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with saved name', () => {
    useDisplayNameMock.mockReturnValue({
      name: SAVED_NAME_MOCK,
      hasPetname: true,
      displayState: TrustSignalDisplayState.Petname,
      icon: {
        name: IconName.VerifiedFilled,
        color: IconColor.infoDefault,
      },
    });

    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with long saved name', () => {
    useDisplayNameMock.mockReturnValue({
      name: "Very long and length saved name that doesn't seem to end, really.",
      hasPetname: true,
      displayState: TrustSignalDisplayState.Petname,
      icon: {
        name: IconName.VerifiedFilled,
        color: IconColor.infoDefault,
      },
    });

    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with image', () => {
    useDisplayNameMock.mockReturnValue({
      name: SAVED_NAME_MOCK,
      hasPetname: true,
      image: 'test-image',
      displayState: TrustSignalDisplayState.Petname,
      icon: {
        name: IconName.VerifiedFilled,
        color: IconColor.infoDefault,
      },
    });

    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  describe('metrics', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['saved', ADDRESS_SAVED_NAME_MOCK, true],
      ['not saved', ADDRESS_NO_SAVED_NAME_MOCK, false],
    ])(
      'sends displayed event with %s name',
      async (_: string, value: string, hasPetname: boolean) => {
        const trackEventMock = jest.fn();

        useDisplayNameMock.mockReturnValue({
          name: hasPetname ? SAVED_NAME_MOCK : null,
          hasPetname,
          displayState: hasPetname
            ? TrustSignalDisplayState.Petname
            : TrustSignalDisplayState.Unknown,
          icon: {
            name: IconName.VerifiedFilled,
            color: IconColor.infoDefault,
          },
        });

        renderWithProvider(
          <MetaMetricsContext.Provider value={{ trackEvent: trackEventMock }}>
            <Name
              type={NameType.ETHEREUM_ADDRESS}
              value={value}
              variation={VARIATION_MOCK}
            />
          </MetaMetricsContext.Provider>,
          store,
        );

        expect(trackEventMock).toHaveBeenCalledWith({
          event: MetaMetricsEventName.PetnameDisplayed,
          category: MetaMetricsEventCategory.Petnames,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            petname_category: NameType.ETHEREUM_ADDRESS,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            has_petname: hasPetname,
          },
        });
      },
    );
  });
});
