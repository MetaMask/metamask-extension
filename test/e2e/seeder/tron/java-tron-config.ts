/* eslint-disable @metamask/design-tokens/color-no-hex */
/**
 * java-tron private-network HOCON config used by {@link TronNode}.
 *
 * Derived from the upstream java-tron default template installed by
 * `@metamask/java-tron-up`. Only `fullNodePort` is substituted at
 * runtime; the genesis block and committee flags match the upstream private-net
 * defaults.
 *
 * @see https://github.com/tronprotocol/java-tron
 */
export type JavaTronPrivateNetworkPorts = {
  fullNodePort: number;
};

const JAVA_TRON_PRIVATE_NETWORK_CONFIG_TEMPLATE = String.raw`net {
  type = mainnet
  # type = testnet
}
enery.limit.block.num = 0
storage {
  # Directory for storing persistent data
  db.version = 2,
  db.engine = "LEVELDB",
  db.sync = false,
  db.directory = "database",
  index.directory = "index",
  transHistory.switch = "on",
  # You can custom these 14 databases' configs:

  # account, account-index, asset-issue, block, block-index,
  # block_KDB, peers, properties, recent-block, trans,
  # utxo, votes, witness, witness_schedule.

  # Otherwise, db configs will remain defualt and data will be stored in
  # the path of "output-directory" or which is set by "-d" ("--output-directory").

  # setting can impove leveldb performance .... start
  # node: if this will increase process fds,you may be check your ulimit if 'too many open files' error occurs
  # see https://github.com/tronprotocol/tips/blob/master/tip-343.md for detail
  # if you find block sync has lower performance,you can try  this  settings
  #default = {
  #  maxOpenFiles = 100
  #}
  #defaultM = {
  #  maxOpenFiles = 500
  #}
  #defaultL = {
  #  maxOpenFiles = 1000
  #}
  # setting can impove leveldb performance .... end

  # Attention: name is a required field that must be set !!!
  properties = [
    //    {
    //      name = "account",
    //      path = "storage_directory_test",
    //      createIfMissing = true,
    //      paranoidChecks = true,
    //      verifyChecksums = true,
    //      compressionType = 1,        // compressed with snappy
    //      blockSize = 4096,           // 4  KB =         4 * 1024 B
    //      writeBufferSize = 10485760, // 10 MB = 10 * 1024 * 1024 B
    //      cacheSize = 10485760,       // 10 MB = 10 * 1024 * 1024 B
    //      maxOpenFiles = 100
    //    },
    //    {
    //      name = "account-index",
    //      path = "storage_directory_test",
    //      createIfMissing = true,
    //      paranoidChecks = true,
    //      verifyChecksums = true,
    //      compressionType = 1,        // compressed with snappy
    //      blockSize = 4096,           // 4  KB =         4 * 1024 B
    //      writeBufferSize = 10485760, // 10 MB = 10 * 1024 * 1024 B
    //      cacheSize = 10485760,       // 10 MB = 10 * 1024 * 1024 B
    //      maxOpenFiles = 100
    //    },
  ]

  needToUpdateAsset = true

  //dbsettings is needed when using rocksdb as the storage implement (db.version=2 and db.engine="ROCKSDB").
  //we'd strongly recommend that do not modify it unless you know every item's meaning clearly.
  dbSettings = {
    levelNumber = 7
    //compactThreads = 32
    blocksize = 64  // n * KB
    maxBytesForLevelBase = 256  // n * MB
    maxBytesForLevelMultiplier = 10
    level0FileNumCompactionTrigger = 4
    targetFileSizeBase = 256  // n * MB
    targetFileSizeMultiplier = 1
  }

  //backup settings when using rocks db as the storage implement (db.version=2 and db.engine="ROCKSDB").
  //if you want to use the backup plugin, please confirm set the db.version=2 and db.engine="ROCKSDB" above.
  backup = {
    enable = false  // indicate whether enable the backup plugin
    propPath = "prop.properties" // record which bak directory is valid
    bak1path = "bak1/database" // you must set two backup directories to prevent application halt unexpected(e.g. kill -9).
    bak2path = "bak2/database"
    frequency = 10000   // indicate backup db once every 10000 blocks processed.
  }

  balance.history.lookup = false

  # the estimated number of block transactions (default 1000, min 100, max 10000).
  # so the total number of cached transactions is 65536 * txCache.estimatedTransactions
  # txCache.estimatedTransactions = 1000

}

node.discovery = {
  enable = false
  persist = false
}

# custom stop condition
#node.shutdown = {
#  BlockTime  = "54 59 08 * * ?" # if block header time in persistent db matched.
#  BlockHeight = 33350800 # if block header height in persistent db matched.
#  BlockCount = 12 # block sync count after node start.
#}

node.backup {
  # my priority, each member should use different priority
  priority = 8

  # udp listen port, each member should have the save configuration
  port = 10001

  # time interval to send keepAlive message, each member should have the save configuration
  keepAliveInterval = 3000

  # peer's ip list, can't contain mine
  members = [
    # "ip",
    # "ip"
  ]
}

crypto {
  engine = "eckey"
}
# prometheus metrics start
# node.metrics = {
#  prometheus{
#    enable=true
#    port="9527"
#  }
# }

# prometheus metrics end

node {
  # expose extension api to public or not
  walletExtensionApi = true

  # Disable the P2P listener for local E2E private networks.
  listen.port = 0

  connection.timeout = 2

  fetchBlock.timeout = 200

  tcpNettyWorkThreadNum = 0

  udpNettyWorkThreadNum = 1

  maxConnections = 30
  minConnections = 8
  minActiveConnections = 3

  # Number of validate sign thread, default availableProcessors / 2
  # validateSignThreadNum = 16

  maxConnectionsWithSameIp = 50

  maxHttpConnectNumber = 50

  minParticipationRate = 0

  isOpenFullTcpDisconnect = false

  p2p {
    version = 1 # 11111: mainnet; 20180622: testnet
  }

  active = [
    # Active establish connection in any case
    # Sample entries:
    # "ip:port",
    # "ip:port"
  ]

  passive = [
    # Passive accept connection in any case
    # Sample entries:
    # "ip:port",
    # "ip:port"
  ]

  fastForward = [
  ]

  http {
    fullNodeEnable = true
    fullNodePort = 18190
    solidityEnable = false
    solidityPort = 18191
    PBFTEnable = false
    PBFTPort = 8092
  }

  rpc {
    enable = false
    solidityEnable = false
    PBFTEnable = false
    port = 50051
    solidityPort = 50052
    PBFTPort = 50071
    # Number of gRPC thread, default availableProcessors / 2
    # thread = 16

    # The maximum number of concurrent calls permitted for each incoming connection
    # maxConcurrentCallsPerConnection =

    # The HTTP/2 flow control window, default 1MB
    # flowControlWindow =

    # Connection being idle for longer than which will be gracefully terminated
    maxConnectionIdleInMillis = 60000

    # Connection lasting longer than which will be gracefully terminated
    # maxConnectionAgeInMillis =

    # The maximum message size allowed to be received on the server, default 4MB
    # maxMessageSize =

    # The maximum size of header list allowed to be received, default 8192
    # maxHeaderListSize =

    # Transactions can only be broadcast if the number of effective connections is reached.
    minEffectiveConnection = 0
  }

  # number of solidity thread in the FullNode.
  # If accessing solidity rpc and http interface timeout, could increase the number of threads,
  # The default value is the number of cpu cores of the machine.
  #solidity.threads = 8

  # Limits the maximum percentage (default 75%) of producing block interval
  # to provide sufficient time to perform other operations e.g. broadcast block
  # blockProducedTimeOut = 75

  # Limits the maximum number (default 700) of transaction from network layer
  # netMaxTrxPerSecond = 700

  # open the history query APIs(http&GRPC) when node is a lite fullNode,
  # like {getBlockByNum, getBlockByID, getTransactionByID...}.
  # default: false.
  # note: above APIs may return null even if blocks and transactions actually are on the blockchain
  # when opening on a lite fullnode. only open it if the consequences being clearly known
  # openHistoryQueryWhenLiteFN = false

  jsonrpc {
    # Note: If you turn on jsonrpc and run it for a while and then turn it off, you will not
    # be able to get the data from eth_getLogs for that period of time.

    httpFullNodeEnable = false
    httpFullNodePort = 8545
    httpSolidityEnable = false
    httpSolidityPort = 8555
    httpPBFTEnable = false
    # httpPBFTPort = 8565
  }

  # Disabled api list, it will work for http, rpc and pbft, both fullnode and soliditynode,
  # but not jsonrpc.
  # Sample: The setting is case insensitive, GetNowBlock2 is equal to getnowblock2
  #
  # disabledApi = [
  #   "getaccount",
  #   "getnowblock2"
  # ]
}

## rate limiter config
rate.limiter = {
  # Every api could be set a specific rate limit strategy. Three strategy are supported:GlobalPreemptibleAdapter、IPQPSRateLimiterAdapte、QpsRateLimiterAdapter
  # GlobalPreemptibleAdapter: permit is the number of preemptible resource, every client must apply one resourse
  #       before do the request and release the resource after got the reponse automaticlly. permit should be a Integer.
  # QpsRateLimiterAdapter: qps is the average request count in one second supported by the server, it could be a Double or a Integer.
  # IPQPSRateLimiterAdapter: similar to the QpsRateLimiterAdapter, qps could be a Double or a Integer.
  # If do not set, the "default strategy" is set.The "default startegy" is based on QpsRateLimiterAdapter, the qps is set as 10000.
  #
  # Sample entries:
  #
  http = [
    #  {
    #    component = "GetNowBlockServlet",
    #    strategy = "GlobalPreemptibleAdapter",
    #    paramString = "permit=1"
    #  },

    #  {
    #    component = "GetAccountServlet",
    #    strategy = "IPQPSRateLimiterAdapter",
    #    paramString = "qps=1"
    #  },

    #  {
    #    component = "ListWitnessesServlet",
    #    strategy = "QpsRateLimiterAdapter",
    #    paramString = "qps=1"
    #  }
  ],

  rpc = [
    #  {
    #    component = "protocol.Wallet/GetBlockByLatestNum2",
    #    strategy = "GlobalPreemptibleAdapter",
    #    paramString = "permit=1"
    #  },

    #  {
    #    component = "protocol.Wallet/GetAccount",
    #    strategy = "IPQPSRateLimiterAdapter",
    #    paramString = "qps=1"
    #  },

    #  {
    #    component = "protocol.Wallet/ListWitnesses",
    #    strategy = "QpsRateLimiterAdapter",
    #    paramString = "qps=1"
    #  },
  ]

}


seed.node = {
  # List of the seed nodes
  # Seed nodes are stable full nodes
  # example:
  # ip.list = [
  #   "ip:port",
  #   "ip:port"
  # ]
  ip.list = [
  ]
}

genesis.block = {
  # Reserve balance
  assets = [
    {
      accountName = "Zion"
      accountType = "AssetIssue"
      address = "TMVQGm1qAQYVdetCeGRRkTWYYrLXuHK2HC"
      balance = "99000000000000000"
    },
    {
      accountName = "Sun"
      accountType = "AssetIssue"
      address = "TXmVpin5vq5gdZsciyyjdZgKRUju4st1wM"
      balance = "0"
    },
    {
      accountName = "Blackhole"
      accountType = "AssetIssue"
      address = "TLsV52sRDL79HXGGm9yzwKibb6BeruhUzy"
      balance = "-9223372036854775808"
    },
        {
      accountName = "TestA"
      accountType = "AssetIssue"
      address = "TVdyt1s88BdiCjKt6K2YuoSmpWScZYK1QF"
      balance = "1000000000000000"
    },
    {
      accountName = "TestB"
      accountType = "AssetIssue"
      address = "TCNVmGtkfknHpKSZXepZDXRowHF7kosxcv"
      balance = "1000000000000000"
    },
    {
      accountName = "TestC"
      accountType = "AssetIssue"
      address = "TAbzgkG8p3yF5aywKVgq9AaAu6hvF2JrVC"
      balance = "1000000000000000"
    },
    {
      accountName = "TestD"
      accountType = "AssetIssue"
      address = "TMmmvwvkBPBv3Gkw9cGKbZ8PLznYkTu3ep"
      balance = "1000000000000000"
    },
    {
      accountName = "TestE"
      accountType = "AssetIssue"
      address = "TBJHZu4Sm86aWHtt6VF6KQSzot8vKTuTKx"
      balance = "1000000000000000"
    }
  ]

  witnesses = [
    {
      address: TMVQGm1qAQYVdetCeGRRkTWYYrLXuHK2HC,
      url = "http://tronstudio.com",
      voteCount = 10000
    }
  ]

  timestamp = "0" #2017-8-26 12:00:00

  parentHash = "0x957dc2d350daecc7bb6a38f3938ebde0a0c1cedafe15f0edae4256a2907449f6"
}

// Optional.The default is empty.
// It is used when the witness account has set the witnessPermission.
// When it is not empty, the localWitnessAccountAddress represents the address of the witness account,
// and the localwitness is configured with the private key of the witnessPermissionAddress in the witness account.
// When it is empty,the localwitness is configured with the private key of the witness account.

localwitness = [
  0000000000000000000000000000000000000000000000000000000000000001
]

#localwitnesskeystore = [
#  "localwitnesskeystore.json"
#]

block = {
  needSyncCheck = false
  maintenanceTimeInterval = 300000 // 5 min
  proposalExpireTime = 300000 // 5 min
}

# Transaction reference block, default is "solid", configure to "head" may accur TaPos error
# trx.reference.block = "solid" // head;solid;

# This property sets the number of milliseconds after the creation of the transaction that is expired, default value is  60000.
trx.expiration.timeInMilliseconds = 43200000 // half day

vm = {
  supportConstant = true
  estimateEnergy = true
  maxEnergyLimitForConstant = 100000000
  minTimeRatio = 0.0
  maxTimeRatio = 100.0
  saveInternalTx = true
  saveFeaturedInternalTx = true

  # In rare cases, transactions that will be within the specified maximum execution time (default 10(ms)) are re-executed and packaged
  # longRunningTime = 10
}

committee = {
  allowCreationOfContracts = 1
  allowUpdateAccountName = 1
  allowSameTokenName = 1
  allowDelegateResource = 1
  allowTvmTransferTrc10 = 1
  allowMultiSign = 1
  allowTvmConstantinople = 1
  allowTvmSolidity059 = 1
  allowTvmIstanbul = 1
  allowShieldedTRC20Transaction = 1
  changedDelegation = 1
  allowOptimizeBlackHole = 1
  allowTvmVote = 1
  allowTvmLondon = 1
  allowHigherLimitForMaxCpuTimeOfOneTx = 1
  allowAssetOptimization = 1
  allowNewReward = 1
  memoFee = 1000000
  allowDelegateOptimization = 1
  unfreezeDelayDays = 1
  allowTvmShangHai = 1
  allowCancelAllUnfreezeV2 = 1
  maxDelegateLockPeriod = 30
}
`;

export function createJavaTronPrivateNetworkConfig(
  ports: JavaTronPrivateNetworkPorts,
): string {
  return JAVA_TRON_PRIVATE_NETWORK_CONFIG_TEMPLATE.replace(
    'fullNodePort = 18190',
    `fullNodePort = ${ports.fullNodePort}`,
  );
}
