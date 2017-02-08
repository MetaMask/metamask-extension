var fs = require('fs')
var path = require('path')
var prompt = require('prompt')
var open = require('open')
var extend = require('extend')
var notices = require('./notices.json')


console.log('List of Notices')
console.log(`ID \t DATE \t\t\t TITLE`)
notices.forEach((notice) => {
  console.log(`${('  ' + notice.id).slice(-2)} \t ${notice.date} \t ${notice.title}`)
})
prompt.get(['id'], (error, res) => {
prompt.start()
  if (error) {
    console.log("Exiting...")
    process.exit()
  }
  var index = notices.findIndex((notice) => { return notice.id == res.id})
  if (index === -1) {
    console.log('Notice not found. Exiting...')
  }
  notices.splice(index, 1)
  fs.unlink(`notices/archive/notice_${res.id}.md`)
  fs.writeFile(`notices/notices.json`, JSON.stringify(notices))
})
