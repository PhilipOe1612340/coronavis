import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { tap } from 'rxjs/operators';
import { CachedRepository } from './cached.repository';
import { QuantitativeAggregatedHospitals } from './types/in/quantitative-aggregated-hospitals';
import { QuantitativeSingleHospitals } from './types/in/quantitative-single-hospitals';

@Injectable({
  providedIn: 'root'
})
export class DiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  private getDiviDevelopmentCounties(): Observable <QuantitativeAggregatedHospitals> {
    return this.cachedRepository.get <QuantitativeAggregatedHospitals> (`${environment.apiUrl}divi/development/landkreise`);
  }

  private getDiviDevelopmentGovernmentDistricts(): Observable < QuantitativeAggregatedHospitals > {
    return this.cachedRepository.get <QuantitativeAggregatedHospitals> (`${environment.apiUrl}divi/development/regierungsbezirke`);
  }

  private getDiviDevelopmentStates(): Observable <QuantitativeAggregatedHospitals> {
    return this.cachedRepository.get <QuantitativeAggregatedHospitals> (`${environment.apiUrl}divi/development/bundeslaender`);
  }

  public getDiviDevelopmentSingleHospitals(): Observable <QuantitativeSingleHospitals> {
    return this.cachedRepository.get <QuantitativeSingleHospitals> (`${environment.apiUrl}divi/development`)
    .pipe(
      tap(c => console.log('repo single', c))
    )
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel): Observable<QuantitativeAggregatedHospitals> {
    switch(aggregationLevel) {
        
      case AggregationLevel.county:
        return this.getDiviDevelopmentCounties();

      case AggregationLevel.governmentDistrict:
        return this.getDiviDevelopmentGovernmentDistricts();

      case AggregationLevel.state:
        return this.getDiviDevelopmentStates();

      default:
        throw 'No divi development endpoint for aggregation level: ' + aggregationLevel;  
    }
  }
}
