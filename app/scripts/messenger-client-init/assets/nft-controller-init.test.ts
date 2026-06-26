import {
  NftController,
  NftControllerMessenger,
} from '@metamask/assets-controllers';
import { AssetType } from '@metamask/bridge-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitFunction, MessengerClientInitRequest } from '../types';
import {
  getNftControllerInitMessenger,
  getNftControllerMessenger,
  NftControllerInitMessenger,
} from '../messengers/assets';
import { getRootMessenger } from '../../lib/messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import { NftControllerInit } from './nft-controller-init';

jest.mock('@metamask/assets-controllers');
jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<NftControllerMessenger, NftControllerInitMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNftControllerMessenger(baseControllerMessenger),
    initMessenger: getNftControllerInitMessenger(baseControllerMessenger),
  };
}

describe('NftControllerInit', () => {
  const nftControllerClassMock = jest.mocked(NftController);
  const trackEventMock = jest.mocked(trackEvent);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(NftControllerInit(requestMock).messengerClient).toBeInstanceOf(
      NftController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    NftControllerInit(requestMock);

    expect(nftControllerClassMock).toHaveBeenCalled();
  });

  it('tracks NFT added events through AnalyticsController', () => {
    const requestMock = buildInitRequestMock();
    NftControllerInit(requestMock);

    const { onNftAdded } = nftControllerClassMock.mock.calls[0][0];
    onNftAdded?.({
      address: '0xabc',
      symbol: 'NFT',
      tokenId: '1',
      standard: 'ERC721',
      source: 'manual',
    });

    expect(trackEventMock).toHaveBeenCalledWith(
      createEventBuilder(MetaMetricsEventName.NftAdded)
        .addCategory(MetaMetricsEventCategory.Wallet)
        .addSensitiveProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_contract_address: '0xabc',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: 'NFT',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_id: '1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_standard: 'ERC721',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_type: AssetType.NFT,
          source: 'manual',
        })
        .build(),
    );
  });
});
