import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TheHangOutComponent } from './theHangOut.component';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { PusherService } from '../../../core/services/pusher.service';

describe('TheHangOutComponent', () => {
  let component: TheHangOutComponent;
  let fixture: ComponentFixture<TheHangOutComponent>;
  let httpMock: HttpTestingController;
  const fakeActivatedRoute = {
    snapshot: {
      data: {},
      paramMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        get: function (_key) {
          return 'abc';
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        has: function (_key) {
          return true;
        },
      },
    },
  } as ActivatedRoute;

  beforeEach(async () => {
    const mockedPushService = {
      init: jest.mock,
    };

    await TestBed.configureTestingModule({
      imports: [TheHangOutComponent],
      providers: [
        { provide: PusherService, useValue: mockedPushService },
        provideHttpClient(), // Provide the HttpClient along with HttpClientTesting
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
      ],
    }).compileComponents();

    TestBed.inject(PusherService);
    fixture = TestBed.createComponent(TheHangOutComponent);
    component = fixture.componentInstance;
    httpMock = fixture.debugElement.injector.get<HttpTestingController>(
      HttpTestingController as Type<HttpTestingController>
    );

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
