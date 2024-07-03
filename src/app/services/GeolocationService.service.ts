import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org/reverse';

  constructor(private http: HttpClient) {}

  async getLocation(latitude: number, longitude: number): Promise<any> {
    const url = `${this.nominatimBaseUrl}?lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const response$ = this.http.get(url);
      const response = await firstValueFrom(response$);
      return response;
    } catch (error) {
      // Handle errors gracefully
      console.error('Error fetching location:', error);
      throw error; // Rethrow or handle as needed
    }
  }
}
