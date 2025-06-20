export const ERROR_CODES = {
  // REQUEST
  REQUEST_INVALID: 'REQUEST_INVALID',
  REQUEST_EXCEED_ALLOWED: 'REQUEST_EXCEED_ALLOWED',

  // TOKEN DOMAIN
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // OTP DOMAIN
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',

  // USER DOMAIN
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INVALID_CREDENTIALS: 'USER_INVALID_CREDENTIALS',
  USER_UNAUTHORIZED: 'USER_UNAUTHORIZED',
  USER_FORBIDDEN: 'USER_FORBIDDEN',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // PRODUCT DOMAIN
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
  PRODUCT_INVALID_PRICE: 'PRODUCT_INVALID_PRICE',

  // ORDER
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_INVALID_STATUS: 'ORDER_INVALID_STATUS',
  ORDER_PAYMENT_FAILED: 'ORDER_PAYMENT_FAILED',

  // VALIDATION
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_FORMAT_ERROR: 'VALIDATION_FORMAT_ERROR',
  VALIDATION_PATTERN_MISMATCH: 'VALIDATION_PATTERN_MISMATCH',
  VALIDATION_LENGTH_INVALID: 'VALIDATION_LENGTH_INVALID',
  VALIDATION_RANGE_INVALID: 'VALIDATION_RANGE_INVALID',
  VALIDATION_TYPE_INVALID: 'VALIDATION_TYPE_INVALID',
  VALIDATION_ENUM_INVALID: 'VALIDATION_ENUM_INVALID',

  // SYSTEM
  SYSTEM_INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
  SYSTEM_EXTERNAL_ERROR: 'SYSTEM_EXTERNAL_ERROR',
  SYSTEM_SERVICE_UNAVAILABLE: 'SYSTEM_SERVICE_UNAVAILABLE',

  // DATABASE
  DATABASE_ERROR: 'DATABASE_ERROR'
}

/**
 * ApiError
 * Base class for all API errors, extends JavaScript Error.
 * Captures HTTP status, application-specific error code,
 * operational flag, timestamp, and optional context for tracing.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to return
   * @param {string} errorCode - One of ERROR_CODES
   * @param {string} message - Human-readable error message
   * @param {boolean} isOperational - True if error is expected/handled
   * @param {Object} context - Optional context (correlationId, request info)
   */
  constructor(
    statusCode,
    errorCode,
    message,
    isOperational = true,
    context = {}
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Optional tracing properties
    this.correlationId = context.correlationId || null
    this.request = context.request || null

    // Capture stack trace excluding constructor
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * BusinessLogicError
 * Represents client-triggered errors due to invalid operations
 * (e.g., duplicate signup, unauthorized actions).
 * Always returns HTTP 400 with a business-specific error code.
 */
export class BusinessLogicError extends ApiError {
  /**
   * @param {string} errorCode - Specific business logic error code
   * @param {string} message - Description of the logical violation
   * @param {any} details - Optional additional error details
   * @param {Object} context - Optional tracing context
   */
  constructor(errorCode, message, details = {}, context = {}) {
    super(400, errorCode, message, true, context)
    this.type = 'BUSINESS_LOGIC'
    this.details = details
  }
}

/**
 * SystemError
 * Represents server-side failures (e.g., unhandled exceptions,
 * downstream service failures). Always returns HTTP 500.
 */
export class SystemError extends ApiError {
  /**
   * @param {string} errorCode - Specific system error code
   * @param {string} message - Description of the failure
   * @param {Error|null} originalError - Underlying exception object
   * @param {Object} context - Optional tracing context
   */
  constructor(errorCode, message, originalError = null, context = {}) {
    super(500, errorCode, message, false, context)
    this.type = 'SYSTEM'
    this.originalError = originalError
  }
}

/**
 * ValidationError
 * Captures schema validation failures (e.g., Joi errors).
 * Returns HTTP 422 with field-specific error codes.
 */
export class ValidationError extends ApiError {
  /**
   * @param {Array<{field: string, errorCode: string}>} fields - List of field errors
   * @param {Object} context - Optional tracing context
   */
  constructor(fields, context = {}) {
    super(422, 'VALIDATION_FAILED', 'Input validation failed', true, context)
    this.type = 'VALIDATION'
    this.fields = fields
  }

  /**
   * Create ValidationError from Joi validation result
   * Maps Joi error types to application error codes.
   * @param {Object} joiError - Joi validation error object
   * @param {Object} context - Optional tracing context
   * @returns {ValidationError}
   */
  static fromJoi(joiError, context = {}) {
    const joiToErrorCodeMap = {
      'string.pattern.base': ERROR_CODES.VALIDATION_PATTERN_MISMATCH,
      'string.email': ERROR_CODES.VALIDATION_FORMAT_ERROR,
      'string.min': ERROR_CODES.VALIDATION_LENGTH_INVALID,
      'string.max': ERROR_CODES.VALIDATION_LENGTH_INVALID,
      'number.min': ERROR_CODES.VALIDATION_RANGE_INVALID,
      'number.max': ERROR_CODES.VALIDATION_RANGE_INVALID,
      'number.base': ERROR_CODES.VALIDATION_TYPE_INVALID,
      'boolean.base': ERROR_CODES.VALIDATION_TYPE_INVALID,
      'array.min': ERROR_CODES.VALIDATION_LENGTH_INVALID,
      'array.max': ERROR_CODES.VALIDATION_LENGTH_INVALID,
      'any.required': ERROR_CODES.VALIDATION_MISSING_FIELD,
      'any.invalid': ERROR_CODES.VALIDATION_INVALID_INPUT,
      'any.only': ERROR_CODES.VALIDATION_ENUM_INVALID,
      'object.unknown': ERROR_CODES.VALIDATION_INVALID_INPUT
    }

    const fields = joiError.details.map(detail => ({
      field: detail.path.join('.'),
      errorCode:
        joiToErrorCodeMap[detail.type] || ERROR_CODES.VALIDATION_INVALID_INPUT
    }))

    return new ValidationError(fields, context)
  }
}
