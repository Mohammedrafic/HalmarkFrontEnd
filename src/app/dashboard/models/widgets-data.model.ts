import { WidgetTypeEnum } from '../enums/widget-type.enum';
import type { CandidatesByStateWidgetAggregatedDataModel } from './candidates-by-state-widget-aggregated-data.model';
import type { ChartAccumulation } from './chart-accumulation-widget.model';

export interface WidgetsDataModel {
  [WidgetTypeEnum.APPLICANTS_BY_REGION]: CandidatesByStateWidgetAggregatedDataModel;
  [WidgetTypeEnum.CANDIDATES]: ChartAccumulation;
}
