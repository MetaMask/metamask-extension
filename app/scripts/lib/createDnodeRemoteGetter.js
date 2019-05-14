module.exports = createDnodeRemoteGetter

function createDnodeRemoteGetter (dnode) {
  let remote

  dnode.once('remote', (_remote) => {
    remote = _remote
  })

  async function getRemote () {
    if (remote) return remote
    return await new Promise(resolve => dnode.once('remote', resolve))
  }

  return getRemote
}
