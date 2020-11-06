// This script lists all dependencies that have package install scripts
const path = require('path')
const readInstalled = require('read-installed')

const installScripts = ['preinstall', 'install', 'postinstall']

readInstalled('./', { dev: true }, function (err, data) {
  if (err) {
    throw err
  }

  const deps = data.dependencies
  Object.entries(deps).forEach(([packageName, packageData]) => {
    const packageScripts = packageData.scripts || {}
    const scriptKeys = Reflect.ownKeys(packageScripts)

    const hasInstallScript = installScripts.some((installKey) =>
      scriptKeys.includes(installKey),
    )
    if (!hasInstallScript) {
      return
    }

    const matchingScripts = {}
    if (packageScripts.preinstall) {
      matchingScripts.preinstall = packageScripts.preinstall
    }
    if (packageScripts.install) {
      matchingScripts.install = packageScripts.install
    }
    if (packageScripts.postinstall) {
      matchingScripts.postinstall = packageScripts.postinstall
    }
    const scriptNames = Reflect.ownKeys(matchingScripts)

    const relativePath = path.relative(process.cwd(), packageData.path)

    console.log(`${packageName}: ${relativePath} ${scriptNames}`)
  })
})
