import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection } from 'geojson';
import { environment } from 'src/environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}

  /**
   * Retrieves the Regierungsbezirke from the given api endpoint.
   */
  getRegierungsBezirke(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}api/data/regierungsbezirke`;
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getLandkreise(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}api/data/landkreise`;
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getOSMHospitals(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}osm/hospitals`;
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getOSHelipads(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}osm/nearby_helipads`;
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getHospitalsLandkreise(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}hospitals/landkreise`;
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getHospitalsRegierungsbezirke(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}hospitals/regierungsbezirke`;
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getHospitalsBundeslaender(): Observable<FeatureCollection> {
    const url = `${environment.apiUrl}hospitals/bundeslander`;
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }

  /**
   * Retrieves the data and constructs a FeatureCollection object from the received data
   */
  private getFeatureCollection(url): Observable<FeatureCollection> {
    return this.http.post<any>(url, null, httpOptions).pipe(
      map(unparsed => {
        const f: FeatureCollection = {
          type: 'FeatureCollection',
          features: unparsed.map((u: any) => {
            return {
              type: 'Feature',
              geometry: u.geojson,
              properties: { osm_id: u.osm_id, name: u.name, area: u.area }
            };
          })
        };

        return f;
      })
    );
  }
}
