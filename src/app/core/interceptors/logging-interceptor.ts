import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<unknown>,
    handler: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    console.log('Request URL: ' + req.url);
    return handler.handle(req);
  }
}
