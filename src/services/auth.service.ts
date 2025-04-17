import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../app/modals/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userStore$ = new BehaviorSubject<User | null>(null);
  user$ = this.userStore$.asObservable();

  isLogged() {
    return !!this.userStore$.getValue()?.id;
  }

  setUserName(user: User | null) {
    this.userStore$.next(user);
  }
}
