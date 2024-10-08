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
import Name from './name';

jest.mock('../../../hooks/useDisplayName');

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const ADDRESS_NO_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54977';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const SAVED_NAME_MOCK = 'TestName';

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
    });

    const { container } = renderWithProvider(
      <Name type={NameType.ETHEREUM_ADDRESS} value={''} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with no saved name', () => {
    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
    });

    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_SAVED_NAME_MOCK}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with saved name', () => {
    useDisplayNameMock.mockReturnValue({
      name: SAVED_NAME_MOCK,
      hasPetname: true,
    });

    const { container } = renderWithProvider(
      <Name type={NameType.ETHEREUM_ADDRESS} value={ADDRESS_SAVED_NAME_MOCK} />,
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
        });

        renderWithProvider(
          <MetaMetricsContext.Provider value={trackEventMock}>
            <Name type={NameType.ETHEREUM_ADDRESS} value={value} />
          </MetaMetricsContext.Provider>,
          store,
        );

        expect(trackEventMock).toHaveBeenCalledWith({
          event: MetaMetricsEventName.PetnameDisplayed,
          category: MetaMetricsEventCategory.Petnames,
          properties: {
            petname_category: NameType.ETHEREUM_ADDRESS,
            has_petname: hasPetname,
          },
        });
      },
    );
  });
});
