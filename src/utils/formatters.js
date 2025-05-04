import { pick } from 'lodash'

// Return some needed info to frontend
export const pickUser = (user) => {
  if (!user) return {}
  return pick(user, [
    'id',
    'fullName',
    'email',
    'avatar',
    'role',
    'isActive',
    'createdAt',
    'updatedAt'
  ])
}