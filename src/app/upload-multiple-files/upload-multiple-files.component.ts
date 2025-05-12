import { Component } from '@angular/core';
import { LoadPictureService } from '../../services/load-picture.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ImportProgressBarComponent } from '../import-progress-bar/import-progress-bar.component';
import { ProgressService } from '../../services/progress.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-multiple-files',
  imports: [MatProgressBarModule, ImportProgressBarComponent, CommonModule],
  templateUrl: './upload-multiple-files.component.html',
  styleUrl: './upload-multiple-files.component.scss',
  providers: [ProgressService],
})
export class UploadMultipleFilesComponent {
  constructor(
    private pictureService: LoadPictureService,
    readonly progressService: ProgressService
  ) {
    this.progressService.reset();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadFiles(e: any) {
    const files = Array.from(e.target.files as FileList);
    this.progressService.reset(100 / files.length);
    files.forEach((file: File) => {
      this.pictureService.loadPicture(file, file.name);
      this.progressService.incrementProgress();
    });
  }
}
