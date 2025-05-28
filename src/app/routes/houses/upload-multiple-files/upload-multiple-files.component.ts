import { Component } from '@angular/core';
import { LoadPictureService } from '../../../core/services/load-picture.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ImportProgressBarComponent } from '../import-progress-bar/import-progress-bar.component';
import { ProgressService } from '../../../core/services/progress.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-multiple-files',
  imports: [MatProgressBarModule, ImportProgressBarComponent, CommonModule],
  templateUrl: './upload-multiple-files.component.html',
  styleUrl: './upload-multiple-files.component.scss',
})
export class UploadMultipleFilesComponent {
  readonly PROGRESS_ID = 'pictures-import-progress';
  constructor(
    private pictureService: LoadPictureService,
    readonly progressService: ProgressService
  ) {
    // progressService.setProgress(this.PROGRESS_ID, 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadFiles(e: any) {
    const files = Array.from(e.target.files as FileList);
    this.progressService.setMaxCount(this.PROGRESS_ID, files.length);
    files.forEach((file: File) => {
      this.pictureService.loadPicture(file, file.name);
      this.progressService.increaseProgressByStep(this.PROGRESS_ID);
    });
  }
}
