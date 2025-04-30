import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PictureStore = Record<string, string | ArrayBuffer>;

@Injectable({
  providedIn: 'root',
})
export class LoadPictureService {
  private pictureStore: PictureStore = {};
  pictureStore$ = new BehaviorSubject<PictureStore>({});

  public storePicture(file: File, key: string) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.pictureStore[key] = e.target?.result;
        this.pictureStore$.next({ [key]: e.target?.result });
      }
    };
    reader.readAsDataURL(file);
  }

  public getPicture(key: string) {
    if (Object.keys(this.pictureStore).includes(key)) {
      return this.pictureStore[key];
    }
    return key;
  }
}
