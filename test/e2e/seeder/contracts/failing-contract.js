const failingContract = {
  bytecode:
    '0x6080604052348015600f57600080fd5b50608b8061001e6000396000f3fe6080604052610fff3411600e57fe5b3373ffffffffffffffffffffffffffffffffffffffff166108fc349081150290604051600060405180830381858888f193505050501580156053573d6000803e3d6000fd5b5000fea265627a7a72315820631b0dbb6b871cdbfdec2773af15ebfb8e52c794cf836fe27ec21f1aed17180f64736f6c634300050c0032',
  abi: [
    {
      payable: true,
      stateMutability: 'payable',
      type: 'fallback',
    },
  ],
};

module.exports = failingContract;
