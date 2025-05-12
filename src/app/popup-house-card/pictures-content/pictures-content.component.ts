import { Component, Input } from '@angular/core';
import { StoreData } from '../../../services/data-store.service';
import { getBlobs, getImageNames } from '../../helpers/dataManipulations';
import { LoadPictureService } from '../../../services/load-picture.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pictures-content',
  imports: [CommonModule],
  templateUrl: './pictures-content.component.html',
  styleUrl: './pictures-content.component.scss',
})
export class PicturesContentComponent {
  @Input() details!: StoreData;

  constructor(private pictureService: LoadPictureService) {}

  pictures(details: StoreData) {
    if (details) {
      const blobs = getBlobs(details);
      getImageNames(details).map((imageName) =>
        blobs.push(
          // eslint-disable-next-line no-useless-escape
          this.pictureService.getPicture(imageName.replace(/^.*[\\\/]/, ''))
        )
      );
      return blobs;
    }
    return [];
  }
}
