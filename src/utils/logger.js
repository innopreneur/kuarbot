/* logging middleware */
import { createLogger, format, transports } from 'winston'
import fs from 'fs'
import path from 'path'
import moment from 'moment'
require('winston-daily-rotate-file')
const env = process.env.NODE_ENV || 'development'
const logDir = 'logs'

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const filename = path.join(logDir, `kuarbot-${moment().utc().format('DD-MM-YYYY_HH-mm')}.log`)

var transport = new transports.DailyRotateFile({
  filename,
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '7d'
})


const logger = createLogger({
  // change level if in dev environment versus production
  level: env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} : KU-ARBOT : ${info.level} :: ${info.message}`)
  ),
  // You can also comment out the line above and uncomment the line below for JSON format
  //format: format.json(),
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        format.printf(info => `${info.timestamp} :: ${info.level} :: ${info.message}`)
      )
    }),
    transport
  ]
})

const getFileName = () => {
  let fileName = ""
  let rowNumber
  let columnNumber
  let currentStackPosition = 1 // this is the value representing the position of your caller in the error stack.
  try {
    throw new Error("Custom Error")
  } catch (e) {
    Error["prepareStackTrace"] = () => {
      return arguments[1]
    }
    Error.prepareStackTrace(e, function () { })
    fileName = e.stack[currentStackPosition].getFileName()
    rowNumber = e.stack[currentStackPosition].getLineNumber()
    columnNumber = e.stack[currentStackPosition].getColumnNumber()
  }
  return {
    "file": fileName,
    "row": rowNumber,
    "column": columnNumber
  }
}

export { logger }