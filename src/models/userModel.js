import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { ApiError, ERROR_CODES, SystemError } from '~/utils/error'
import {
  OBJECT_ID_RULE,
  EMAIL_RULE,
  PASSWORD_RULE,
  PHONE_RULE
} from '~/utils/validator'
import { logger } from '~/config/logger'

// Define temp roles
const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  STAFF: 'staff'
}

// Define Collection (Name & Schema)
const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  // Use regex to validate ObjectId (because no Object validate in Joi)
  fullName: Joi.string().required().min(5).max(30).trim().strict(),
  birthDate: Joi.date().default(null),
  gender: Joi.string().valid('male', 'female', 'other').default(null),
  email: Joi.string().pattern(EMAIL_RULE).default(null),
  username: Joi.string().min(5).default(null),
  phone: Joi.string().pattern(PHONE_RULE).default(null),
  password: Joi.string().pattern(PASSWORD_RULE).default(null),

  // Unified social login IDs
  socialIds: Joi.array()
    .items(
      Joi.object({
        provider: Joi.string().valid('google', 'zalo').required(),
        id: Joi.string().required()
      })
    )
    .default([]),

  avatar: Joi.string().default(null),
  role: Joi.string()
    .valid(USER_ROLES.CLIENT, USER_ROLES.ADMIN, USER_ROLES.STAFF)
    .default(USER_ROLES.CLIENT),

  membershipId: Joi.string().pattern(OBJECT_ID_RULE).default(null),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// Don't accept update feild
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

/**
 * Creates a new user document in the database after validation.
 * @param {Object} data - Raw user data to be validated and inserted
 * @returns {Promise<InsertOneResult>} The insertion result
 * @throws {SystemError} When database operation fails
 */
const createNew = async data => {
  logger.info('Creating new user with data:', data)
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .insertOne(validData)
    logger.info('User created successfully with id:', result.insertedId)
    return result
  } catch (error) {
    logger.error('Error creating new user:', error)
    throw new SystemError(
      ERROR_CODES.DATABASE_ERROR,
      'Failed to create new user',
      error
    )
  }
}

/**
 * Finds a user by their MongoDB ObjectId.
 * @param {string} userId - The string representation of the user _id
 * @returns {Promise<Object|null>} Found user or null
 * @throws {SystemError} When database operation fails
 */
const findOneById = async userId => {
  logger.info('Fetching user by ID:', userId)
  try {
    const user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(userId) })
    logger.info('User fetched by ID:', user)
    return user
  } catch (error) {
    logger.error('Error fetching user by ID:', error)
    throw new SystemError(
      ERROR_CODES.DATABASE_ERROR,
      'Failed to fetch user by ID',
      error
    )
  }
}

/**
 * Finds a user by their phone number.
 * @param {string} phone
 * @returns {Promise<Object|null>}
 */
const findOneByPhone = async phone => {
  logger.info(`Fetching user by phone: ${phone}`)
  try {
    const user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ phone })
    logger.info(`User fetched by phone: ${user}`)
    return user
  } catch (error) {
    logger.error('Error fetching user by phone:', error)
    throw new SystemError(
      ERROR_CODES.DATABASE_ERROR,
      'Failed to fetch user by phone',
      error
    )
  }
}

/**
 * Finds a user by their username.
 * @param {string} userName
 * @returns {Promise<Object|null>}
 */
const findOneByUserName = async userName => {
  logger.info('Fetching user by username:', userName)
  try {
    const user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ userName })
    logger.info('User fetched by username:', user)
    return user
  } catch (error) {
    logger.error('Error fetching user by username:', error)
    throw new SystemError(
      ERROR_CODES.DATABASE_ERROR,
      'Failed to fetch user by username',
      error
    )
  }
}

/**
 * Finds a user by social provider ID.
 * @param {string} provider - Social platform identifier
 * @param {string} socialId - Social account ID
 * @returns {Promise<Object|null>}
 */
const findOneBySocialId = async (provider, socialId) => {
  logger.info(`Fetching user by social ID [${provider}]: ${socialId}`)
  try {
    const user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({
        socialIds: { $elemMatch: { provider, id: socialId } }
      })
    logger.info(`User fetched by social ID: ${user}`)
    return user
  } catch (error) {
    logger.error('Error fetching user by social ID:', error)
    throw new SystemError(
      ERROR_CODES.DATABASE_ERROR,
      'Failed to find user by social ID',
      error
    )
  }
}

/**
 * Updates allowed fields of a user document and returns the updated record.
 * @param {string} userId
 * @param {Object} updateData - Key/value pairs to update
 * @returns {Promise<FindAndModifyWriteOpResultObject>} The update result
 * @throws {ApiError} When forbidden fields are present or update fails
 */
const update = async (userId, updateData) => {
  logger.info(`Updating user: ${userId} with data:`, updateData)
  try {
    // Remove any fields not allowed to be updated
    INVALID_UPDATE_FIELDS.forEach(field => delete updateData[field])

    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    logger.info('User update result:', result)
    return result
  } catch (error) {
    logger.error('Error updating user:', error)
    throw new ApiError(
      StatusCodes.BAD_GATEWAY,
      ERROR_CODES.USER_FORBIDDEN,
      'Failed to update user information',
      true
    )
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  createNew,
  findOneById,
  findOneByPhone,
  findOneByUserName,
  findOneBySocialId,
  update
}
