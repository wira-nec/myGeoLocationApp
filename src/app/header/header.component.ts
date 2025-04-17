import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header',
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

  constructor(private authService$: AuthService) {}

  userName = '';
  isLoggedIn = false;

  ngOnInit() {
    this.authService$.user$.subscribe((user) => {
      if (user) {
        this.isLoggedIn = true;
        this.userName = user.name;
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  usernameChangeWithEvent() {
    if (this.userName) {
      this.authService$.setUserName({ name: this.userName, id: uuidv4() });
      this.trigger?.closeMenu();
    }
  }

  logout() {
    this.authService$.setUserName(null);
  }
}
