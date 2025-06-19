import path from 'node:path'
import winston from 'winston'
import stackTrace from 'stack-trace'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from '~/utils/environment'

const { combine, timestamp, printf, errors, colorize, metadata } =
  winston.format

const getStackFrames = (input, maxFrames = 10) => {
  try {
    let errorToParse
    if (input instanceof Error) {
      errorToParse = input
    } else {
      errorToParse = new Error()
      errorToParse.stack = input
    }
    return stackTrace.parse(errorToParse).slice(0, maxFrames)
  } catch {
    return []
  }
}

const formatStack = frames =>
  frames
    .map(f => {
      const fn = f.getFunctionName() || '<anonymous>'
      const file = f.getFileName() || ''
      const rel = file ? path.relative(process.cwd(), file) : 'unknown'
      const line = f.getLineNumber() || 0
      const col = f.getColumnNumber() || 0
      const entry = `-> at ${fn} (${rel}:${line}:${col})`
      return rel.startsWith('src' + path.sep)
        ? `\x1b[1m${entry}\x1b[22m`
        : entry
    })
    .join('\n')

const standardizeTraceFormat = winston.format(info => {
  info.trace = info.stack || info.meta?.trace
  delete info.stack
  if (info.meta) delete info.meta.trace

  return info
})

const finalFormat = printf(({ level, message, timestamp, trace, metadata }) => {
  let log
  if (trace) {
    const errorMessage = Array.isArray(trace)
      ? trace[0]
      : trace.toString().split('\n')[0]
    log = `${timestamp} ${level}: ${errorMessage}`
    const formattedStack = formatStack(getStackFrames(trace))
    log += `\n📍 Stack Trace:\n${formattedStack}`
  } else {
    log = `${timestamp} ${level}: ${message}`
  }

  if (metadata && Object.keys(metadata).length > 0) {
    log += `\n📦 Metadata:\n ${JSON.stringify(metadata, null, 2)} `
  }

  return log
})

const rotateOptions = {
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  compress: true
}

const getMetadataFilter = () => {
  if (env.BUILD_MODE === 'development') {
    return {
      fillExcept: [
        'level',
        'name',
        'message',
        'timestamp',
        'trace',
        'os',
        'process',
        'date',
        'error',
        'environment',
        'version'
      ]
    }
  }

  return {
    fillExcept: ['level', 'message', 'timestamp', 'trace']
  }
}

export const logger = winston.createLogger({
  level: env.BUILD_MODE === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    standardizeTraceFormat(),
    metadata(getMetadataFilter()),
    finalFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize({ all: true }), finalFormat),
      handleExceptions: true,
      handleRejections: true
    }),
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'logs/%DATE%-combined.log'
    }),
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'logs/%DATE%-error.log',
      level: 'error',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        winston.format.json()
      ),
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
})
