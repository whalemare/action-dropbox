import * as core from '@actions/core'

import { getKeys } from './getKeys'

type AllowedTypes = 'number' | 'string' | 'boolean'

type DictRawTypes<T extends string> = { [key in T]: AllowedTypes }
type DictRealTypes<T extends string, Raw = DictRawTypes<T>> = {
  [key in keyof Raw]: Raw[key] extends 'string'
    ? string
    : Raw[key] extends 'number'
    ? number
    : Raw[key] extends 'boolean'
    ? boolean
    : unknown
}

export function getInputs<Key extends string, V extends AllowedTypes, Raw extends { [key in Key]: V }>(
  raw: Raw,
): {
  [key in keyof Raw]: Raw[key] extends 'string'
    ? string
    : Raw[key] extends 'number'
    ? number
    : Raw[key] extends 'boolean'
    ? boolean
    : unknown
} {
  return getKeys(raw).reduce((total, key) => {
    total[key] = core.getInput(key)
    return total
  }, {})
}

const {} = getInputs({ isTrue: 'boolean' as const, count: 'number', name: 'string' })

// const { access_token, bool, count } = getInputs({
//   access_token: '',
//   count: 'number',
//   bool: 'boolean',
// })
