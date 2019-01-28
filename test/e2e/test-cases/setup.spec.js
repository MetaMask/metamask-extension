const setup = async (f) => {
  it('switches to extensions list', async () => {
     await f.delay(300)
     await f.switchToFirstPage()
     await f.delay(5000)
 })
}

module.exports = setup
