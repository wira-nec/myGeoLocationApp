import { Injectable } from '@angular/core';
import * as Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root',
})
export class PusherService {
  constructor() {
    // ToDo use hidden key
    const pusher = new Pusher.default('409287850efe9b9b147c', {
      cluster: 'eu',
    });
    this.channel = pusher.subscribe('location');
  }
  channel;

  public init() {
    return this.channel;
  }
}
