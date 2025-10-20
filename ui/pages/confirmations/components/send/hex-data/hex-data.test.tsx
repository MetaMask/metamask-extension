import React from 'react';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  MOCK_NFT1155,
} from '../../../../../../test/data/send/assets';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import * as SendContext from '../../../context/send';
import { HexData } from './hex-data';

const render = (
  args?: Record<string, unknown>,
  setHexDataError = () => undefined,
) => {
  const store = configureStore(
    args ?? {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        featureFlags: {
          ...mockState.metamask.featureFlags,
          sendHexData: true,
        },
      },
    },
  );

  return renderWithProvider(
    <HexData setHexDataError={setHexDataError} />,
    store,
  );
};

describe('HexData', () => {
  it('should render correctly', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      updateHexData: jest.fn(),
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { getByText } = render();

    expect(getByText('Hex data')).toBeInTheDocument();
  });

  it('call updateHexData when hex data is changed', () => {
    const mockUpdateHexData = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      updateHexData: mockUpdateHexData,
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { getByRole } = render();

    fireEvent.change(getByRole('textbox'), {
      target: { value: '0x1' },
    });
    expect(mockUpdateHexData).toHaveBeenCalled();
  });

  it('display error if invalid hex data is entered', () => {
    const mockUpdateHexData = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      updateHexData: mockUpdateHexData,
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { getByRole, getByText } = render();

    fireEvent.change(getByRole('textbox'), {
      target: { value: '###' },
    });
    expect(getByText('Invalid hex data')).toBeInTheDocument();
  });

  it('return null for ERC20 send', () => {
    const mockUpdateHexData = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      updateHexData: mockUpdateHexData,
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { queryByText } = render();

    expect(queryByText('Hex data')).not.toBeInTheDocument();
  });

  it('return null for NFT send', () => {
    const mockUpdateHexData = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_NFT1155,
      updateHexData: mockUpdateHexData,
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { queryByText } = render();

    expect(queryByText('Hex data')).not.toBeInTheDocument();
  });

  it('return null if flag sendHexData is not set', () => {
    const mockUpdateHexData = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_NFT1155,
      updateHexData: mockUpdateHexData,
    } as unknown as ReturnType<typeof SendContext.useSendContext>);

    const { queryByText } = render({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        featureFlags: {
          ...mockState.metamask.featureFlags,
          sendHexData: false,
        },
      },
    });

    expect(queryByText('Hex data')).not.toBeInTheDocument();
  });
});
