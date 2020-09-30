import { Basechart, TMargin } from "@buckneri/spline";
export declare type TLineAxisLabel = {
    x?: string;
    y?: string;
};
export declare type TLineSeries = {
    color?: string;
    label: string;
    values: [number | string | Date, number][];
};
export declare type TLine = {
    labels?: {
        axis?: TLineAxisLabel;
    };
    series: TLineSeries[];
};
export declare type TLinechartOptions = {
    container: HTMLElement;
    data: TLine;
    formatX?: any;
    formatY?: Intl.NumberFormat;
    locale?: string;
    margin: TMargin;
    ticksX?: number;
    ticksY?: number;
};
export declare class Linechart extends Basechart {
    formatX: any;
    formatY: Intl.NumberFormat;
    origin: number;
    ticksX: number;
    ticksY: number;
    private _axisX;
    private _axisY;
    private _data;
    private _extentX;
    private _extentY;
    private _isDate;
    private _line;
    constructor(options: TLinechartOptions);
    /**
     * Saves data into chart
     * @param data
     */
    data(data: TLine): Linechart;
    /**
     * Draws the chart
     */
    draw(): Linechart;
    /**
     * Serialise chart data
     */
    toString(): string;
    private _drawAxes;
    private _drawCanvas;
    private _drawMarker;
    private _drawSeries;
    private _lineClickHandler;
    /**
     * Calculates the chart scale
     */
    private _scaling;
    /**
     * Determines the minimum and maximum extent values used by scale
     */
    private _scalingExtent;
}
