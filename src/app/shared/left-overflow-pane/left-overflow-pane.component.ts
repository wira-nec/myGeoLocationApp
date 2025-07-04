import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-left-overflow-pane',
  imports: [CommonModule],
  templateUrl: './left-overflow-pane.component.html',
  styleUrl: './left-overflow-pane.component.scss',
})
export class LeftOverflowPaneComponent {
  @Input() show = false;
}
