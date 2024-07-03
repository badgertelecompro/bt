import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalDataService {
  private name: string = '';
  private email: string = '';

  constructor() {
    // Inicializa con valores de localStorage si existen
    this.name = localStorage.getItem('name') || '';
    this.email = localStorage.getItem('email') || '';
  }

  setName(name: string) {
    this.name = name;
    localStorage.setItem('name', name); // Guarda el nombre en localStorage
  }

  getName(): string {
    return this.name || localStorage.getItem('name') || ''; // Obtiene el nombre de localStorage si no está en memoria
  }

  setEmail(email: string) {
    this.email = email;
    localStorage.setItem('email', email); // Guarda el email en localStorage
  }

  getEmail(): string {
    return this.email || localStorage.getItem('email') || ''; // Obtiene el email de localStorage si no está en memoria
  }
}
