import { Component } from '@angular/core';
import { LoadPictureService } from '../../../core/services/load-picture.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ImportProgressBarComponent } from '../import-progress-bar/import-progress-bar.component';
import {
  PICTURES_IMPORT_PROGRESS_ID,
  ProgressService,
} from '../../../core/services/progress.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-multiple-files',
  imports: [MatProgressBarModule, ImportProgressBarComponent, CommonModule],
  templateUrl: './upload-multiple-files.component.html',
  styleUrl: './upload-multiple-files.component.scss',
})
export class UploadMultipleFilesComponent {
  constructor(
    private pictureService: LoadPictureService,
    readonly progressService: ProgressService
  ) {}

  progressId = PICTURES_IMPORT_PROGRESS_ID;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadFiles(e: any) {
    const files = Array.from(e.target.files as FileList);
    this.progressService.setProgressMode(
      PICTURES_IMPORT_PROGRESS_ID,
      'determinate'
    );
    this.progressService.setMaxCount(PICTURES_IMPORT_PROGRESS_ID, files.length);
    await this.pictureService.loadPictures(files, this.progressService);
  }
}
