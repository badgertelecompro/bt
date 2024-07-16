import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Asegúrate de que este URL apunta al servidor Express en tu entorno
  private apiUrl = 'https://pesvi-bk.onrender.com/api'; // Cambia esto a la URL de tu servidor en producción

  constructor(private http: HttpClient) { }

  // Configurar los encabezados (si es necesario, puedes eliminar la API key si no es requerida por tu servidor)
  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // Obtener datos de una colección
  getCollectionData(collectionName: string, databaseName: string, filter: string): Observable<any> {
    const endpoint = `${this.apiUrl}/action/find`;
    let body = {};
    filter
    if(filter === "ADMIN@GMAIL.COM"){
      body = {
        collection: collectionName,
        database: databaseName
      };
    }else{
      body = {
        collection: collectionName,
        database: databaseName,
        filter: {
          email: filter
        }
      };
    }
    return this.http.post(endpoint, body, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.log(error);
        throw error;
      })
    );
  }

  insertData(collectionName: string, databaseName: string, data: any): Observable<any> {
    const endpoint = `${this.apiUrl}/action/insertOne`;
    const body = {
      collection: collectionName,
      database: databaseName,
      document: data
    };

    return this.http.post(endpoint, body, { headers: this.getHeaders() });
  }
}
