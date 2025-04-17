import { HttpClient } from '@angular/common/http';

export function helloServer(
  http: HttpClient,
  data: {
    userId: string;
  }
) {
  http.post('http://localhost:4000/hello', data).subscribe((res) => {
    console.log('ping response:', res);
  });
}

export function pingServer(
  http: HttpClient,
  location: {
    lat: number;
    lng: number;
    userId: string;
    username: string;
    info: string;
  }
) {
  http.post('http://localhost:4000/ping', location).subscribe((res) => {
    console.log('ping response:', res);
  });
}

export function removeServer(
  http: HttpClient,
  data: {
    userId: string;
  }
) {
  http.post('http://localhost:4000/remove', data).subscribe((res) => {
    console.log('ping response:', res);
  });
}
