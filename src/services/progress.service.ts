import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ProgressService {
  private progressSubject = new BehaviorSubject<number>(0);

  progress$ = this.progressSubject.asObservable();
  bufferSize = 0;

  reset(bufferSize = 0) {
    this.progressSubject.next(0);
    this.bufferSize = bufferSize;
  }

  incrementProgress(count = 1) {
    this.progressSubject.next(
      (100 / this.bufferSize) * this.progressSubject.value + count
    );
  }
}
