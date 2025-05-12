import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PictureStore = Record<string, string | ArrayBuffer>;

@Injectable({
  providedIn: 'root',
})
export class LoadPictureService {
  private pictureStore: PictureStore = {};
  pictureStore$ = new BehaviorSubject<PictureStore>({});

  public loadPicture(file: File, filename: string) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        if (file.type.toLowerCase() === 'application/json') {
          const jsonData = JSON.parse(e.target?.result as string);
          Object.keys(jsonData).forEach((key) => {
            this.pictureStore[key] = jsonData[key];
            this.pictureStore$.next({ [key]: jsonData[key] });
          });
        } else {
          this.pictureStore[filename] = e.target?.result;
          this.pictureStore$.next({ [filename]: e.target?.result });
        }
      }
    };
    if (file.type.toLowerCase() === 'application/json') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }

  public storePicture(blob: string, filename: string) {
    this.pictureStore[filename] = blob;
    this.pictureStore$.next({ [filename]: blob });
  }

  public getPicture(key: string) {
    if (Object.keys(this.pictureStore).includes(key)) {
      return this.pictureStore[key] as string;
    }
    return key;
  }

  public getPicturesStore() {
    return this.pictureStore;
  }
}
