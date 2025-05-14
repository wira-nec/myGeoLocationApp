import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Toast } from '../../services/toaster.service';

@Component({
  selector: 'app-toaster',
  imports: [],
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.scss',
})
export class ToasterComponent {
  @Input() toast!: Toast;
  @Input() index!: number;

  @Output() remove = new EventEmitter<number>();
}
