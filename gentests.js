const fs = require('fs')
const path = require('path')
const async = require('async')
const promisify = require('pify')

// start(/\.selectors.js/, generateSelectorTest).catch(console.error)
// start(/\.utils.js/, generateUtilTest).catch(console.error)
startContainer(/\.container.js/, generateContainerTest).catch(console.error)

async function getAllFileNames (dirName) {
  const allNames = (await promisify(fs.readdir)(dirName))
  const fileNames = allNames.filter(name => name.match(/^.+\./))
  const dirNames = allNames.filter(name => name.match(/^[^.]+$/))

  const fullPathDirNames = dirNames.map(d => `${dirName}/${d}`)
  const subNameArrays = await promisify(async.map)(fullPathDirNames, getAllFileNames)
  let subNames = []
  subNameArrays.forEach(subNameArray => { subNames = [...subNames, ...subNameArray] })

  return [
    ...fileNames.map(name => dirName + '/' + name),
    ...subNames,
  ]
}

/*
async function start (fileRegEx, testGenerator) {
  const fileNames = await getAllFileNames('./ui/app')
  const sFiles = fileNames.filter(name => name.match(fileRegEx))

  let sFileMethodNames
  let testFilePath
  async.each(sFiles, async (sFile, cb) => {
    const [, sRootPath, sPath] = sFile.match(/^(.+\/)([^/]+)$/)
    sFileMethodNames = Object.keys(require(__dirname + '/' + sFile))

    testFilePath = sPath.replace('.', '-').replace('.', '.test.')

    await promisify(fs.writeFile)(
      `${__dirname}/${sRootPath}tests/${testFilePath}`,
      testGenerator(sPath, sFileMethodNames),
      'utf8'
    )
  }, (err) => {
    console.log(err)
  })

}
*/

async function startContainer (fileRegEx, testGenerator) {
  const fileNames = await getAllFileNames('./ui/app')
  const sFiles = fileNames.filter(name => name.match(fileRegEx))

  async.each(sFiles, async (sFile, cb) => {
    console.log(`sFile`, sFile)
    const [, sRootPath, sPath] = sFile.match(/^(.+\/)([^/]+)$/)

    const testFilePath = sPath.replace('.', '-').replace('.', '.test.')

    await promisify(fs.readFile)(
      path.join(__dirname, sFile),
      'utf8',
      async (err, result) => {
        if (err) {
          console.log('Error: ', err)
        } else {
          console.log(`result`, result.length)
          const returnObjectStrings = result
            .match(/return\s(\{[\s\S]+?})\n}/g)
            .map(str => {
              return str
                .slice(0, str.length - 1)
                .slice(7)
                .replace(/\n/g, '')
                .replace(/\s\s+/g, ' ')

            })
          const mapStateToPropsAssertionObject = returnObjectStrings[0]
            .replace(/\w+:\s\w+\([\w,\s]+\),/g, str => {
              const strKey = str.match(/^\w+/)[0]
              return strKey + ': \'mock' + str.match(/^\w+/)[0].replace(/^./, c => c.toUpperCase()) + ':mockState\',\n'
            })
            .replace(/{\s\w.+/, firstLinePair => `{\n ${firstLinePair.slice(2)}`)
            .replace(/\w+:.+,/g, s => `       ${s}`)
            .replace(/}/g, s => `     ${s}`)
          let mapDispatchToPropsMethodNames
          if (returnObjectStrings[1]) {
            mapDispatchToPropsMethodNames = returnObjectStrings[1].match(/\s\w+:\s/g).map(str => str.match(/\w+/)[0])
          }
          const proxyquireObject = ('{\n  ' + result
            .match(/import\s{[\s\S]+?}\sfrom\s.+/g)
            .map(s => s.replace(/\n/g, ''))
            .map((s, i) => {
              const proxyKeys = s.match(/{.+}/)[0].match(/\w+/g)
              return '\'' + s.match(/'(.+)'/)[1] + '\': { ' + (proxyKeys.length > 1
                  ? '\n    ' + proxyKeys.join(': () => {},\n    ') + ': () => {},\n '
                  : proxyKeys[0] + ': () => {},') + ' }'
            })
            .join(',\n  ') + '\n}')
            .replace('{ connect: () => {}, },', `{
      connect: (ms, md) => {
        mapStateToProps = ms
        mapDispatchToProps = md
        return () => ({})
      },
    },`)
            // console.log(`proxyquireObject`, proxyquireObject);
          // console.log(`mapStateToPropsAssertionObject`, mapStateToPropsAssertionObject);
          // console.log(`mapDispatchToPropsMethodNames`, mapDispatchToPropsMethodNames);

          const containerTest = generateContainerTest(sPath, {
            mapStateToPropsAssertionObject,
            mapDispatchToPropsMethodNames,
            proxyquireObject,
          })
          // console.log(`containerTest`, `${__dirname}/${sRootPath}tests/${testFilePath}`, containerTest);
          console.log('----')
          console.log(`sRootPath`, sRootPath)
          console.log(`testFilePath`, testFilePath)
          await promisify(fs.writeFile)(
            `${__dirname}/${sRootPath}tests/${testFilePath}`,
            containerTest,
            'utf8'
          )
        }
      }
    )
  }, (err) => {
    console.log('123', err)
  })

}
/*
function generateMethodList (methodArray) {
  return methodArray.map(n => '  ' + n).join(',\n') + ','
}

function generateMethodDescribeBlock (methodName, index) {
  const describeBlock =
  `${index ? '  ' : ''}describe('${methodName}()', () => {
    it('should', () => {
      const state = {}

      assert.equal(${methodName}(state), )
    })
  })`
  return describeBlock
}
*/
function generateDispatchMethodDescribeBlock (methodName, index) {
  const describeBlock =
  `${index ? '    ' : ''}describe('${methodName}()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.${methodName}()
        assert(dispatchSpy.calledOnce)
      })
    })`
  return describeBlock
}
/*
function generateMethodDescribeBlocks (methodArray) {
  return methodArray
    .map((methodName, index) => generateMethodDescribeBlock(methodName, index))
    .join('\n\n')
}
*/

function generateDispatchMethodDescribeBlocks (methodArray) {
  return methodArray
    .map((methodName, index) => generateDispatchMethodDescribeBlock(methodName, index))
    .join('\n\n')
}

/*
function generateSelectorTest (name, methodArray) {
return `import assert from 'assert'
import {
${generateMethodList(methodArray)}
} from '../${name}'

describe('${name.match(/^[^.]+/)} selectors', () => {

  ${generateMethodDescribeBlocks(methodArray)}

})`
}

function generateUtilTest (name, methodArray) {
return `import assert from 'assert'
import {
${generateMethodList(methodArray)}
} from '../${name}'

describe('${name.match(/^[^.]+/)} utils', () => {

  ${generateMethodDescribeBlocks(methodArray)}

})`
}
*/

function generateContainerTest (sPath, {
  mapStateToPropsAssertionObject,
  mapDispatchToPropsMethodNames,
  proxyquireObject,
}) {
return `import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

proxyquire('../${sPath}', ${proxyquireObject})

describe('${sPath.match(/^[^.]+/)} container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), ${mapStateToPropsAssertionObject})
    })
    
  })

  describe('mapDispatchToProps()', () => {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(() => {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
    })

    ${mapDispatchToPropsMethodNames ? generateDispatchMethodDescribeBlocks(mapDispatchToPropsMethodNames) : 'delete'}

  })

})`
}
