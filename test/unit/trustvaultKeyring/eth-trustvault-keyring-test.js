import TrustvaultKeyring from '../../../app/scripts/eth-trustvault-keyring'
import assert from 'assert'
import sinon from 'sinon'
import EthereumTx from 'ethereumjs-tx'

const fakeTx = new EthereumTx({
  nonce: '0x07',
  gasPrice: '0x0165a0bc00',
  gasLimit: '0x5208',
  to: '0x357e214c002bd6356cb891164e93e39dee28cced',
  value: '0x01b4d57d4de000',
  data: '0x',
  chainId: 3,
})
describe('TrustVault Keyring Tests', () => {
  let keyring
  beforeEach(() => {
    keyring = new TrustvaultKeyring()
  })
  describe('Keyring.type', () => {
    it('it is a class property that return the string.', () => {
      const type = TrustvaultKeyring.type
      assert.equal(type, 'TrustVault')
    })

    it('it is a class property that return the string.', () => {
      const type = keyring.type
      const correct = TrustvaultKeyring.type
      assert.equal(type, correct)
    })
  })

  describe('constructor', () => {
    it('constructs', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({})
      assert.equal(typeof trustVaultKeyring, 'object')
      const accounts = await trustVaultKeyring.getAccounts()
      assert.equal(Array.isArray(accounts), true)

    })
  })

  describe('serialize', () => {
    it('serializes an instance', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({})
      assert.equal(typeof trustVaultKeyring, 'object')
      const accounts = await trustVaultKeyring.getAccounts()
      assert.equal(Array.isArray(accounts), true)

    })
  })

  describe('isUnlocked', async () => {
    it('should return false if we do not authentication tokens setup', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({})
      const result = await trustVaultKeyring.isUnlocked()
      assert.equal(result, false)
    })

    it('should return true if we have authentication tokens setup', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring.isUnlocked()
      assert.equal(result, true)
    })
  })

  describe('unlock', function () {
    it('should resolve if we have authentication tokens', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring.unlock()
      assert.equal(result, 'already unlocked')
    })
    it('should reject if we do not have authentication tokens', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({})
      try {
        const result = await trustVaultKeyring.unlock()
        assert.fail(`test failed due to unexpected behaviour, result: ${result}`)
      } catch (e) {
        assert.equal(e.message, 'TrustVault tokens have expired. Connect to TrustVault again.')
      }
    })
  })

  describe('getAccounts', async () => {
    const sandbox = sinon.createSandbox()
    let getAccountsStub
    beforeEach(() => {
      getAccountsStub = sandbox.stub(TrustvaultKeyring.prototype, '_getAccounts')
    })
    afterEach(() => {
      sandbox.restore()
    })
    it('should return array of accounts.', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      getAccountsStub.resolves([{ name: 'test', address: '0xC668a5116A045e9162902795021907Cb15aa2620' }])
      const accounts = await trustVaultKeyring.getAccounts()
      assert.equal(accounts[0].name, 'test')
      assert.equal(accounts[0].address, '0xC668a5116A045e9162902795021907Cb15aa2620')
    })

    it('should return an empty array if _getAccounts has thrown an error', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      getAccountsStub.rejects('error')
      const accounts = await trustVaultKeyring.getAccounts()
      assert.equal(accounts.length, 0)
    })

    it('should cache the _getAccounts result if was called within the last 5 minutes', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      getAccountsStub.resolves([{ name: 'test', address: '0xC668a5116A045e9162902795021907Cb15aa2620' }])
      await trustVaultKeyring.getAccounts()
      await trustVaultKeyring.getAccounts()
      assert.ok(getAccountsStub.calledOnce)
    })
  })

  describe('signTransactions', async () => {
    const sandbox = sinon.createSandbox()
    beforeEach(() => {
      sandbox.stub(TrustvaultKeyring.prototype, '_getTransactionDigest').resolves('1df316ff2d1364d4738f0193c6f31c77dfee1c64d50652b53a12b6f9e5297e17')
      sandbox.stub(TrustvaultKeyring.prototype, '_constructTrustTransaction').resolves({ chainId: 3,
        gasLimit: '21000',
        gasPrice: '"6000000000',
        nonce: '7',
        to: '0x357e214c002bd6356cb891164e93e39dee28cced',
        v: 3,
        value: '480304000000000' })
    })
    afterEach(() => {
      sandbox.restore()
    })
    it('should verify the transaction and return transaction with the correct r,s,v values', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_signTransaction').resolves({ v: '29', r: '39b22bc9103314ed58df3d4377d563b36cb7c36b1c858f53c707fe3b3ec4a11f', s: '76a031cd1755ada19393a8d526888f413290a37c073fee085bf6dd0094d46629' })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring.signTransaction('0xF30952A1c534CDE7bC471380065726fa8686dfB3', fakeTx)
      assert.equal(result.s.toString('hex'), '76a031cd1755ada19393a8d526888f413290a37c073fee085bf6dd0094d46629')
      assert.equal(result.v.toString('hex'), '29')
      assert.equal(result.r.toString('hex'), '39b22bc9103314ed58df3d4377d563b36cb7c36b1c858f53c707fe3b3ec4a11f')
    })

    it('should not verify the transaction if the r,s,v values are incorrect', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_signTransaction').resolves({ v: '09', r: '59b22bc9103314ed58df3d4377d563b36cb7c36b1c858f53c707fe3b3ec4a11f', s: '76a031cd755ada19393a8d526888f413290a37c073fee085bf6dd0094d46629' })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring.signTransaction('0xF30952A1c534CDE7bC471380065726fa8686dfB3', fakeTx)
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Signatures on the transactions are invalid.')
      }
    })
  })

  describe('signTransactions', async () => {
    const sandbox = sinon.createSandbox()
    beforeEach(() => {
      sandbox.stub(TrustvaultKeyring.prototype, '_getTransactionDigest').resolves('1df316ff2d1364d4738f0193c6f31c77dfee1c64d50652b53a12b6f9e5297e17')
      sandbox.stub(TrustvaultKeyring.prototype, '_constructTrustTransaction').resolves({ chainId: 3,
        gasLimit: '21000',
        gasPrice: '"6000000000',
        nonce: '7',
        to: '0x357e214c002bd6356cb891164e93e39dee28cced',
        v: 3,
        value: '480304000000000' })
    })
    afterEach(() => {
      sandbox.restore()
    })
    it('should verify the transaction and return transaction with the correct r,s,v values', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_signTransaction').resolves({ v: '29', r: '39b22bc9103314ed58df3d4377d563b36cb7c36b1c858f53c707fe3b3ec4a11f', s: '76a031cd1755ada19393a8d526888f413290a37c073fee085bf6dd0094d46629' })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring.signTransaction('0xF30952A1c534CDE7bC471380065726fa8686dfB3', fakeTx)
      assert.equal(result.s.toString('hex'), '76a031cd1755ada19393a8d526888f413290a37c073fee085bf6dd0094d46629')
      assert.equal(result.v.toString('hex'), '29')
      assert.equal(result.r.toString('hex'), '39b22bc9103314ed58df3d4377d563b36cb7c36b1c858f53c707fe3b3ec4a11f')
    })

    it('should not verify the transaction if the r,s,v values are incorrect', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_signTransaction').resolves({ v: '09', r: '59b22bc9103314ed58df3d4377d563b36cb7c36b1c858f53c707fe3b3ec4a11f', s: '76a031cd755ada19393a8d526888f413290a37c073fee085bf6dd0094d46629' })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring.signTransaction('0xF30952A1c534CDE7bC471380065726fa8686dfB3', fakeTx)
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Signatures on the transactions are invalid.')
      }
    })
  })

  describe('submitPartialPinChallenge', async () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
    })
    it('should get authentication tokens if partial pin correct.', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_getAuthenticationTokens').resolves({ enc: 'enc', iv: 'iv', tag: 'tag' })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring.submitPartialPinChallenge(1, 2)
      assert.equal(result.enc, 'enc')
      assert.equal(result.iv, 'iv')
      assert.equal(result.tag, 'tag')
    })

    it('should throw error if partial pin  is incorrect.', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_getAuthenticationTokens').rejects(new Error('Incorrect pin.'))
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring.submitPartialPinChallenge(1, 2)
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Incorrect pin.')
      }
    })
  })

  describe('_getPartialPinChallange', async () => {
    const sandbox = sinon.createSandbox()
    before(() => {
      sandbox.stub(TrustvaultKeyring.prototype, '_getPartialPinChallengeQuery').resolves({})
    })
    afterEach(() => {
      sandbox.restore()
    })
    it('should get session tokens and partial pin.', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest').resolves({ data: { getPartialPinChallenge: { sessionToken: 'sessionToken', firstPinDigitPosition: 1, secondPinDigitPosition: 2 } } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring._getPartialPinChallenge('test@test.com')
      assert.equal(result.pinChallenge.sessionToken, 'sessionToken')
      assert.equal(result.pinChallenge.firstPinDigitPosition, 1)
      assert.equal(result.pinChallenge.secondPinDigitPosition, 2)
    })

    it('should throw an error if partial pin request returns error', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest').resolves({ error: { message: 'Invalid Request' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._getPartialPinChallenge('test@test.com')
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Invalid Request')
      }
    })
  })

  describe('_getAuthenticationTokens', async () => {
    const sandbox = sinon.createSandbox()
    before(() => {
      sandbox.stub(TrustvaultKeyring.prototype, '_getAuthTokenQuery').resolves({})
    })
    afterEach(() => {
      sandbox.restore()
    })
    it('should get authentication tokens if pin is correct.', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest').resolves({ data: { getAuthenticationTokens: { authentication: { enc: 'enc', iv: 'iv', tag: 'tag' }, pinChallenge: { firstPinDigitPosition: 1, secondPinDigitPosition: 2, sessionToken: 'sessionToken' } } } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring._getAuthenticationTokens('test@test.com', 1, 2, 'sessionToken')
      assert.equal(result.authentication.enc, 'enc')
      assert.equal(result.authentication.iv, 'iv')
      assert.equal(result.authentication.tag, 'tag')
    })

    it('should throw error and return partial pin challange', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest').resolves({ data: { getAuthenticationTokens: { pinChallenge: { firstPinDigitPosition: 1, secondPinDigitPosition: 2, sessionToken: 'sessionToken' } } }, error: { message: 'Invalid Pin' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._getAuthenticationTokens('test@test.com', 1, 2, 'sessionToken')
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Invalid Pin')
        assert.equal(e.data.pinChallenge.firstPinDigitPosition, 1)
        assert.equal(e.data.pinChallenge.secondPinDigitPosition, 2)
        assert.equal(e.data.pinChallenge.sessionToken, 'sessionToken')
      }
    })
  })

  describe('_getAccounts', async () => {
    const sandbox = sinon.createSandbox()
    before(() => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').resolves({ userWallet: { getAccounts: [{ accountName: 'account1', address: '0x01' }, { accountName: 'account2', address: '0x02' }] } })
    })
    after(() => {
      sandbox.restore()
    })
    it('should return account addresses', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring._getAccounts('test@test.com', 1, 2, 'sessionToken')
      assert.equal(result[0], '0x01')
      assert.equal(result[1], '0x02')
    })

    it('should return accountName map after getting the accounts', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      await trustVaultKeyring._getAccounts('test@test.com', 1, 2, 'sessionToken')
      const result = await trustVaultKeyring.getAccountNames()
      assert.equal(result[0].name, 'account1')
      assert.equal(result[0].address, '0x01')
      assert.equal(result[1].name, 'account2')
      assert.equal(result[1].address, '0x02')

    })
  })

  describe('_request', async () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
    })
    it('should return the data from the request if tokens are not expired', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest').resolves({ data: { test: 'testData' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring._request(() => {}, {})
      assert.equal(result.test, 'testData')
    })

    it('should refresh the tokens and return the requested data if tokens are expired', async () => {
      const trustVaultBridgeRequestStub = sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest')
      trustVaultBridgeRequestStub.onCall(0).resolves({ data: {}, error: { errorType: 'INVALID_SESSION_TOKEN' } })
      sandbox.stub(TrustvaultKeyring.prototype, '_refreshAuthTokensQuery').resolves({})
      trustVaultBridgeRequestStub.onCall(1).resolves({ data: { refreshAuthenticationTokens: 'testAuthentication' } })
      trustVaultBridgeRequestStub.onCall(2).resolves({ data: { test: 'testData' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring._request(() => {}, {})
      assert.equal(result.test, 'testData')

    })
    it('should try to refresh the tokens but return the errors as the session token is expired ', async () => {
      const trustVaultBridgeRequestStub = sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest')
      trustVaultBridgeRequestStub.onCall(0).resolves({ data: {}, error: { errorType: 'INVALID_SESSION_TOKEN' } })
      sandbox.stub(TrustvaultKeyring.prototype, '_refreshAuthTokensQuery').resolves({})
      trustVaultBridgeRequestStub.onCall(1).rejects({})
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._request(() => {}, {})
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'TrustVault session has expired. Connect to TrustVault again')
      }
    })
    it('should throw an error if the request is not valid', async () => {
      const trustVaultBridgeRequestStub = sandbox.stub(TrustvaultKeyring.prototype, 'trustVaultBridgeRequest')
      trustVaultBridgeRequestStub.onCall(0).rejects(new Error('Invalid request'))
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._request(() => {}, {})
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Invalid request')
      }
    })
  })

  describe('_signTransaction', async () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
    })
    it('should return r,s,v values for the signed transaction ', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').resolves({ requestSignature: { transactionId: 'transactionId' } })
      sandbox.stub(TrustvaultKeyring.prototype, '_pollTransaction').resolves({ transaction: { v: 'v', r: 'r', s: 's' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring._signTransaction('address', {}, 'digest')
      assert.equal(result.v, 'v')
      assert.equal(result.r, 'r')
      assert.equal(result.s, 's')
    })

    it('should throw an error if signing the transaction fails.', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').rejects(new Error('Invalid Transaction'))
      sandbox.stub(TrustvaultKeyring.prototype, '_pollTransaction').resolves({ transaction: { v: 'v', r: 'r', s: 's' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._signTransaction('address', {}, 'digest')
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Invalid Transaction')
      }
    })
  })
  describe('_signTransaction', async () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
    })
    it('should return r,s,v values for the signed transaction', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').resolves({ requestSignature: { transactionId: 'transactionId' } })
      sandbox.stub(TrustvaultKeyring.prototype, '_pollTransaction').resolves({ transaction: { v: 'v', r: 'r', s: 's' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const result = await trustVaultKeyring._signTransaction('address', {}, 'digest')
      assert.equal(result.v, 'v')
      assert.equal(result.r, 'r')
      assert.equal(result.s, 's')
    })

    it('should throw an error if signing the transaction fails.', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').rejects(new Error('Invalid Transaction'))
      sandbox.stub(TrustvaultKeyring.prototype, '_pollTransaction').resolves({ transaction: { v: 'v', r: 'r', s: 's' } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._signTransaction('address', {}, 'digest')
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e.message, 'Invalid Transaction')
      }
    })
  })

  describe('_constructTrustTransaction', async () => {
    it('should construct a Trustoloy Transaction given an EthereumTx object.', async () => {
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const transaction = trustVaultKeyring._constructTrustTransaction(fakeTx)
      assert.equal(transaction.chainId, 3)
      assert.equal(transaction.gasLimit, '21000')
      assert.equal(transaction.gasPrice, '6000000000')
      assert.equal(transaction.nonce, '7')
      assert.equal(transaction.to, '0x357e214c002bd6356cb891164e93e39dee28cced')
      assert.equal(transaction.value, '480304000000000')
    })
  })

  describe('_pollTransaction', async () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      sandbox.restore()
    })
    it('should return singed transaction if transaction status is signed', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').resolves({ userWallet: { getTransactionInfo: { status: 'SIGNED', signedTransaction: 'signedTransaction' } } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const signedTransaction = await trustVaultKeyring._pollTransaction(() => {}, {})
      assert.equal(signedTransaction, 'signedTransaction')
    })

    it('should return "Transaction cancelled by user" transaction if transaction status is USER_CANCELLED', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').resolves({ userWallet: { getTransactionInfo: { status: 'USER_CANCELLED', signedTransaction: 'signedTransaction' } } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._pollTransaction('txID')
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e, 'Transaction cancelled by user')
      }
    })
    it('should return Error transaction if transaction status is ERROR', async () => {
      sandbox.stub(TrustvaultKeyring.prototype, '_request').resolves({ userWallet: { getTransactionInfo: { status: 'ERROR', signedTransaction: 'signedTransaction' } } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      try {
        const result = await trustVaultKeyring._pollTransaction('txID')
        assert.fail(`Expected to fail returned with result ${result}`)
      } catch (e) {
        assert.equal(e, 'Signing the transaction errored')
      }
    })
    it('should poll again if transaction status is not there.', async () => {
      const trustVaultBridgeRequestStub = sandbox.stub(TrustvaultKeyring.prototype, '_request')
      trustVaultBridgeRequestStub.onCall(0).resolves({ userWallet: { getTransactionInfo: {} } })
      trustVaultBridgeRequestStub.onCall(1).resolves({ userWallet: { getTransactionInfo: { status: 'SIGNED', signedTransaction: 'signedTransaction' } } })
      const trustVaultKeyring = new TrustvaultKeyring({ auth: 'test' })
      const signedTransaction = await trustVaultKeyring._pollTransaction('txID')
      assert.equal(signedTransaction, 'signedTransaction')
    })
  })
})
