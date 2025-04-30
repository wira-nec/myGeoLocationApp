import { Component } from '@angular/core';
import { LoadPictureService } from '../../services/load-picture.service';

@Component({
  selector: 'app-upload-multiple-files',
  imports: [],
  templateUrl: './upload-multiple-files.component.html',
  styleUrl: './upload-multiple-files.component.scss',
})
export class UploadMultipleFilesComponent {
  constructor(private pictureService: LoadPictureService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadFiles(e: any) {
    Array.from(e.target.files as FileList).forEach((file: File) => {
      this.pictureService.storePicture(file, file.name);
    });
  }
}
