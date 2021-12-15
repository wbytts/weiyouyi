
export function isObject(val){
  return typeof val === "object" && val !== null
}

export function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key);
}


export function isOn(key){
  return /^on[A-Z]/.test(key)
}