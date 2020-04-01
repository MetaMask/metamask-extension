const Ganache = require('@yqrashawn/conflux-local-network-lite')

const ganacheserver = new Ganache({ verbose: true, genBlockInterval: 300 })

  // const SEED = "ankle hedgehog attack fatal label blame shoe bulb subject negative cruise sick";
  // const PASSWORD = "11111111"

;(async function () {
  await ganacheserver.start({
    accounts: [
      {
        secretKey:
        '0xA46F301E2D0AC3EE7B83303D93DD49C14CE8E18251EB623ED468AAA12F572E74',
        balance: 1e23,
      },
    ],
  })
})()
