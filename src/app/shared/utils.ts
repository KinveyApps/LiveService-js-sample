export function isNonemptyString(o) {
  return typeof o === 'string' && o !== '';
}

// { _acl: { creator: string } }
export function userIsOwner(userId: string, entity: any) {
  return entity._acl.creator === userId;
}

export function cloneObject<T>(o: T) {
  return Object.assign({}, o) as T;
}
