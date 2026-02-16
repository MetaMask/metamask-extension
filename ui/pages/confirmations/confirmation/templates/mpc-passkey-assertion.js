import { providerErrors } from '@metamask/rpc-errors';
import {
  TypographyVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { signWithPasskey } from '../../../../../shared/lib/passkeys';

/**
 * Confirmation template for MPC passkey assertions.
 *
 * When the MPC keyring calls `getVerifierToken`, the background creates an
 * approval request of type `mpc_passkey_assertion`.  This template renders a
 * minimal confirmation page and, on submit, calls the WebAuthn
 * `navigator.credentials.get()` API to create a passkey assertion.  The
 * serialised assertion is passed back to the keyring via
 * `resolvePendingApproval`.
 *
 * @param pendingApproval
 * @param t
 * @param actions
 */
function getValues(pendingApproval, t, actions) {
  const { verifierId } = pendingApproval.requestData;

  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: t('mpcPasskeyAssertionTitle'),
        props: {
          variant: TypographyVariant.H3,
          align: 'center',
          fontWeight: 'normal',
          boxProps: {
            margin: [0, 0, 2],
            padding: [0, 4, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: t('mpcPasskeyAssertionDescription'),
        props: {
          variant: TypographyVariant.H7,
          color: TextColor.textAlternative,
          align: 'center',
          boxProps: {
            padding: [0, 4, 0, 4],
          },
        },
      },
    ],
    submitText: t('mpcPasskeyAssertionSubmit'),
    cancelText: t('cancel'),
    onSubmit: async () => {
      try {
        const credentialId = localStorage.getItem(`mpc-passkey:${verifierId}`);
        if (!credentialId) {
          return [t('mpcPasskeyAssertionNotFound')];
        }

        const assertion = await signWithPasskey(credentialId);
        await actions.resolvePendingApproval(
          pendingApproval.id,
          JSON.stringify(assertion),
        );
      } catch (err) {
        return [err.message || t('mpcPasskeyAssertionFailed')];
      }
      return undefined;
    },
    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        providerErrors.userRejectedRequest().serialize(),
      ),
  };
}

const mpcPasskeyAssertion = {
  getValues,
};

export default mpcPasskeyAssertion;
