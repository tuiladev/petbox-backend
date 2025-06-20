import path from 'node:path'
import winston from 'winston'
import stackTrace from 'stack-trace'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from '~/utils/environment'

// Extract formatting helpers from winston.format
const { combine, timestamp, printf, errors, colorize, metadata } =
  winston.format

/**
 * Extract an array of stack frames from an Error or raw stack string.
 * @param {Error|string} input - Error instance or raw stack text
 * @param {number} maxFrames - Maximum number of frames to return
 * @returns {Array} List of parsed stack frames (limited by maxFrames)
 */
const getStackFrames = (input, maxFrames = 7) => {
  try {
    let errorToParse
    if (input instanceof Error) {
      // If already an Error, use it directly
      errorToParse = input
    } else {
      // Otherwise create a new Error and assign the raw stack text
      errorToParse = new Error()
      errorToParse.stack = input
    }
    // Parse and slice to keep only up to maxFrames
    return stackTrace.parse(errorToParse).slice(0, maxFrames)
  } catch {
    // On any parse failure, return empty array
    return []
  }
}

/**
 * Format stack frame entries into readable lines.
 * Bold face entries originating from 'src/' folder for emphasis.
 * @param {Array} frames - Array of stack frame objects
 * @returns {string} Formatted multi-line stack trace
 */
const formatStack = frames =>
  frames
    .map(f => {
      const fn = f.getFunctionName() || '<anonymous>'
      const file = f.getFileName() || ''
      // Convert absolute path to project-relative path
      const rel = file ? path.relative(process.cwd(), file) : 'unknown'
      const line = f.getLineNumber() || 0
      const col = f.getColumnNumber() || 0
      const entry = `-> at ${fn} (${rel}:${line}:${col})`
      // Highlight frames from source code directory
      return rel.startsWith('src' + path.sep)
        ? `\x1b[1m${entry}\x1b[22m` // ANSI bold on/off
        : entry
    })
    .join('\n')

/**
 * Normalize trace data into a single 'trace' property on the log info object.
 * Removes original 'stack' and any nested meta.trace.
 */
const standardizeTraceFormat = winston.format(info => {
  info.trace = info.stack || info.meta?.trace
  delete info.stack
  if (info.meta) delete info.meta.trace

  return info
})

/**
 * Final log message formatter.
 * Includes timestamp, level, message or error, stack trace, and metadata.
 */
const finalFormat = printf(({ level, message, timestamp, trace, metadata }) => {
  let log
  if (trace) {
    // Get first line of error message from trace
    const errorMessage = Array.isArray(trace)
      ? trace[0]
      : trace.toString().split('\n')[0]
    log = `${timestamp} ${level}: ${errorMessage}`
    // Append formatted stack trace
    const formattedStack = formatStack(getStackFrames(trace))
    log += `\n📍 Stack Trace:\n${formattedStack}`
  } else {
    // Simple log without error trace
    log = `${timestamp} ${level}: ${message}`
  }

  // Append any additional metadata as JSON
  if (metadata && Object.keys(metadata).length > 0) {
    log += `\n📦 Metadata:\n ${JSON.stringify(metadata, null, 2)} `
  }

  return log
})

// Configuration for daily rotation of log files
const rotateOptions = {
  datePattern: 'YYYY-MM-DD', // Rotate logs each day
  maxSize: '20m', // Max file size before rotation
  maxFiles: '14d', // Keep logs for 14 days
  compress: true // Compress rotated files
}

/**
 * Determine which metadata fields to include or exclude based on environment.
 */
const getMetadataFilter = () => {
  if (env.BUILD_MODE === 'development') {
    // In development, include most fields except base ones
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
        'version',
        'buffer'
      ]
    }
  }

  // In production, only main fields are retained
  return {
    fillExcept: ['level', 'message', 'timestamp', 'trace']
  }
}

// Create the Winston logger instance
export const logger = winston.createLogger({
  level: env.BUILD_MODE === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'HH:mm:ss' }), // Add timestamp as HH:mm:ss
    errors({ stack: true }), // Capture full error stack
    standardizeTraceFormat(), // Normalize trace field
    metadata(getMetadataFilter()), // Attach filtered metadata
    finalFormat // Format the final log string
  ),
  transports: [
    // Console transport for real-time logs
    new winston.transports.Console({
      format: combine(colorize({ all: true }), finalFormat),
      handleExceptions: true, // Catch exceptions
      handleRejections: true // Catch promise rejections
    }),
    // Combined log file (all levels)
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'logs/%DATE%-combined.log'
    }),
    // Separate error log file
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
  exitOnError: false // Prevent exit on handled errors
})
