import { Observable } from 'rxjs/Observable';

export function isNonemptyString(o) {
  return typeof o === 'string' && o !== '';
}

// { _acl: { creator: string } }
export function userIsOwner(userId: string, entity: any) {
  return entity._acl.creator === userId;
}

export function cloneObject<T>(o: T) {
  const copy = {} as any;
  for (let key in o) {
    if (Array.isArray(o[key])) {
      copy[key] = (o[key] as any).slice(0);
    } else if (typeof o[key] === 'object') {
      copy[key] = cloneObject(o[key]);
    } else {
      copy[key] = o[key];
    }
  }
  return copy;
}

export function wrapInNativePromise<T>(promise: Promise<T>): Promise<T>
export function wrapInNativePromise<T>(promise: Observable<T>): Promise<T>
export function wrapInNativePromise<T>(asyncTask: Promise<T> | Observable<T>): Promise<T> {
  const task = asyncTask as any;
  const promise: Promise<any> = task.then ? task : task.toPromise();

  return new Promise((resolve, reject) => {
    promise.then(resolve, reject);
  });
}
