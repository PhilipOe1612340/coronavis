import { Component, OnInit, Input } from '@angular/core';
import { ColormapService } from '../services/colormap.service';
import { TimestampedValue } from '../repositories/divi-development.respository';
import { DiviHospital, BedStatusSummary } from '../services/glyph-layer.service';
import { getLatest } from '../util/timestamped-value';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  contact: string;
  url: boolean;

  contactMsg: string;

  @Input()
  mode: 'dialog' | 'tooltip';
  @Input()
  data: DiviHospital;

  templateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": 180,
    "height": 100,
    "data": {
      "values": [
      ]
    },
    "layer": [
      {
        "mark": "line",
        "encoding": {
          "x": {
            "field": "Datum",
            "type": "nominal",
            "axis":{
              "title": "Datum",
              "scale": {
                "domain": {"field": "Datum"}
              }
            }
          },
          "y": {
            "field": "Bettenauslastung (%)",
            "type": "quantitative",
            "axis":
            {
              "tickMinStep": 10,
              "tickCount": 10,
              "title": "Bettenauslastung (%)"
            },
            "scale": {
              "domain": [0, 120]
            }
          },
          "strokeDash": {
            "field": "Vorhersage",
            "type": "nominal",
            "legend": {
              "orient": "left"
            }
          },
          "color": {
            "field": "Kategorie",
            "type": "nominal",
            "legend": {
              "orient": "left"
            }            
          },
          "opacity": {"value": 0.8}
        },
      },
      {
        "data": {"values": [{"predicitonStartDate": "2018-02-02"}]},
        "mark": "rule",
        "encoding": {
          "x": {
            "field": "predicitonStartDate",
            "type": "nominal",
            "axis":false
          },
          "strokeWidth": {"value": 0.1},
          "opacity": {"value": 0.4},
          "color": {"value": "grey"},
          "strokeDash": {"signal": [18,4]}
        }
      },
      {
        "data": {"values": [{"ref": 100}]},
        "mark": "rule",
        "encoding": {
          "y": { "field":"ref"},
          "strokeWidth": {"value": 0.1},
          "opacity": {"value": 0.4},
          "axis":false,
          "color": {"value": "grey"},
          "strokeDash": {"signal": [18,4]}
        }
      }
    ]
  };

  specs = [];
  bedAccessors = ['icu_low_care', 'icu_high_care', 'icu_ecmo_care'];
  bedAccessorsMapping = {'icu_low_care': 'ICU - Low Care', 'icu_high_care': 'ICU - High Care', 'icu_ecmo_care': 'ECMO'};

  constructor(private colormapService: ColormapService) { }

  ngOnInit(): void {
    if(this.data.Webaddress.indexOf('http') > -1) {
      this.contact = 'http' + this.data.Webaddress.split('http')[1];
      this.url = true;

      this.contactMsg = this.data.Webaddress.replace(this.contact, '').replace('Website', '').trim();

      if(this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    } else {
      this.contact = this.data.Webaddress;
      this.url = false;

      this.contactMsg = this.data.Webaddress;
    }

    this.specs = [];
    const dataValues = [];
    let predictionDay;

    for (const bedAccessor of this.bedAccessors) {
      const entryLength = this.data[bedAccessor + '_frei'].length;

      const freeBeds = this.data[bedAccessor + '_frei'];
      const occupiedBeds = this.data[bedAccessor + '_belegt'];

      const totalBeds = freeBeds[entryLength - 1].value + occupiedBeds[entryLength - 1].value;

      let i = 0;
      for (const free of freeBeds) {
        const occupied = occupiedBeds[i];
        const rate = (occupied.value / (free.value + occupied.value) * 100)  || 0;
        dataValues.push({ Kategorie: this.bedAccessorsMapping[bedAccessor], Datum: new Date(free.timestamp).toLocaleString(),
          'Bettenauslastung (%)': rate, Vorhersage: false, value: occupied.value, total: free.value + occupied.value});
        i++;
      }

      
      

      

      const prediction = this.data[bedAccessor + '_einschaetzung'][entryLength - 1];
      const predictedRate = ((occupiedBeds[entryLength - 1].value + prediction.value) / totalBeds * 100) || 0;
      predictionDay = prediction.timestamp;
      const nextDay = new Date();
      nextDay.setDate(new Date(predictionDay).getDate() + 1);



      const lastRealDataDay_freeBeds = getLatest(this.data[bedAccessor + '_frei']);
      const lastRealDataDay_occupiedBeds = getLatest(this.data[bedAccessor + '_belegt']);
      const lastRealDataDay_totalBeds = lastRealDataDay_freeBeds + lastRealDataDay_occupiedBeds;
      const lastRealDataDay_rate = (lastRealDataDay_occupiedBeds / lastRealDataDay_totalBeds * 100)  || 0;
      dataValues.push({Kategorie: this.bedAccessorsMapping[bedAccessor], Datum: new Date(predictionDay).toLocaleString(),
        'Bettenauslastung (%)': lastRealDataDay_rate, Vorhersage: true});


      dataValues.push({Kategorie: this.bedAccessorsMapping[bedAccessor], Datum: nextDay.toLocaleString(),

        'Bettenauslastung (%)': predictedRate, Vorhersage: true});
    }

      // hack deep clone spec
    const spec = JSON.parse(JSON.stringify(this.templateSpec));

    // inject data values
    spec.data.values = dataValues;
    spec.layer[1].data.values[0].predicitonStartDate =  new Date(predictionDay).toLocaleString();

    this.specs.push(spec);

    console.log(this.specs)
  }

  getCapacityStateColor(bedstatus: BedStatusSummary): string {
    return this.colormapService.getBedStatusColor(bedstatus)
  }

  getLatest(entries: TimestampedValue[]): number {
    return getLatest(entries);
  }

  getTrendIcon(entries: TimestampedValue[]): string {
    const latest = getLatest(entries);
    return latest >= 0 ? (latest == 0 ? 'trending_flat' : 'trending_up') : 'trending_down';
  }

}
