import { ApiError, SystemError } from '~/utils/error'

const createClientResponse = error => {
  if (error.isOperational) {
    const response = {
      success: false,
      errorCode: error.errorCode,
      message: error.message
    }
    // Adding more details if needed to client self handler
    if (error.details) response.details = error.details
    if (error.fields) response.fields = error.fields
    return response
  }

  return {
    // Common format for client to prevent infomation leak
    success: false,
    errorCode: 'SYSTEM_INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.'
  }
}

export const globalErrorHandler = (err, req, res, next) => {
  // Provide context
  const correlationId = req.correlationId
  const requestContext = {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }

  console.error(err)
  let error = err
  if (!(err instanceof ApiError)) {
    // Standardlize all error if not ApiError
    error = new SystemError(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred internally',
      err, // originalError keep stack trace and details
      {
        correlationId: correlationId,
        request: requestContext
      }
    )
  } else {
    // ensure minium correlationId and request in context (if dev not provide when throw error)
    if (!error.correlationId) error.correlationId = correlationId
    if (!error.request) error.request = requestContext
  }

  // Use logger config to log error
  req.logger.error(error)

  // Return format to client
  const clientResponse = createClientResponse(error)

  res.status(error.statusCode || 500).json({
    ...clientResponse,
    correlationId: error.correlationId,
    timestamp: error.timestamp
  })
}
