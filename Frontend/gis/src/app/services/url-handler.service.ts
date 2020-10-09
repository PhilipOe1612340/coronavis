import { Injectable } from '@angular/core';
import { default as createCodec } from 'json-url';
import { APP_CONFIG_URL_KEY, MAP_LOCATION_SETTINGS_URL_KEY } from 'src/constants';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';

@Injectable({
  providedIn: 'root'
})
export class UrlHandlerService {

  private codec: {
    compress: (o: object) => Promise<string>;
    decompress: (s: string) => Promise<object>;
  };

  constructor(
  ) {
    this.codec = createCodec('lzstring');
  }

  public async getUrl(mo: MapOptions, mls: MapLocationSettings): Promise<string> {
    return `${window.location.href}`
    + `map;`
    + `${APP_CONFIG_URL_KEY}=${await this.convertMLOToUrl(mo)};`
    + `${MAP_LOCATION_SETTINGS_URL_KEY}=${await this.convertMLSToUrl(mls)}`;
  }


  public async convertMLOToUrl(mlo: MapOptions): Promise<string> {
    return await this.objToUrl(mlo);
  }

  public async convertUrlToMLO(urlParam: string): Promise<MapOptions> {
    return await this.urlToObj(urlParam) as MapOptions;
  }

  public async convertMLSToUrl(mls: MapLocationSettings): Promise<string> {
    return await this.objToUrl(mls);
  }

  public async convertUrlToMLS(urlParam: string): Promise<MapLocationSettings> {
    return await this.urlToObj(urlParam) as MapLocationSettings;
  }

  private async objToUrl(obj: object): Promise<string> {
    return await this.codec.compress(obj);
  }

  private async urlToObj(url: string): Promise<unknown> {
    return await this.codec.decompress(url);
  }
}
