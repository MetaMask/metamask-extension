https://hackmd.io/JwIwDMDGKQZgtAFgKZjEgbARhPAhgKxZbwAcA7LAWOQCaKEgFA==?edit

Subscribablez(initState)
 .subscribe()
 .emitUpdate(newState)
 //.getState()


var initState = fromDisk()
ReduxStore(reducer, initState)
.reduce(action) -> .emitUpdate()

ReduxStore.subscribe(toDisk)


### KeyChainManager / idStore 2.0 (maybe just in MetaMaskController)
	keychains: []
	getAllAccounts(cb)
	getAllKeychainViewStates(cb) -> returns [ KeyChainViewState]

#### Old idStore external methods, for feature parity:

- init(configManager)
- setStore(ethStore)
- getState()
- getSelectedAddres()
- setSelectedAddress()
- createNewVault()
- recoverFromSeed()
- submitPassword()
- approveTransaction()
- cancelTransaction()
- addUnconfirmedMessage(msgParams, cb)
- signMessage()
- cancelMessage()
- setLocked()
- clearSeedWordCache()
- exportAccount()
- revealAccount()
- saveAccountLabel()
- tryPassword()
- recoverSeed()
- getNetwork()

##### Of those methods

Where they should end up:

##### MetaMaskController

- getNetwork()

##### KeyChainManager

- init(configManager)
- setStore(ethStore)
- getState() // Deprecate for unidirectional flow
- on('update', cb)
- createNewVault(password)
- getSelectedAddres()
- setSelectedAddress()
- submitPassword()
- tryPassword()
- approveTransaction()
- cancelTransaction()
- signMessage()
- cancelMessage()
- setLocked()
- exportAccount()

##### Bip44 KeyChain

- getState() // Deprecate for unidirectional flow
- on('update', cb)

If we adopt a ReactStore style unidirectional action dispatching data flow, these methods will be unified under a `dispatch` method, and rather than having a cb will emit an update to the UI:

- createNewKeyChain(entropy)
- recoverFromSeed()
- approveTransaction()
- signMessage()
- clearSeedWordCache()
- exportAccount()
- revealAccount()
- saveAccountLabel()
- recoverSeed()

### KeyChain (ReduxStore?)
	// attributes
	@name

    signTx(txParams, cb)
    signMsg(msg, cb)

	getAddressList(cb)

	getViewState(cb) -> returns KeyChainViewState

    serialize(cb) -> obj
    deserialize(obj)

### KeyChainViewState
	// The serialized, renderable keychain data
    accountList: [],
    typeName: 'uPort',
    iconAddress: 'uport.gif',
	internal: {} // Subclass-defined metadata

### KeyChainReactComponent
    // takes a KeyChainViewState

	// Subclasses of this:
	- KeyChainListItemComponent
	- KeyChainInitComponent - Maybe part of the List Item
	- KeyChainAccountHeaderComponent
	- KeyChainConfirmationComponent
	// Account list item, tx confirmation extra data (like a QR code),
	// Maybe an options screen, init screen,

    how to send actions?
    emitAction(keychains.<id>.didInit)


gimmeRemoteKeychain((err, remoteKeychain)=>

)





KeyChainReactComponent({
    keychain
})

Keychain:
	methods:{},
	cachedAccountList: [],
	name: '',


CoinbaseKeychain
    getAccountList


CoinbaseKeychainComponent
   isLoading = true
   keychain.getAccountList(()=>{
     isLoading=false
     accountList=accounts
   })





KeyChainViewState {
	attributes: {
		//mandatory:
		accountList: [],
		typeName: 'uPort',
		iconAddress: 'uport.gif',

		internal: {
			// keychain-specific metadata
			proxyAddresses: {
				0xReal: '0xProxy'
			}
		},
	},
	methods: {
		// arbitrary, internal
	}
}

