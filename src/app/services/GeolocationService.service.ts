import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  // private nominatimBaseUrl = 'https://nominatim.openstreetmap.org/reverse';
  private map2Url = 'https://api.opencagedata.com/geocode/v1/json';
  private key = '6f991e055be3412e987a5eabbd882291';

  private cache: Map<string, any> = new Map();

  constructor(private http: HttpClient) {}

  // async getLocation(latitude: number, longitude: number): Promise<any> {
  //   const cacheKey = `${latitude},${longitude}`;
  //   if (this.cache.has(cacheKey)) {
  //     return this.cache.get(cacheKey);
  //   }
  //   const url = `${this.nominatimBaseUrl}?lat=${latitude}&lon=${longitude}&format=json`;
  //   try {
  //     const response$ = this.http.get(url);
  //     const response = await firstValueFrom(response$);
  //     this.cache.set(cacheKey, response);
  //     return response;
  //   } catch (error) {
  //     console.error('Error fetching location:', error);
  //     throw error;
  //   }
  // }

  async getLocation2(latitude: number, longitude: number): Promise<any> {
    const cacheKey = `${latitude},${longitude}`;
    // if (this.cache.has(cacheKey)) {
    //   return this.cache.get(cacheKey);
    // }
    const url = `${this.map2Url}?q=${latitude},${longitude}&key=${this.key}`;
    try {
      const response$ = this.http.get(url);
      const response = await firstValueFrom(response$);
      // this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  }


}
