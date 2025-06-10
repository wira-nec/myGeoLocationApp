import { Injectable } from '@angular/core';
import { BehaviorSubject, take } from 'rxjs';
import { CompressImageService } from './compress-image.service';

export type PictureStore = Record<string, string | ArrayBuffer>;

@Injectable({
  providedIn: 'root',
})
export class LoadPictureService {
  private pictureStore: PictureStore = {};
  pictureStore$ = new BehaviorSubject<PictureStore>({});

  constructor(private compressImage: CompressImageService) {}

  public loadPicture(file: File, filename: string) {
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
          this.storePicture(e.target?.result as string, filename.toLowerCase());
        }
      }
    };
    if (file.type.toLowerCase() === 'application/json') {
      reader.readAsText(file);
    } else {
      this.compressImage
        .compress(file)
        .pipe(take(1))
        .subscribe((compressedImage) => {
          // now you can do upload the compressed image
          this.storePicture(compressedImage, filename.toLowerCase());
        });
    }
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

  public hasNoBlobs(key: string): boolean {
    const images = this.getPicture(key);
    return images === key;
  }

  public getPicturesStore() {
    return this.pictureStore;
  }
}
