import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Feature, MultiPolygon } from 'geojson';
import moment, { Moment } from 'moment';
import { NouiFormatter } from 'ng2-nouislider';
import { BehaviorSubject, interval, NEVER, Observable } from 'rxjs';
import { filter, flatMap, map, reduce, repeatWhen, switchMap, takeUntil } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { MapOptions } from '../map/options/map-options';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { ConfigService } from '../services/config.service';

export class TimeFormatter implements NouiFormatter {
  constructor(public startDay: Moment) {}

  to(value: number): string {
    return this.startDay.clone().add(value, 'days').format('YYYY-MM-DD');
  };

  from(value: string): number {
    return moment(value).diff(this.startDay, 'days');
  }
}

@Component({
  selector: 'app-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.less']
})
export class TimesliderComponent implements OnInit {

  timeFormatter: TimeFormatter;

  nouiConfig;

  numTicks = 10;

  currentTime: number = 0;

  timeExtent: [number, number] = [0, 10];


  private _mo: MapOptions;

  @Input()
  set mapOptions(mo: MapOptions) {
    this._mo = mo;
  }

  get mapOptions(): MapOptions {
    return this._mo;
  }

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  modePlaying$ = new BehaviorSubject<boolean>(false);

  stepSize = 1;

  constructor(
    private diviRepo: QualitativeDiviDevelopmentRepository,
    private configService: ConfigService,
  ) { }

  ngOnInit(): void {
    this.diviRepo.getDiviDevelopmentCountries(new Date(), -1)
    .pipe(
      flatMap(d => d.features),
      map<Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>, [Moment, Moment]>(d => [moment(d.properties.developments[0].timestamp), moment(d.properties.developments[d.properties.developments.length - 1].timestamp)]),
      reduce((acc, val) => {
        if(!acc[0] || acc[0] > val[0]) {
          acc[0] = val[0];
        }

        if(!acc[1] || acc[1] < val[1]) {
          acc[1] = val[1];
        }

        return acc;
      }),
      ).subscribe(extent => {
        const firstDay = extent[0].startOf('day');
        const lastDay = extent[1].startOf('day');

        this.timeExtent = [0, lastDay.diff(firstDay, 'days')];

        this.timeFormatter = new TimeFormatter(firstDay);

        this.nouiConfig = {
          tooltips: this.timeFormatter,
          range: {
            'min': this.timeExtent[0],
            'max': this.timeExtent[1]
          },
          step: 1
        }

        if(this._mo) {
          this.currentTime = this.timeFormatter.from(this._mo.bedGlyphOptions.date === 'now' ? moment().format('YYYY-MM-DD') : this._mo.bedGlyphOptions.date);
        }

        this.numTicks = this.timeExtent[1] - this.timeExtent[0];
      });



      const source$ = interval(1000);


      const ons$ = this.modePlaying$.pipe(filter(v=>!v));
      const offs$ = this.modePlaying$.pipe(filter(v=>v));

      source$.pipe(
          takeUntil(ons$),
          repeatWhen(()=>offs$)
        )
      .subscribe(d => {
        this.onTimer();
      });
  }

  nouiSliderChanging(value: number) {
    this.sliderChanging(value);
  }

  nouiSliderChanged(value: number) {
    this.sliderChanged(value);
  }

  matSliderChanging(evt: MatSliderChange) {
    this.sliderChanging(evt.value);
  }

  matSliderChanged(evt: MatSliderChange) {
    this.sliderChanged(evt.value);
  }


  private sliderChanging(value: number) {
    const mDate = this.sliderValueToMoment(value);
    // this.emit(mDate.format('YYYY-MM-DD'), true);
  }

  private sliderChanged(value: number) {
    this.emit(value, false);
  }

  // function is called for every interval
  onTimer() {
    let nextTime = this.currentTime + 1;

    if(nextTime > this.timeExtent[1]) {
      nextTime = this.timeExtent[0];
    }

    this.currentTime = nextTime;

    this.emit(nextTime, false);
  }

  pausableInterval(ms: number, pauser: Observable<boolean>) {
    let x = 0;
    const source = interval(ms);
  
    return pauser.pipe(switchMap(paused => paused ? NEVER : source.pipe(map(() => x++))));
  }

  emit(numDays: number, changing: boolean) {
    if(changing && (this._mo.bedGlyphOptions.enabled || this._mo.bedBackgroundOptions.enabled)
      && (this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none || this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.county)) {
      // do not update with single glyphs as it causes too much lag
      return;
    }

    let date = this.sliderValueToMoment(numDays).format('YYYY-MM-DD');
    if(date === moment().format('YYYY-MM-DD')) {
      date = 'now';
    }

    this.mapOptionsChange.emit(this.configService.overrideMapOptions(this._mo, {
      bedGlyphOptions: {
        date: date
      },
      bedBackgroundOptions: {
        date: date
      }
    }));
  }

  sliderValueToMoment(val: number): Moment {
    return this.timeFormatter.startDay.clone().add(val, 'days');
  }

  momentToSliderValue(mom: Moment): number {
    return mom.diff(this.timeFormatter.startDay, 'days');
  }

}
