import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ImpressumComponent } from './impressum/impressum.component';
import { MapRootComponent } from './map-root/map-root.component';

const routes: Routes = [
  { // for share url
    path: 'map',
    component: MapRootComponent
  },
  {
    path: 'imprint',
    component: ImpressumComponent
  },
  {
    path: 'lockdown',
    component: MapRootComponent
  },
  {
    path: '',
    component: MapRootComponent,
  },
  { // default to MapRootComponent, don't throw 404
    path: '**',
    component: MapRootComponent
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, {enableTracing: environment.env === 'review' || environment.env === 'development'})
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
