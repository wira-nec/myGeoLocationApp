import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ToasterService } from './toaster.service';

// in bytes, compress images larger than 32K
const fileSizeMax = 32 * 1024;
// in pixels, compress images have the width or height larger than 250px
const widthHeightMax = 500;
const defaultWidthHeightRatio = 0.5;
const defaultQualityRatio = 0.5;

@Injectable({
  providedIn: 'root',
})
export class CompressImageService {
  constructor(private readonly toaster: ToasterService) {}

  compress(file: File): Observable<string> {
    const imageType = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.readAsDataURL(file);

    return new Observable((observer) => {
      // This event is triggered each time the reading operation is successfully completed.
      reader.onload = (ev) => {
        // Create an html image element
        const img = this.createImage(ev);
        // Choose the side (width or height) that longer than the other
        const imgWH = img.width > img.height ? img.width : img.height;

        // Determines the ratios to compress the image
        const withHeightRatio =
          imgWH > widthHeightMax
            ? widthHeightMax / imgWH
            : defaultWidthHeightRatio;
        const qualityRatio =
          file.size > fileSizeMax
            ? fileSizeMax / file.size
            : defaultQualityRatio;

        // Fires immediately after the browser loads the object
        img.onload = () => {
          const elem = document.createElement('canvas');
          // resize width, height
          elem.width = img.width * withHeightRatio;
          elem.height = img.height * withHeightRatio;

          const ctx = elem.getContext('2d') as CanvasRenderingContext2D;
          ctx.drawImage(img, 0, 0, elem.width, elem.height);
          const jpegUrl = ctx.canvas.toDataURL(imageType, qualityRatio);
          if (jpegUrl) {
            observer.next(jpegUrl);
          }
          if (jpegUrl.length > fileSizeMax) {
            this.toaster.show(
              'warning',
              `Picture size too large (>32k), this picture can't be exported into the excel sheet`
            );
          }
        };
      };

      // Catch errors when reading file
      reader.onerror = (error) => observer.error(error);
    });
  }

  private createImage(ev: ProgressEvent<FileReader>) {
    const img = new Image();
    if (ev.target?.result) {
      const imageContent = ev.target.result as string;
      img.src = imageContent;
    }
    return img;
  }
}
