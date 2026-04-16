import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import useGetAssetImageUrl from '../../../hooks/useGetAssetImageUrl';
import { useNftImageUrl } from './useNftImageUrl';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useGetAssetImageUrl', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

const mockUseSelector = useSelector as jest.Mock;
const mockUseGetAssetImageUrl = useGetAssetImageUrl as jest.Mock;

describe('useNftImageUrl', () => {
  const mockIpfsGateway = 'https://dweb.link';
  const mockProcessedImageUrl = 'https://processed-image-url.com';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue(mockIpfsGateway);
    mockUseGetAssetImageUrl.mockReturnValue(mockProcessedImageUrl);
  });

  it('returns original imageUrl when it is hosted (does not start with ipfs:)', () => {
    const hostedImageUrl = 'https://example.com/image.png';

    const { result } = renderHook(() => useNftImageUrl(hostedImageUrl));

    expect(result.current).toBe(hostedImageUrl);
    expect(mockUseSelector).toHaveBeenCalledTimes(1);
    expect(mockUseGetAssetImageUrl).toHaveBeenCalledWith(
      hostedImageUrl,
      mockIpfsGateway,
    );
  });

  it('returns processed imageUrl when imageUrl starts with ipfs:', () => {
    const ipfsImageUrl = 'ipfs://QmTest123/image.png';

    const { result } = renderHook(() => useNftImageUrl(ipfsImageUrl));

    expect(result.current).toBe(mockProcessedImageUrl);
    expect(mockUseSelector).toHaveBeenCalledTimes(1);
    expect(mockUseGetAssetImageUrl).toHaveBeenCalledWith(
      ipfsImageUrl,
      mockIpfsGateway,
    );
  });

  it('returns processed imageUrl when imageUrl is empty', () => {
    const emptyImageUrl = '';

    const { result } = renderHook(() => useNftImageUrl(emptyImageUrl));

    expect(result.current).toBe(mockProcessedImageUrl);
    expect(mockUseSelector).toHaveBeenCalledTimes(1);
    expect(mockUseGetAssetImageUrl).toHaveBeenCalledWith(
      emptyImageUrl,
      mockIpfsGateway,
    );
  });

  it('returns processed imageUrl when imageUrl is undefined/null', () => {
    const { result } = renderHook(() =>
      useNftImageUrl(undefined as unknown as string),
    );

    expect(result.current).toBe(mockProcessedImageUrl);
    expect(mockUseSelector).toHaveBeenCalledTimes(1);
    expect(mockUseGetAssetImageUrl).toHaveBeenCalledWith(
      undefined,
      mockIpfsGateway,
    );
  });

  it('calls useGetAssetImageUrl with correct parameters', () => {
    const testImageUrl = 'https://example.com/test.png';

    renderHook(() => useNftImageUrl(testImageUrl));

    expect(mockUseGetAssetImageUrl).toHaveBeenCalledWith(
      testImageUrl,
      mockIpfsGateway,
    );
  });
});
