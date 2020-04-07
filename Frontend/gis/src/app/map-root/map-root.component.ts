import { Component, OnInit } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute } from '@angular/router';
import { FeatureCollection } from 'geojson';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { APP_CONFIG_KEY, APP_CONFIG_URL_KEY, APP_HELP_SEEN, MAP_LOCATION_SETTINGS_KEY, MAP_LOCATION_SETTINGS_URL_KEY } from "../../constants";
import { HelpDialogComponent } from "../help-dialog/help-dialog.component";
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { Overlay } from '../map/overlays/overlay';
import { ConfigService } from '../services/config.service';
import { I18nService } from '../services/i18n.service';
import { TranslationService } from '../services/translation.service';
import { UrlHandlerService } from '../services/url-handler.service';
import { safeDebounce } from '../util/safe-debounce';

@Component({
  selector: 'app-map-root',
  templateUrl: './map-root.component.html',
  styleUrls: ['./map-root.component.less']
})
export class MapRootComponent implements OnInit {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  

  


  mapOptions: MapOptions = null;

  mapLocationSettings$: BehaviorSubject<MapLocationSettings> = new BehaviorSubject(null);

  currentCaseChoropleth: CaseChoropleth;

  initialMapLocationSettings: MapLocationSettings = null;

  currentMapLocationSettings: MapLocationSettings = null;

  siteId: number;


  // constructor is here only used to inject services
  constructor(
    private configService: ConfigService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private i18nService: I18nService,
    private translationService: TranslationService,
    private urlHandlerService: UrlHandlerService,
    private route: ActivatedRoute
              ) {
  }

  ngOnInit(): void {
    //TESTING

    // this.router.navigate(['/map', {mlo: this.urlHandlerService.convertMLOToUrl(this.defaultMapOptions)}]);

    this.i18nService.initI18n();


    this.restoreSettingsFromLocalStorageOrUseDefault();

    this.route.paramMap.pipe(switchMap(d => {
      this.restoreSettingsFromLocalStorageOrUseDefault(d);

      return of(d);
    }))
    .subscribe();


    this.displayHelpForNewUser();


    this.initTrackingPixel();


    // listen for map changes and debounce
    // writing into local storage by 500ms
    // to save cpu/io
    this.mapLocationSettings$.asObservable()
    .pipe(
      safeDebounce(500, (a: MapLocationSettings) => of(a))
    )
    .subscribe(newLocSettings => {
      this.currentMapLocationSettings = newLocSettings as MapLocationSettings;

      // store data into local storage
      localStorage.setItem(MAP_LOCATION_SETTINGS_KEY, JSON.stringify(newLocSettings));
    });
  }

  mapLocationSettingsUpdated(newSettings: MapLocationSettings) {
    this.mapLocationSettings$.next(newSettings);
  }

  mapOptionsUpdated(newOptions: MapOptions) {
    this.mapOptions = newOptions;

    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(newOptions));
  }

  initTrackingPixel() {
    const trackingPixelSiteIDMapping = {
      'production': 1,
      'staging': 3,
      'review': 4,
      'development': 5
    };

    this.siteId = trackingPixelSiteIDMapping[environment.env];
  }

  displayHelpForNewUser() {
    const helpSeen = JSON.parse(localStorage.getItem(APP_HELP_SEEN)) || false;
    if (this.mapOptions.showHelpOnStart && !helpSeen) {
      this.dialog.open(HelpDialogComponent)
        .afterClosed().subscribe(d => {
        localStorage.setItem(APP_HELP_SEEN, JSON.stringify(true));
      });
    }
  }

  restoreSettingsFromLocalStorageOrUseDefault(paramMap = null) {
    if(!paramMap) {
      // try from url params
      paramMap = this.route.snapshot.paramMap;
    }
    

    const storedMapOptions = JSON.parse(localStorage.getItem(APP_CONFIG_KEY)) as MapOptions;

    // will show the snack bar if true
    let restored = false;

    if(paramMap.has(APP_CONFIG_URL_KEY)) {
      const urlMlo = this.urlHandlerService.convertUrlToMLO(paramMap.get(APP_CONFIG_URL_KEY));

      const mergedMlo = this.configService.overrideMapOptions(urlMlo);

      console.log('load from url', mergedMlo);

      this.mapOptions = mergedMlo;
    } else if (storedMapOptions) {
      // merge with default as basis is necessary when new options are added in further releases
      this.mapOptions = this.configService.overrideMapOptions(storedMapOptions, { hideInfobox: false, showHelpOnStart: true });
      restored = true;
    } else {
      this.mapOptions = this.configService.getDefaultMapOptions();
    }


    const storedMapLocationSettings = JSON.parse(localStorage.getItem(MAP_LOCATION_SETTINGS_KEY)) as MapLocationSettings;

    if(paramMap.has(MAP_LOCATION_SETTINGS_URL_KEY)) {
      const urlMls = this.urlHandlerService.convertUrlToMLS(paramMap.get(MAP_LOCATION_SETTINGS_URL_KEY));

      const mergedMls = this.configService.overrideMapLocationSettings(urlMls);

      this.initialMapLocationSettings = {...mergedMls};
    } else if(storedMapLocationSettings) {
      // this.mapLocationSettings$.next(storedMapLocationSettings);
      this.initialMapLocationSettings = this.configService.overrideMapLocationSettings(storedMapLocationSettings, {
        allowPanning: true,
        allowZooming: true
      });
      restored = true;
    } else { // use default
      this.initialMapLocationSettings = this.configService.getDefaultMapLocationSettings();
    }

    if(restored) {
      let snackbar = this.snackbar.open(
        this.translationService.translate("Die Anwendungskonfiguration aus Ihrem letzten Besuch wurde wiederhergestellt"),
        this.translationService.translate("Zurücksetzen"), {
        politeness: "polite",
        duration: 20000
      });
      snackbar.onAction().subscribe(() => {
        this.mapOptions = this.configService.getDefaultMapOptions();
        this.mapLocationSettings$.next(this.configService.getDefaultMapLocationSettings());

        localStorage.removeItem(APP_CONFIG_KEY);
        localStorage.removeItem(MAP_LOCATION_SETTINGS_KEY);
      });
    }
  }
}
