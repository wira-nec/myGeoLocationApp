import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Progress = Record<
  string,
  { value: number; max: number; count: number }
>;

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private progressSubject = new BehaviorSubject<Progress>({});

  progress$ = this.progressSubject.asObservable();

  setProgress(progressId: string, value: number) {
    console.log('Set progress', progressId, value);
    const current = this.progressSubject.value;
    const max = current[progressId]?.max ?? 100;
    this.progressSubject.next({
      ...current,
      [progressId]: { value, max, count: 0 },
    });
  }

  setMaxCount(progressId: string, max: number) {
    console.log('Set max count', progressId, max);
    const current = this.progressSubject.value;
    this.progressSubject.next({
      ...current,
      [progressId]: { value: 0, max, count: 0 },
    });
  }

  increaseProgressByStep(progressId: string) {
    const current = this.progressSubject.value;
    const progress = current[progressId];
    if (!progress || progress.max === 0) return;
    const step = 100 / progress.max;
    const newValue = Math.min(
      progress.value + Number.EPSILON * progress.max + step,
      100
    );
    console.log('Increase progress', progressId, newValue, progress.count + 1);
    this.progressSubject.next({
      ...current,
      [progressId]: {
        value: newValue,
        max: progress.max,
        count: progress.count + 1,
      },
    });
  }
}
