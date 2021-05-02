/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */

import * as core from '@actions/core'

type AllowedTypes = 'number' | 'string' | 'boolean'

type Types = AllowedTypes | `${AllowedTypes}?`

type DictRawTypes<Key extends string, V extends Types> = { [key in Key]: V }
type DictRealTypes<Key extends string, V extends Types, Raw = DictRawTypes<Key, V>> = {
  [key in keyof Raw]
  : Raw[key] extends 'string?' ? string | undefined
  : Raw[key] extends 'string' ? string

  : Raw[key] extends 'number?' ? number | undefined
  : Raw[key] extends 'number' ? number

  : Raw[key] extends 'boolean?' ? boolean | undefined
  : Raw[key] extends 'boolean' ? boolean
  : unknown
}

export function getInputs<Key extends string, V extends Types, Raw extends { [key in Key]: V }>(
  raw: Raw,
): DictRealTypes<Key, V, Raw>

export function getInputs(raw: any) {
  return Object.keys(raw).reduce((total, key) => {
    const rawType = raw[key]

    onKey(key, (value: any) => {
      if (rawType === 'boolean' || rawType === 'boolean?') {
        total[key] = Boolean(value)
      } else if (rawType === 'number' || rawType === 'number?') {
        total[key] = Number.parseFloat(value)
      } else {
        total[key] = value
      }
    })

    return total
  }, {} as any)
}

function onKey(key: any, onValue: (value: any) => void) {
  const value = core.getInput(key)
  if (value !== null && value !== undefined) {
    onValue(value)
  }
}
