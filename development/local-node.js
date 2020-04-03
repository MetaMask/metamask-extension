const Ganache = require('@yqrashawn/conflux-local-network-lite')

const ganacheserver = new Ganache({ verbose: true, genBlockInterval: 300 })

// const SEED = "ankle hedgehog attack fatal label blame shoe bulb subject negative cruise sick";
// const PASSWORD = "11111111"

;(async function() {
  await ganacheserver.start({
    accounts: [
      {
        secretKey:
          '0x21041DD5AEBE8CD184965BA4AAE490F3B0C2500D87306FE9F32E276757BFDA68',
        balance: 1e23,
      },
    ],
  })
})()
