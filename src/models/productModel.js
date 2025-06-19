import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE } from '~/utils/validator'
import { ValidationError } from '~/utils/apiError'

// Collection name and Joi schema
const PRODUCT_COLLECTION_NAME = 'products'
const PRODUCT_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().trim(),
  slug: Joi.string().required().trim(),
  description: Joi.string().default(''),
  categoryId: Joi.string().pattern(OBJECT_ID_RULE).required(),
  images: Joi.array().items(Joi.string().uri()).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

// Fields not allowed in update
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return await PRODUCT_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createNew = async data => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdProduct = await GET_DB()
      .collection(PRODUCT_COLLECTION_NAME)
      .insertOne(validData)
    return createdProduct
  } catch (error) {
    throw new ValidationError.fromJoi(error)
  }
}

const findOneBySlug = async slug => {
  try {
    return await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOne({ slug })
  } catch (error) {
    throw new Error(error)
  }
}

const getProductVariants = async product => {
  if (!product || !product._id) return []
  return await GET_DB()
    .collection('productVariants')
    .find({ productId: new ObjectId(product._id) })
    .toArray()
}

export const productModel = {
  PRODUCT_COLLECTION_NAME,
  PRODUCT_COLLECTION_SCHEMA,
  createNew,
  findOneBySlug,
  getProductVariants
}
