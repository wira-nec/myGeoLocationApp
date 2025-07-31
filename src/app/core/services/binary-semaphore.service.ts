import { Injectable } from '@angular/core';

type Waiter = (value: void | PromiseLike<void>) => void;

@Injectable({
  providedIn: 'root',
})
export class BinarySemaphoreService {
  private locked = true; // Always start waiting
  private waiters: Waiter[] = [];

  async acquire(): Promise<void> {
    // If lock is free, take it immediately
    if (!this.locked) {
      this.locked = true;
      return;
    }
    // Otherwise, return a promise that resolves when the lock is released
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    }).then(() => {
      this.locked = true;
    });
  }

  release(): void {
    // If there are waiting requests, resolve the first one
    if (this.waiters.length > 0) {
      const nextResolve = this.waiters.shift();
      // resolve function sitting at the front of the queue (FIFO) is called, and lock is acquired again
      if (nextResolve) nextResolve();
    } else {
      // No waiting promises, so mark the lock as free
      this.locked = false;
    }
  }
}
