import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';

@Component({
  selector: 'app-hospital-info-dialog',
  templateUrl: './hospital-info-dialog.component.html',
  styleUrls: ['./hospital-info-dialog.component.less']
})
export class HospitalInfoDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<HospitalInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SingleHospitalOut<QualitativeTimedStatus>) {}


  ngOnInit(): void {
  }

  close(): void {
    this.dialogRef.close();
  }

}
