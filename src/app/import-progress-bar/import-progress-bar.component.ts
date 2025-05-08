import { Component, Input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgressService } from '../../services/progress.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import-progress-bar',
  standalone: true,
  imports: [MatProgressBarModule, CommonModule],
  templateUrl: './import-progress-bar.component.html',
  styleUrl: './import-progress-bar.component.scss',
  providers: [ProgressService],
})
export class ImportProgressBarComponent {
  @Input() progress = 0;
  @Input() bufferSize = 0;
}
