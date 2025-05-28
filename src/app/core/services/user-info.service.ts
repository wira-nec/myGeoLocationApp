import { Injectable } from '@angular/core';
import { UserInfo } from '../modals/user';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserInfoService {
  private userInfo: UserInfo[];
  userInfo$ = new BehaviorSubject<UserInfo[]>([]);

  constructor() {
    this.userInfo = [];
  }

  public storeUserInfo(info: UserInfo[]) {
    this.userInfo = info;
    this.userInfo$.next(info);
  }

  public getUserInfo(key: string): UserInfo | undefined {
    return this.userInfo.find((info) => info[key]);
  }
}
