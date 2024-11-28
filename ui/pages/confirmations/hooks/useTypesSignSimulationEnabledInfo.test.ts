import {
  DecodingData,
  DecodingDataChangeType,
} from '@metamask/signature-controller';

import { getMockTypedSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  permitSignatureMsg,
  permitSingleSignatureMsg,
  seaportSignatureMsg,
  unapprovedTypedSignMsgV3,
} from '../../../../test/data/confirmations/typed_sign';
import * as SignatureEventFragment from './useSignatureEventFragment';
import { useTypesSignSimulationEnabledInfo } from './useTypesSignSimulationEnabledInfo';

describe('useTypesSignSimulationEnabledInfo', () => {
  it('return false if user has disabled simulations', async () => {
    const state = getMockTypedSignConfirmStateForRequest(
      permitSingleSignatureMsg,
      {
        metamask: { useTransactionSimulations: false },
      },
    );

    const { result } = renderHookWithConfirmContextProvider(
      () => useTypesSignSimulationEnabledInfo(),
      state,
    );

    expect(result.current).toBe(false);
  });

  it('return false if request is not types sign V4', async () => {
    const state = getMockTypedSignConfirmStateForRequest(
      unapprovedTypedSignMsgV3,
      {
        metamask: { useTransactionSimulations: true },
      },
    );

    const { result } = renderHookWithConfirmContextProvider(
      () => useTypesSignSimulationEnabledInfo(),
      state,
    );

    expect(result.current).toBe(false);
  });

  it('return true for typed sign v4 permit request', async () => {
    const state = getMockTypedSignConfirmStateForRequest(
      permitSingleSignatureMsg,
      {
        metamask: { useTransactionSimulations: true },
      },
    );

    const { result } = renderHookWithConfirmContextProvider(
      () => useTypesSignSimulationEnabledInfo(),
      state,
    );

    expect(result.current).toBe(true);
  });

  it('return true for typed sign v4 seaport request', async () => {
    const state = getMockTypedSignConfirmStateForRequest(seaportSignatureMsg, {
      metamask: { useTransactionSimulations: true },
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => useTypesSignSimulationEnabledInfo(),
      state,
    );

    expect(result.current).toBe(true);
  });
});
