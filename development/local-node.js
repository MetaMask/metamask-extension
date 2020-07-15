const Ganache = require('@yqrashawn/conflux-local-network-lite')

const ganacheserver = new Ganache({
  verbose: true,
  genBlockInterval: 300,
  killPortProcess: true,
})

  // const SEED = "ankle hedgehog attack fatal label blame shoe bulb subject negative cruise sick";
  // const PASSWORD = "11111111"

;(async function () {
  await ganacheserver
    .start({
      accounts: [
        {
          secretKey:
            '0x21041DD5AEBE8CD184965BA4AAE490F3B0C2500D87306FE9F32E276757BFDA68',
          balance: 1e23,
        },
        {
          secretKey:
            '0x32A0D91B3930E625501C11F959BCBA312121A181C315751EA219813EDB0822A3',
          balance: 1e20,
        },
        {
          secretKey:
            '0x6FDFA72C7DB5CF9CFF1563264EC84429BF34F133CDA285C8358FA5BAC0EB63F4',
          balance: 25000000000000000000,
        },
      ],
    })
    .catch((err) => {
      throw err
    })
})()
