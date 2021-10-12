export class Queue<T> {
  queueresolve: undefined | ((vaule: T) => void) = undefined;

  request: T[] = [];
  push(instance: T) {
    if (this.queueresolve) {
      this.queueresolve(instance);
      this.queueresolve = undefined;
    } else {
      this.request.push(instance);
    }
  }
  pop() {
    return this.request.shift();
  }
}
