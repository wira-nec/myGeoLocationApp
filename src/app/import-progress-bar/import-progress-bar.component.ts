import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Progress, ProgressService } from '../../services/progress.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-import-progress-bar',
  standalone: true,
  imports: [MatProgressBarModule, CommonModule],
  templateUrl: './import-progress-bar.component.html',
  styleUrl: './import-progress-bar.component.scss',
})
export class ImportProgressBarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  progress = 0;
  @Input() progressId!: string;

  constructor(readonly progressService: ProgressService) {}

  ngOnInit() {
    if (this.progressId) {
      this.progressService.setProgress(this.progressId, 0);
      const progressServiceSubscription = this.progressService.progress$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .pipe(
          filter((value: Progress) =>
            Object.keys(value).includes(this.progressId)
          )
        )
        .pipe(map((value: Progress) => Object.values(value)))
        .subscribe((progress) => {
          this.progress = progress[0];
        });
      this.destroyRef.onDestroy(() => {
        progressServiceSubscription.unsubscribe();
      });
    }
  }
}
