import { Component, AfterViewInit, DestroyRef, inject } from '@angular/core';
import { LoadPictureService } from '../../../core/services/load-picture.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ImportProgressBarComponent } from '../import-progress-bar/import-progress-bar.component';
import {
  PICTURES_IMPORT_PROGRESS_ID,
  ProgressService,
} from '../../../core/services/progress.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { ToasterService } from '../../../core/services/toaster.service';

@Component({
  selector: 'app-upload-multiple-files',
  imports: [MatProgressBarModule, ImportProgressBarComponent, CommonModule],
  templateUrl: './upload-multiple-files.component.html',
  styleUrl: './upload-multiple-files.component.scss',
})
export class UploadMultipleFilesComponent implements AfterViewInit {
  constructor(
    private readonly pictureService: LoadPictureService,
    private readonly progressService: ProgressService,
    private readonly toaster: ToasterService
  ) {}

  private readonly destroyRef = inject(DestroyRef);
  private nrOfUploadedFiles = 0;
  progressId = PICTURES_IMPORT_PROGRESS_ID;

  ngAfterViewInit(): void {
    // Watch for progress to be finished
    const progressFinishedSubscription = this.progressService
      .getProgress()
      .pipe(
        filter(
          (progress) =>
            Object.keys(progress).length > 0 &&
            !!progress[PICTURES_IMPORT_PROGRESS_ID] &&
            progress[PICTURES_IMPORT_PROGRESS_ID].value === 100 &&
            this.progressService.isProgressRunning(PICTURES_IMPORT_PROGRESS_ID)
        )
      )
      .subscribe(() => {
        this.toaster.show(
          'success',
          `${this.nrOfUploadedFiles} images uploaded`
        );
      });
    this.destroyRef.onDestroy(() => {
      progressFinishedSubscription.unsubscribe();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadFiles(e: any) {
    const files = Array.from(e.target.files as FileList);
    this.progressService.setProgressMode(
      PICTURES_IMPORT_PROGRESS_ID,
      'determinate'
    );
    this.nrOfUploadedFiles = files.length;
    this.progressService.setMaxCount(PICTURES_IMPORT_PROGRESS_ID, files.length);
    await this.pictureService.loadPictures(files, this.progressService);
  }
}
