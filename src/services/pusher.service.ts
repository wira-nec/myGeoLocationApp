import { Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Pusher: any;

@Injectable({
  providedIn: 'root',
})
export class PusherService {
  constructor() {
    // ToDo use hidden key
    const pusher = new Pusher('409287850efe9b9b147c', {
      cluster: 'eu',
    });
    this.channel = pusher.pipe(takeUntilDestroyed()).subscribe('location');
  }
  channel;

  public init() {
    return this.channel;
  }
}
