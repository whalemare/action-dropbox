/**
 * Typed version of Object.keys
 */
export const getKeys = <T extends Record<string, V>, V>(o: T): (keyof T)[] => Object.keys(o) as (keyof T)[]
