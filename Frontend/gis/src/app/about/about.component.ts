import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DiviHospital } from '../services/divi-hospitals.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.less']
})
export class AboutComponent implements OnInit {

  frontendVersion: string;

  apiVersion: string;

  tileServerVersion: string;

  constructor(
    public dialogRef: MatDialogRef<AboutComponent>,
    private http: HttpClient) {}

  ngOnInit(): void {
    this.frontendVersion = environment.version;

    this.http.get(
      `${environment.apiUrl}version`, { responseType: 'text'} )
    .pipe(
      catchError((e, d) => {
        console.warn('could not fetch api server version', e)
        return d;
      })
    )
    .subscribe(v => {
      this.apiVersion = v;
    });

    this.http.get(
      `${environment.tileServerUrl}version`, { responseType: 'text' }
    )
    .pipe(
      catchError((e, d) => {
        console.warn('could not fetch tile server version', e);
        return d;
      })
    )
    .subscribe(v => {
      this.tileServerVersion = v;
    })

  }



  close(): void {
    this.dialogRef.close();
  }

}
