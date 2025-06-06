import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgressService } from '../../../core/services/progress.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

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
      //this.progressService.setProgress(this.progressId, 0);
      const progressServiceSubscription = this.progressService
        .getProgress()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(
            (progress) =>
              Object.keys(progress).length > 0 && !!progress[this.progressId]
          )
        )
        .subscribe((progress) => {
          console.log(
            `Progress for ${this.progressId}`,
            progress[this.progressId]
          );
          this.progress = progress[this.progressId].value;
        });
      this.destroyRef.onDestroy(() => {
        progressServiceSubscription.unsubscribe();
      });
    }
  }
}
