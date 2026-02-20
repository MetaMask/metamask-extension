import type { PerpsControllerAccess } from '@metamask/perps-controller';

import {
  type CreatePerpsInfrastructureOptions,
  createPerpsInfrastructure,
} from './infrastructure';

type SubmitTransaction = PerpsControllerAccess['transaction']['submit'];
type SubmitTransactionParams = Parameters<SubmitTransaction>[0];
type SubmitTransactionOptions = Parameters<SubmitTransaction>[1];

function arrangeInfrastructure() {
  const submitRequestToBackground = jest.fn();
  const generateActionId = jest.fn().mockReturnValue(42);

  const options: CreatePerpsInfrastructureOptions = {
    selectedAddress: '0x1234',
    signTypedMessage: jest.fn().mockResolvedValue('0xsignature'),
    findNetworkClientIdForChain: jest.fn().mockReturnValue('mainnet'),
    submitRequestToBackground,
    generateActionId,
  };

  const infrastructure = createPerpsInfrastructure(options);

  return {
    infrastructure,
    submitRequestToBackground,
    generateActionId,
  };
}

function getSubmitFunction(
  infrastructure: ReturnType<typeof createPerpsInfrastructure>,
) {
  return infrastructure.controllers.transaction.submit;
}

function getForwardedAddTransactionOptions(
  submitRequestToBackground: jest.Mock,
): Record<string, unknown> {
  const submitCall = submitRequestToBackground.mock.calls[0];
  const submitArgs = submitCall?.[1] as unknown[];

  return submitArgs[1] as Record<string, unknown>;
}

describe('createPerpsInfrastructure', () => {
  describe('controllers.transaction.submit', () => {
    it('forwards only whitelisted transaction options', async () => {
      const { infrastructure, submitRequestToBackground, generateActionId } =
        arrangeInfrastructure();
      const submit = getSubmitFunction(infrastructure);

      const txParams: SubmitTransactionParams = {
        from: '0xabc',
        to: '0xdef',
        value: '0x0',
      };
      const txOptions = {
        networkClientId: Promise.resolve('mainnet') as unknown as string,
        origin: 'perps',
        type: 'perpsDeposit',
        gasFeeToken: '0x1234' as `0x${string}`,
        skipInitialGasEstimate: true,
        internalOnlyField: 'do-not-forward',
      } as SubmitTransactionOptions & { internalOnlyField: string };

      submitRequestToBackground.mockResolvedValue({
        id: 'tx-id',
        hash: '0xhash',
      });

      await submit(txParams, txOptions);

      expect(submitRequestToBackground).toHaveBeenCalledWith('addTransaction', [
        txParams,
        {
          networkClientId: 'mainnet',
          origin: 'perps',
          type: 'perpsDeposit',
          gasFeeToken: '0x1234',
          actionId: 42,
        },
      ]);
      expect(generateActionId).toHaveBeenCalledTimes(1);

      const forwardedOptions = getForwardedAddTransactionOptions(
        submitRequestToBackground,
      );
      expect(forwardedOptions.skipInitialGasEstimate).toBeUndefined();
      expect(forwardedOptions.internalOnlyField).toBeUndefined();
    });

    it('uses metamask as the default origin when none is provided', async () => {
      const { infrastructure, submitRequestToBackground } =
        arrangeInfrastructure();
      const submit = getSubmitFunction(infrastructure);

      submitRequestToBackground.mockResolvedValue({
        id: 'tx-id',
      });

      await submit({ from: '0xabc' }, {
        networkClientId: 'mainnet',
      } as SubmitTransactionOptions);

      const forwardedOptions = getForwardedAddTransactionOptions(
        submitRequestToBackground,
      );
      expect(forwardedOptions.origin).toBe('metamask');
      expect(forwardedOptions.networkClientId).toBe('mainnet');
      expect(forwardedOptions.actionId).toBe(42);
    });

    it('throws when network client id is missing', async () => {
      const { infrastructure, submitRequestToBackground } =
        arrangeInfrastructure();
      const submit = getSubmitFunction(infrastructure);

      await expect(
        submit(
          { from: '0xabc' },
          { networkClientId: undefined as unknown as string },
        ),
      ).rejects.toThrow('No network client found for Perps transaction');

      expect(submitRequestToBackground).not.toHaveBeenCalled();
    });

    it('returns transaction metadata and resolves hash fallback to empty string', async () => {
      const { infrastructure, submitRequestToBackground } =
        arrangeInfrastructure();
      const submit = getSubmitFunction(infrastructure);

      submitRequestToBackground.mockResolvedValue({
        id: 'tx-id',
      });

      const result = await submit({ from: '0xabc' }, {
        networkClientId: 'mainnet',
      } as SubmitTransactionOptions);

      expect(result.transactionMeta).toStrictEqual({ id: 'tx-id' });
      await expect(result.result).resolves.toBe('');
    });
  });
});
