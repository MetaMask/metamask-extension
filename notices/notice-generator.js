var fsp = require('fs-promise')
var path = require('path')
var prompt = require('prompt')
var open = require('open')
var extend = require('extend')
var notices = require('./notices.json')

var id = 0
var date = new Date().toDateString()

var notice = {
  read: false,
  date: date,
}

fsp.readdir('notices/archive')
  .then((files) => {
    files.forEach(file => { id ++ })
    Promise.resolve()
  }).then(() => {
    fsp.writeFile(`notices/archive/notice_${id}.md`,'Message goes here. Please write out your notice and save before proceeding at the command line.')
      .then(() =>  {
        open(`notices/archive/notice_${id}.md`)
        prompt.start()
        prompt.get(['title'], (err, result) => {
          notice.title = result.title
          fsp.readFile(`notices/archive/notice_${id}.md`)
            .then((body) => {
              notice.body = body.toString()
              notice.id = id
              notices.push(notice)
              return fsp.writeFile(`notices/notices.json`, JSON.stringify(notices))
            })
        })
      })
  })
