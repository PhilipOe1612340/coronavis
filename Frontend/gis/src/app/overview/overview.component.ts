import { Component, OnInit, ViewChild } from '@angular/core';
import { UrlHandlerService } from '../services/url-handler.service';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.less']
})
export class OverviewComponent implements OnInit {

  @ViewChild('snav', {static: true})
  snav: MatSidenav;

  isMobile$: Observable<boolean>;


  constructor(
    public urlHandler: UrlHandlerService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile$ = this.breakpointObserver.observe('(max-width: 600px)')
    .pipe(
      map(d => d.matches)
    );
  }

  ngOnInit(): void {
  }

  navigateAndCloseSidenav(url: string) {
    this.snav.close();
  }

}