import {
  Component,
  OnInit,
  ViewChild,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    FormsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
})
export class HeaderComponent implements OnInit {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private authService$: AuthService) {}

  userName = '';
  isLoggedIn = false;

  ngOnInit() {
    const authServiceSubscription = this.authService$.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.isLoggedIn = true;
          this.userName = user.name;
        } else {
          this.isLoggedIn = false;
        }
      });
    this.destroyRef.onDestroy(() => {
      authServiceSubscription.unsubscribe();
    });
  }

  usernameChangeWithEvent() {
    if (this.userName) {
      this.authService$.setUserName({ name: this.userName, id: uuidv4() });
      this.trigger?.closeMenu();
    }
  }

  logout(event: MouseEvent) {
    this.authService$.setUserName(null);
    event.stopPropagation();
    setTimeout(() => this.trigger?.closeMenu(), 60);
  }
}
