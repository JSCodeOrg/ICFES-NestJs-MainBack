export type KV      = { key: string; value: number };
export type KVs     = { key: string; values: number[] };
export type KVLabel = { label: string; value: number };
export type Serie   = { label: string; color: string; data: KV[] };

export type SinglePayload = {
  type: 'single';
  chartKind: 'line' | 'bar' | 'horizontalBar';
  label: string;
  data: KV[];
  color?: string;
};

export type MultiPayload = {
  type: 'multi';
  chartKind: 'line' | 'bar';
  label: string;
  series: Serie[];
};

export type GroupedPayload = {
  type: 'grouped';
  label: string;
  data: KVs[];
  seriesLabels: string[];
  colors: string[];
};

export type ComparisonPayload = {
  type: 'comparison';
  label: string;
  data: KVLabel[];
  colors?: string[];
};

export type MixedPayload = {
  type: 'mixed';
  label: string;
  data: {
    key: string;
    count: number;
    promedio: number;
  }[];
  barColor?: string;
  lineColor?: string;
};

export type HistogramPayload = {
  type: 'histogram';
  label: string;
  data: KV[];
  color?: string;
};


export type StackedPayload = {
  type: 'stacked';
  label: string;
  data: KVs[];
  seriesLabels: string[];
  colors: string[];
};

export type HeatmapPayload = {
  type: 'heatmap';
  label: string;
  data: {
    ano: number;
    rango: string;
    count: number;
  }[];
};

export type ExportChartDto =
  | SinglePayload
  | MultiPayload
  | GroupedPayload
  | ComparisonPayload
  | MixedPayload
  | HistogramPayload
  | StackedPayload
  | HeatmapPayload;

export type ExportPdfDto = {
  filename?: string;
  sections: { label: string; chart: ExportChartDto }[];
};