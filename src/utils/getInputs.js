import * as core from '@actions/core'

export function getInputs(raw) {
  return Object.keys(raw).reduce((total, key) => {
    const rawType = raw[key]

    onKey(key, (value) => {
      if (rawType === 'boolean' || rawType === 'boolean?') {
        total[key] = Boolean(value)
      } else if (rawType === 'number' || rawType === 'number?') {
        total[key] = Number.parseFloat(value)
      } else {
        total[key] = value
      }
    })

    return total
  }, {})
}

function onKey(key, onValue) {
  const value = core.getInput(key)
  if (value !== null && value !== undefined) {
    onValue(value)
  }
}
