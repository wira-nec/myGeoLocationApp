import { HttpClient } from '@angular/common/http';

const localhostEndPoint = 'http://localhost:4000';
const simpleExpressPusherServerEndPoint =
  'https://leafy-praline-b56f06.netlify.app/.netlify/functions/api';

export function helloServer(
  http: HttpClient,
  data: {
    userId: string;
  }
) {
  http.post(`${localhostEndPoint}/hello`, data).subscribe((res) => {
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
  http.post(`${localhostEndPoint}/ping`, location).subscribe((res) => {
    console.log('ping response:', res);
  });
}

export function removeServer(
  http: HttpClient,
  data: {
    userId: string;
  }
) {
  http.post(`${localhostEndPoint}/remove`, data).subscribe((res) => {
    console.log('ping response:', res);
  });
}
