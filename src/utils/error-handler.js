/**
 * error-handler.js
 * Error handling module - Simplified, only handles OpenAI compatible API error formats
 */

'use strict';

/**
 * Get translation error type
 * @param {Error} e Error object
 * @param {string} provider Translation provider name
 * @param {Function} t Translate function
 * @returns {string} Error type description
 */
function getErrorType(e, provider = '', t = null) {
  const translate = t || (key => key);
  const msg = String(e);
  let statusCode = e.statusCode || e.status || (e.response && e.response.status);

  // Attempt to extract HTTP status code from error message
  if (!statusCode) {
    const httpErrorMatch = msg.match(/HTTP Error (\d{3}):/);
    if (httpErrorMatch && httpErrorMatch[1]) {
      statusCode = parseInt(httpErrorMatch[1], 10);
    }
  }

  // Network error
  if (e.code === 'ENOTFOUND' || (e.cause && e.cause.code === 'ENOTFOUND')) {
    return translate('dnsResolutionError');
  }
  if (e.code === 'ECONNREFUSED' || (e.cause && e.cause.code === 'ECONNREFUSED')) {
    return translate('connectionRefusedError');
  }
  if (e.code === 'ETIMEDOUT' || (e.cause && e.cause.code === 'ETIMEDOUT')) {
    return translate('networkTimeoutError');
  }
  if (msg.includes('fetch failed') || msg.includes('network error')) {
    return translate('networkConnectionError');
  }

  // HTTP status code error
  if (statusCode) {
    return getHttpErrorType(statusCode, msg, translate);
  }

  // OpenAI compatible error format parsing
  const errorData = e.responseBody || (e.response && (e.response.data || e.response.body));
  if (errorData && errorData.error) {
    const openaiError = errorData.error;

    // Determine by error code
    if (openaiError.code === 'model_not_found') return translate('modelNotFoundError');
    if (openaiError.code === 'insufficient_quota') return translate('quotaExceededError');
    if (openaiError.code === 'context_length_exceeded') return translate('contextLengthExceededError');
    if (openaiError.code === 'invalid_api_key') return translate('invalidApiKeyError');
    if (openaiError.code === 'rate_limit_exceeded') return translate('rateLimitError');

    // Determine by error type
    if (openaiError.type === 'invalid_request_error') return translate('badRequestError');
    if (openaiError.type === 'authentication_error') return translate('unauthorizedError');
  }

  // Common error pattern matching
  if (/invalid.*key|api.*key.*invalid/i.test(msg)) return translate('invalidApiKeyError');
  if (/rate.*limit|too.*many.*requests/i.test(msg)) return translate('rateLimitError');
  if (/quota.*exceeded|insufficient.*quota/i.test(msg)) return translate('quotaExceededError');
  if (/model.*not.*found/i.test(msg)) return translate('modelNotFoundError');
  if (/context.*length|too.*long/i.test(msg)) return translate('contextLengthExceededError');
  if (/JSON|parse|syntax/i.test(msg)) return translate('jsonParseError');
  if (/invalid.*response|empty.*response/i.test(msg)) return translate('invalidResponseError');

  return translate('unknownError');
}

/**
 * Get HTTP error type
 * @param {number} statusCode HTTP status code
 * @param {string} msg Error message
 * @param {Function} translate Translate function
 * @returns {string} HTTP error type description
 */
function getHttpErrorType(statusCode, msg, translate) {
  const httpErrorMap = {
    400: 'badRequestError',
    401: 'unauthorizedError',
    403: 'forbiddenError',
    404: 'notFoundError',
    408: 'requestTimeoutError',
    413: 'contentTooLargeError',
    429: 'rateLimitError',
    500: 'serverError',
    502: 'gatewayError',
    503: 'serviceUnavailableError',
    504: 'gatewayTimeoutError'
  };

  return httpErrorMap[statusCode]
    ? translate(httpErrorMap[statusCode])
    : translate('httpError', statusCode);
}

/**
 * Handle translation error
 * @param {Error} error Error object
 * @param {string} provider Provider name
 * @param {Function} t Translate function
 * @returns {Object} Object containing error type and message
 */
function handleTranslationError(error, provider = 'unknown', t = null) {
  const errorType = getErrorType(error, provider, t);
  const errorMessage = error.message || (t ? t('unknownError') : 'unknownError');

  return {
    type: errorType,
    message: errorMessage
  };
}

module.exports = {
  getErrorType,
  getHttpErrorType,
  handleTranslationError
};