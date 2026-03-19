import { TransactionType } from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { useWindowFocus } from '../../../hooks/useWindowFocus';
import { setTransactionActive } from '../../../store/actions';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';
import { useSignatureRequestOptional } from './useSignatureRequest';
import { useTransactionFocusEffect } from './useTransactionFocusEffect';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('./useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequestOptional: jest.fn(),
}));

jest.mock('./useSignatureRequest', () => ({
  useSignatureRequestOptional: jest.fn(),
}));

jest.mock('../../../hooks/useWindowFocus', () => ({
  useWindowFocus: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  setTransactionActive: jest.fn(),
}));

jest.mock('../../../../app/scripts/lib/util', () => ({
  getEnvironmentType: jest.fn(),
}));

const mockConfirmation = {
  id: '1',
  type: TransactionType.simpleSend,
};

describe('useTransactionFocusEffect', () => {
  const dispatchMock = jest.fn();
  const setTransactionActiveMock = setTransactionActive as jest.MockedFunction<
    typeof setTransactionActive
  >;
  const useTransactionMetadataRequestOptionalMock =
    useTransactionMetadataRequestOptional as jest.MockedFunction<
      typeof useTransactionMetadataRequestOptional
    >;
  const useSignatureRequestOptionalMock =
    useSignatureRequestOptional as jest.MockedFunction<
      typeof useSignatureRequestOptional
    >;
  const useWindowFocusMock = useWindowFocus as jest.MockedFunction<
    typeof useWindowFocus
  >;
  const useDispatchMock = useDispatch as jest.MockedFunction<
    typeof useDispatch
  >;
  const getEnvironmentTypeMock = getEnvironmentType as jest.MockedFunction<
    typeof getEnvironmentType
  >;

  beforeEach(() => {
    useDispatchMock.mockReturnValue(dispatchMock);
    useWindowFocusMock.mockReturnValue(true);
    getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    useTransactionMetadataRequestOptionalMock.mockReturnValue(
      mockConfirmation as never,
    );
    useSignatureRequestOptionalMock.mockReturnValue(undefined);

    setTransactionActiveMock.mockClear();
    dispatchMock.mockClear();
  });

  it('should focus the confirmation when window is focused and type is valid', () => {
    renderHook(() => useTransactionFocusEffect());

    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('1', true));
  });

  it('should focus new confirmation if previous confirmation is different', () => {
    const { rerender } = renderHook(() => useTransactionFocusEffect());

    const simpleSendConfirmation = {
      id: '2',
      type: TransactionType.simpleSend,
    };

    useTransactionMetadataRequestOptionalMock.mockReturnValue(
      simpleSendConfirmation as never,
    );

    rerender();

    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('1', false));
    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('2', true));
  });

  it('should unfocus the confirmation when window is not focused', () => {
    const { rerender } = renderHook(() => useTransactionFocusEffect());

    useWindowFocusMock.mockReturnValue(false);

    rerender();

    expect(dispatchMock).toHaveBeenCalledWith(setTransactionActive('1', false));
  });

  describe('when confirmation type is not valid', () => {
    it('should not focus transaction initially', () => {
      const signatureConfirmation = {
        id: '2',
        type: TransactionType.signTypedData,
      };

      useTransactionMetadataRequestOptionalMock.mockReturnValue(undefined);
      useSignatureRequestOptionalMock.mockReturnValue(
        signatureConfirmation as never,
      );

      renderHook(() => useTransactionFocusEffect());
      expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('should unfocus the previous transaction', () => {
      const { rerender } = renderHook(() => useTransactionFocusEffect());

      const signatureConfirmation = {
        id: '2',
        type: TransactionType.signTypedData,
      };

      useTransactionMetadataRequestOptionalMock.mockReturnValue(undefined);
      useSignatureRequestOptionalMock.mockReturnValue(
        signatureConfirmation as never,
      );

      rerender();

      expect(dispatchMock).toHaveBeenCalledWith(
        setTransactionActive('1', false),
      );
      expect(dispatchMock).toHaveBeenCalledWith(
        setTransactionActive('2', true),
      );
    });
  });

  describe('when environment is sidepanel', () => {
    beforeEach(() => {
      getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    });

    it('should set focus the confirmation even when window is not focused', () => {
      useWindowFocusMock.mockReturnValue(false);

      renderHook(() => useTransactionFocusEffect());

      expect(dispatchMock).toHaveBeenCalledWith(
        setTransactionActive('1', true),
      );
    });

    it('should not lose focus when window loses focus', () => {
      const { rerender } = renderHook(() => useTransactionFocusEffect());

      // Clear the initial focus call
      dispatchMock.mockClear();

      // Simulate window losing focus
      useWindowFocusMock.mockReturnValue(false);
      rerender();

      // Should not unfocus since it's a sidepanel
      expect(dispatchMock).not.toHaveBeenCalledWith(
        setTransactionActive('1', false),
      );
    });

    it('should focus new confirmation when switching confirmations', () => {
      useWindowFocusMock.mockReturnValue(false);

      const { rerender } = renderHook(() => useTransactionFocusEffect());

      const simpleSendConfirmation = {
        id: '2',
        type: TransactionType.simpleSend,
      };

      useTransactionMetadataRequestOptionalMock.mockReturnValue(
        simpleSendConfirmation as never,
      );

      rerender();

      expect(dispatchMock).toHaveBeenCalledWith(
        setTransactionActive('1', false),
      );
      expect(dispatchMock).toHaveBeenCalledWith(
        setTransactionActive('2', true),
      );
    });
  });
});
