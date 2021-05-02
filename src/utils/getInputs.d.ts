/* eslint-disable prettier/prettier */
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
