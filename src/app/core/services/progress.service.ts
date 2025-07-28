import { Injectable } from '@angular/core';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { BehaviorSubject, Observable } from 'rxjs';

export type Progress = Record<
  string,
  { value: number; max: number; count: number; mode: ProgressBarMode }
>;

export const XSL_IMPORT_PROGRESS_ID = 'xsl-import-progress';
export const PICTURES_IMPORT_PROGRESS_ID = 'pictures-import-progress';

const DEFAULT_PROGRESS_BAR_MODE = 'indeterminate';
@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private progressSubject = new BehaviorSubject<Progress>({});
  private isRunning: Record<string, boolean> = {};
  private mode: Record<string, ProgressBarMode> = {
    [XSL_IMPORT_PROGRESS_ID]: DEFAULT_PROGRESS_BAR_MODE,
    [PICTURES_IMPORT_PROGRESS_ID]: DEFAULT_PROGRESS_BAR_MODE,
  };

  public async increaseProgressByStep(id: string) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve(this.increaseProgressByStepAsync(id));
      }, 0);
    });
  }

  getProgress(): Observable<Progress> {
    return this.progressSubject;
  }

  setProgressMode(progressId: string, mode: ProgressBarMode) {
    this.mode[progressId] = mode;
    this.progressSubject.value[progressId] = {
      ...this.progressSubject.getValue()[progressId],
      mode,
    };
  }

  getProgressMode(progressId: string): ProgressBarMode {
    return this.mode[progressId];
  }

  currentProgress(progressId: string) {
    return this.progressSubject.getValue()[progressId];
  }

  isProgressRunning(progressId: string): boolean {
    return this.isRunning[progressId];
  }

  setProgress(progressId: string, value: number) {
    console.log('Set progress', progressId, value);
    const current = this.progressSubject.value;
    const max = current[progressId]?.max ?? 100;
    const mode = current[progressId].mode || DEFAULT_PROGRESS_BAR_MODE;
    this.progressSubject.next({
      ...current,
      [progressId]: { value, max, count: 0, mode },
    });
  }

  setMaxCount(progressId: string, max: number) {
    console.log('Set max count', progressId, max);
    this.isRunning[progressId] = max > 1;
    const current = this.progressSubject.value;
    const mode = current[progressId]?.mode || DEFAULT_PROGRESS_BAR_MODE;
    this.progressSubject.next({
      ...current,
      [progressId]: { value: 0, max, count: 0, mode },
    });
  }

  async increaseProgressByStepAsync(progressId: string) {
    const current = this.progressSubject.value;
    const progress = current[progressId];
    const mode = current[progressId]?.mode || DEFAULT_PROGRESS_BAR_MODE;
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
        mode,
      },
    });
    this.isRunning[progressId] = newValue < 100;
  }
}
