import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CamComponent } from './cam/cam.component';
import { FormComponent } from './form/form.component';
import { AppComponent } from './app.component';

const routes: Routes = [
  { path: 'list', component: FormComponent },
  { path: 'register', component: CamComponent },
  { path: '', redirectTo: 'list' },
  { path: '**', redirectTo: 'list' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
