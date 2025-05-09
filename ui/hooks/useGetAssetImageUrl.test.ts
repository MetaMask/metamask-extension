import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { getAssetImageURL } from '../helpers/utils/util';
import useGetAssetImageUrl from './useGetAssetImageUrl';

jest.mock('../helpers/utils/util', () => ({
  getAssetImageURL: jest.fn(),
}));

const mockGetAssetImageURL = getAssetImageURL as jest.Mock;
const testIpfsGateway = 'dweb.link';
describe('useGetAssetImageUrl', () => {
  it('should return data successfully', async () => {
    const testIpfsImg =
      'ipfs://bafybeieazx4q4ofby24w6n6ftmpad65k4u3vkavv6qnmsazwoe6gaced7m/728.png';
    const expectedRes =
      'https://bafybeieazx4q4ofby24w6n6ftmpad65k4u3vkavv6qnmsazwoe6gaced7m.ipfs.dweb.link/728.png';

    mockGetAssetImageURL.mockResolvedValueOnce(expectedRes);
    let result;

    await act(async () => {
      result = renderHook(() =>
        useGetAssetImageUrl(testIpfsImg, testIpfsGateway),
      );
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as unknown as Record<string, any>).result.current).toEqual(
      expectedRes,
    );
  });

  it('should return data successfully when image is null', async () => {
    mockGetAssetImageURL.mockResolvedValueOnce('');
    const testImage = undefined;
    let result;
    await act(async () => {
      result = renderHook(() =>
        useGetAssetImageUrl(testImage, testIpfsGateway),
      );
    });
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as unknown as Record<string, any>).result.current).toEqual(
      '',
    );
  });
});
