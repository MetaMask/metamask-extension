const Ganache = require('@yqrashawn/conflux-local-network-lite')

const ganacheserver = new Ganache({ verbose: true, genBlockInterval: 300 })

  // const SEED = "ankle hedgehog attack fatal label blame shoe bulb subject negative cruise sick";
  // const PASSWORD = "11111111"

;(async function () {
  await ganacheserver.start({
    accounts: [
      {
        secretKey:
          '0xCA17316C298AC00F746B5F90330191EB08FC446A1A8A91D1F97E1F9588DBDD91',
        balance: 1e23,
      },
    ],
  })
})()
