export const MOCK_AUTH_PUB_KEY = '044f33908d63adb5bae1e3518edc88e7d4078452795871ea28217bab38f6098658f5418f3a0a58f8832660c28d5fb3981a578f94cce79094dbce6a2c131856fa4d'

export const MOCK_KEY_SHARE_DATA = {
  verifier: 'torus-test-health-aggregate',
  verifier_id: 'e2e-user-47b4c824-6dcb-4208-8ed7-56e9957887e4',
  pub_key: MOCK_AUTH_PUB_KEY,
  share_import_items: [
    {
      encrypted_share: '{"data":"4d6b10cc51f711ff226d92aa14ef72c393861d268091d441e5eb3c69e24c0ac1c50c5a102f8d557dd01e07c790d1099d","metadata":{"iv":"d34ee5b93b043308cccc03e93e1365aa","ephemPublicKey":"04ebf01702c6ceb18f30d07416e33a0a58bb5db81b87f00ceeeed7937f3351a5f823e67d4f1a8d14eac74480f8dee09abf8a2b6dce05cb03c0a0f912bea7493c31","mac":"9504970e6b2b2f23e27bf5b58ea203558adb91e3233545b6140dd79f939e6ef0","mode":"AES256"}}',
      encrypted_auth_token: '{"data":"57e223005fc5a787c281da09e940e4af74c2972a70adf6aa75596d0fb23aaf545d350f75856915160e04a740f4030d4bf30265e35a1045172e72a0da7ac2bea5","metadata":{"iv":"23c7b10f64d24a49ca6d8e3facaa1c78","ephemPublicKey":"04f6346e2a3e3c2e0df9efc524b830c3b44ff435d8550fa062fd085e9d22c7a6d9007868b64df22db0f7bcbb21148b2cc633004f77df612fc1ae38d815848724de","mac":"ae8d86c616c57617cb3dac9d10b3779ec4df20070816b99d0b668588cd9c8959","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 1,
      sss_endpoint: 'https://node-1.dev-node.web3auth.io/sss/jrpc'
    },
    {
      encrypted_share: '{"data":"03ca6602b403df9357359d6e11189944cfe1928d6ab2af2791d8298345d89f856306868525591c40d6c2fec52080f5fc","metadata":{"iv":"97f7433b3cbe2fd722c9c0374614dc62","ephemPublicKey":"04f0321c9f3b28205d63c39c18ab9e2cc07e39afbfea5855a68f92f62369a1a3956bf7acc2389db3464da2f175b4e58f1762b645783d23e55e0c3e8b805e0aad21","mac":"91f541a86919d11d536a719f73caa35acdaca2920e7829ca475cd33ad147ac59","mode":"AES256"}}',
      encrypted_auth_token: '{"data":"2aa3e12e1c20b5b8f83162059f08f13ce064ba95d9ba9b8260557b300f7679dbaf9c9c63550a480713a31adfa32f47c94ad0deec62e07eb9952be7efab3e6667","metadata":{"iv":"eb2d2b737ee4d35fb5f7121a872fac83","ephemPublicKey":"04576d652eaccbf6096b0cbda95991400ae7af5bc998fa8779fc57855ba617a9a293ecfbd98515fb03bf87a138e6af1efec9534d385222004c740046b6ed937b6c","mac":"681632ebd344663c4952329e09657815120262bf8e2257926370336ddc4504ed","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 2,
      sss_endpoint: 'https://node-2.dev-node.web3auth.io/sss/jrpc'
    },
    {
      encrypted_share: '{"data":"218c035a69760e28b666faca04d07a5ce462197c54595b4fee3adca0986d4cfb5d75eec98c1c380f559e1cce51478c00","metadata":{"iv":"abb0ad201ced69a7cece86cb45ddd25b","ephemPublicKey":"04b935fe7f1f6cf33ca3f28f8acb883e601b6fc825ce22e1348901c3377c711af7c148a4cf7ca8e3e0b3f87d139402ee69508047fd12f72e10dfa82d9ae42185c6","mac":"023f7a5802474d1a1193aa1acdafaabdfbd9d0e6f9e632b46609466e15a9673a","mode":"AES256"}}',
      encrypted_auth_token: '{"data":"660e23b0eaf32e3be75034e114215db04aa4cc3e08c9532c7e6e77d931eb5ca7475bb41cddaae72abdd9123b919aa5a35d96d0cd5026ef054681bead03742c1e","metadata":{"iv":"3f01658f8e5e54275dbceacc60ee30e1","ephemPublicKey":"04e021c6f8a4546e561a6308a5053826224a4debb24fe3620a03100b1d5df61a78d14f5f3147205db34f9e79e9eee752d2e36648066f5bde513f5888b1c93c6911","mac":"30136a5471075c0c6e0b8959a7b06745d25e60eb322bd61a8f369dab44240f0a","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 3,
      sss_endpoint: 'https://node-3.dev-node.web3auth.io/sss/jrpc'
    },
    {
      encrypted_share: '{"data":"2d5a7f2ebee60a489ae63a5a821235500dbeb51afc70d090543274e6eb461c4ef709270c38a85504133a6394e5d5e987","metadata":{"iv":"44e3656f775379e74b74215fa2286832","ephemPublicKey":"0428ad7a835bc11c08119f03aa78949a93de1b43e1075d3e1095cd0735da0105a8103e1cdaca8dacb80b754b5526deb559f37d8375de0a4ecc925c6680911ac571","mac":"303dc98ecfd194dbf93ad1672d2c591f9bdd542b3918ebcf1aba7bd3a1afe595","mode":"AES256"}}',
      encrypted_auth_token: '{"data":"f95280b5f247626ea1a14b97bc4587afb2cc06321f42110c36bdcc5f85cae9920b68d2b64a953281f768a4fb39c11909202adaa0e30f9c5d0444566a1cc2b514","metadata":{"iv":"ff6621a8ad8e53a6034d5af4d14bb40a","ephemPublicKey":"040b62fc833302bd5d525ec322ccad8ddd2f81f884f622ab34aee6b69ebb56edcd78911922aff4662720f9855224d8c47d11aa53e46264459dd456a9d004756d7d","mac":"109d3290a063796c288f05466700eb1abd9ca0b38e9e0f70c5f12610ac0c1906","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 4,
      sss_endpoint: 'https://node-4.dev-node.web3auth.io/sss/jrpc'
    },
    {
      encrypted_share: '{"data":"7a4bbb27c4c6d57f9b81bf39f53660b8a1c5cff2a4bf8fb5692f0e6cce418cc5adb019e5b595e24ae49c462489aa03d3","metadata":{"iv":"f2da3f32551a926f7c62c20612633442","ephemPublicKey":"0475ee4466e2a7e768fa14479120b8005960a0e274eae3dd976862b2c583d52d42b073c8c8d05aca7ec60049a71cdf19d24598b523cfb46f5e079601276c9424dd","mac":"9ae1dc315adf88a51ee2a56af44bda32d24610599e6a302124990adf8c6d9532","mode":"AES256"}}',
      encrypted_auth_token: '{"data":"bc0a32cf32f99293cf31069a654e88e5a9ff763ecb2c14ef8619d4bc95b179b5ae6770dcf5efdb29eea6e9ec0ec115b24b87c438e1289f2efeaf409cc88ae13e","metadata":{"iv":"b5bd1d6d3d932b434a8d885322e43dd6","ephemPublicKey":"044c64987b120ce4423f8abcffb59b5226095f703c8cc2f0154c878ad5a07f08b7b98c1d71ced5978773a9a9255b126a6f7307af462e251d3bae0ce54039354ab5","mac":"49162708f64a35eaea5534ff95de1ccd2c0e924089fc8268acd3ea9973b4b997","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 5,
      sss_endpoint: 'https://node-5.dev-node.web3auth.io/sss/jrpc'
    }
  ]
};
