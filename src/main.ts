import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Habilitar el modo de producción
enableProdMode();

// Registrar el Service Worker si está disponible en el navegador
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ngsw-worker.js')
    .then(() => console.log('Service Worker registrado correctamente'))
    .catch(err => console.error('Error al registrar el Service Worker', err));
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
