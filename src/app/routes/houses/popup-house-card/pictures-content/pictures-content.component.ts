import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {
  StoreData,
  getBlobs,
  getImageNames,
} from '../../../../core/services/data-store.service';
import { LoadPictureService } from '../../../../core/services/load-picture.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pictures-content',
  imports: [CommonModule],
  templateUrl: './pictures-content.component.html',
  styleUrl: './pictures-content.component.scss',
})
export class PicturesContentComponent implements OnInit {
  @Input() details!: StoreData;

  constructor(
    private pictureService: LoadPictureService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.pictureService.pictureStore$.subscribe(() => {
      // force a rerender of this component, since there are new pictures uploaded
      this.details = { ...this.details };
      this.changeDetectorRef.markForCheck();
    });
  }

  pictures(details: StoreData) {
    if (details) {
      const blobs = getBlobs(details);
      getImageNames(details).forEach((imageName) => {
        const blob = this.pictureService.getPicture(
          // eslint-disable-next-line no-useless-escape
          imageName.replace(/^.*[\\\/]/, '')
        );
        if (blob && !blobs.includes(blob)) {
          blobs.push(blob);
        }
      });
      return blobs;
    }
    return [];
  }
}
