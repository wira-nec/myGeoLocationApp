import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Toast } from '../../core/services/toaster.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toaster',
  imports: [CommonModule],
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.scss',
})
export class ToasterComponent {
  @Input() toast!: Toast;
  @Input() index!: number;

  @Output() remove = new EventEmitter<number>();
}
