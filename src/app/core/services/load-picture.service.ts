import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  PICTURES_IMPORT_PROGRESS_ID,
  ProgressService,
} from './progress.service';
import { convertYearFilename } from '../helpers/string-manipulations';

export type PictureStore = Record<string, string | ArrayBuffer>;

@Injectable({
  providedIn: 'root',
})
export class LoadPictureService {
  private pictureStore: PictureStore = {};
  pictureStore$ = new Subject<PictureStore>();

  public loadPictureAsync(file: File, filename: string) {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          if (file.type.toLowerCase() === 'application/json') {
            const jsonData = JSON.parse(e.target?.result as string);
            Object.keys(jsonData).forEach((filename) => {
              this.storePicture(
                jsonData[filename.toLowerCase()],
                filename.toLowerCase()
              );
            });
          } else {
            this.storePicture(
              e.target?.result as string,
              filename.toLowerCase()
            );
          }
        }
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  public async loadPictures(files: File[], progressService: ProgressService) {
    const pictures: PictureStore = {};
    for (const file of files) {
      // make onload async to ensure all files are read before proceeding
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            const filename = convertYearFilename(file.name);
            Object.assign(pictures, {
              [filename.toLowerCase()]: e.target?.result as string,
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
      await progressService.increaseProgressByStep(PICTURES_IMPORT_PROGRESS_ID);
    }
    this.pictureStore = { ...this.pictureStore, ...pictures };
    this.pictureStore$.next(pictures);
  }

  // Store the picture in the pictureStore and emit the change
  public storePicture(blob: string, filename: string) {
    this.pictureStore[filename.toLowerCase()] = blob;
    this.pictureStore$.next({ [filename.toLowerCase()]: blob });
  }

  public getPicture(key: string) {
    if (Object.keys(this.pictureStore).includes(key)) {
      return this.pictureStore[key] as string;
    }
    return key;
  }

  public getPictureName(blob: string) {
    // find the key in the pictureStore that matches the blob
    const key = Object.keys(this.pictureStore).find(
      (k) => this.pictureStore[k] === blob
    );
    return key;
  }

  public hasNoBlobs(key: string): boolean {
    const images = this.getPicture(key);
    return images === key;
  }

  public getPicturesStore() {
    return this.pictureStore;
  }
}
