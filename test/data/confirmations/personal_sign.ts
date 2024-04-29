export const PERSONAL_SIGN_SENDER_ADDRESS = '0x8eeee1781fd885ff5ddef7789486676961873d12';

export const unapprovedPersonalSignMsg = {
  id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
  status: 'unapproved',
  time: new Date().getTime(),
  type: 'personal_sign',
  securityProviderResponse: null,
  msgParams: {
    from: PERSONAL_SIGN_SENDER_ADDRESS,
    data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
    origin: 'https://metamask.github.io',
    siwe: { isSIWEMessage: false, parsedMessage: null },
  },
};
