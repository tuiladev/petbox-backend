import { pick } from 'lodash'

// User DTO
export const pickUser = user => {
  if (!user) return {}
  return pick(user, ['fullName', 'email', 'phone', 'birthDate', 'avatar'])
}
