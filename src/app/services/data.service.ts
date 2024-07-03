import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = '/api';
  private apiKey = 'eVTThRcbO8zEnNof21NKcDYyui6qPQ15E8exNWxbPiKHBjA58P1yDCyVIwzKxrER'; // Reemplaza con tu clave API

  constructor(private http: HttpClient) { }

  // Configurar los encabezados para la autenticación
  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': this.apiKey,
    });
  }

  // Ejemplo: Obtener datos de una colección
  getCollectionData(collectionName: string, databaseName: string, dataSource: string,filter:string): Observable<any> {
    const endpoint = `${this.apiUrl}/action/find`;
    const body = {
      collection: collectionName,
      database: databaseName,
      dataSource: dataSource,
      filter: {
        email: filter
      }
    };
    return this.http.post(endpoint, body, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log(error)
        throw error
      })
    );
  }

  // Ejemplo: Insertar datos en una colección
  insertData(collectionName: string, databaseName: string, dataSource: string, data: any): Observable<any> {
    const endpoint = `${this.apiUrl}/action/insertOne`;
    const body = {
      "collection": collectionName,
      "database": databaseName,
      "dataSource": dataSource,
      "document": data
    };

    return this.http.post(endpoint, body, { headers: this.getHeaders() });
  }

  // Puedes añadir más métodos para diferentes acciones en la API
}
