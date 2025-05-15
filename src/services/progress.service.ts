import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Progress = Record<string, number>;

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private progressSubject = new BehaviorSubject<Progress>({});

  progress$ = this.progressSubject.asObservable();

  setProgress(progressId: string, count: number) {
    this.progressSubject.next({ [progressId]: count });
  }
}
