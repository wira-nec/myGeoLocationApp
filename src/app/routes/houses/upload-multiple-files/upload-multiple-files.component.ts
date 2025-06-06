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
    this.progressService.setMaxCount(PICTURES_IMPORT_PROGRESS_ID, files.length);
    // use for loop because of async function, which will not wait in a foreach
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      this.pictureService.loadPicture(file, file.name);
      await this.progressService.increaseProgressByStep(
        PICTURES_IMPORT_PROGRESS_ID
      );
    }
  }
}
