import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, Geometry, MultiPolygon } from 'geojson';
import * as L from 'leaflet';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import { AbstractTimedStatus, QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from "../../services/tooltip.service";
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedType } from '../options/bed-type.enum';
import { Overlay } from './overlay';

export class BedStatusChoropleth<T extends AbstractTimedStatus> extends Overlay<AggregatedHospitalOut<T>> {

  constructor(
    name: string, 
    hospitals: FeatureCollection<MultiPolygon, AggregatedHospitalOut<T>>, 
    private aggregationLevel: AggregationLevel, 
    private type: BedType,
    private colorsService: QualitativeColormapService, 
    private tooltipService: TooltipService,
    private matDialog: MatDialog
    ) {
      super(name, hospitals);

  }

  

  getAggregationLevel(): AggregationLevel {
    return this.aggregationLevel;
  }

  getGlyphState(): BedType {
    return this.type;
  }


  createOverlay() {
    const onAction = (e: L.LeafletMouseEvent, feature: Feature<Geometry, AggregatedHospitalOut<QualitativeTimedStatus>>, aggregationLayer: any) => {
      const onCloseAction: () => void = () => {
        aggregationLayer.resetStyle(e.target);
      };

      const tooltipComponent = this.tooltipService
        .openAtElementRef(GlyphTooltipComponent, {
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY
        }, onCloseAction);

      tooltipComponent.tooltipData = feature.properties;

      // tooltipComponent.name = feature.properties.name;
      // tooltipComponent.combined = feature.properties.combined;
      // tooltipComponent.datum = feature.properties.until;
      // tooltipComponent.einwohner = +feature.properties.bevoelkerung;

      // set highlight style
      const l = e.target;
      l.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });

      l.bringToFront();
    };

    // create geojson layer (looks more complex than it is)
    const aggregationLayer = L.geoJSON(this.featureCollection, {
      style: (feature: Feature<Geometry, AggregatedHospitalOut<QualitativeTimedStatus>>) => {
        return {
          fillColor: this.colorsService.getLatestBedStatusColor(feature.properties.developments as any, this.type),
          weight: 0.5,
          opacity: 1,
          color: 'gray',
          // dashArray: '3',
          fillOpacity: 1,
          pointerEvents: 'none'
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          // on mouseover update tooltip and highlight county
          click: () => {
            this.tooltipService.close();
            this.matDialog.open(HospitalInfoDialogComponent, {
              data: feature.properties
            });
          },
          mouseover: (e: L.LeafletMouseEvent) => onAction(e, feature, aggregationLayer),
          // on mouseover hide tooltip and reset county to normal sytle
          mouseout: () => {
            this.tooltipService.close();
          }
        });
      }
    });

    return aggregationLayer;
  }
}
