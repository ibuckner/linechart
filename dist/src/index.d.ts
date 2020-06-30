import { TMargin } from "@buckneri/spline";
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
export declare class Linechart {
    container: HTMLElement;
    formatX: any;
    formatY: Intl.NumberFormat;
    h: number;
    locale: string;
    margin: TMargin;
    origin: number;
    rh: number;
    rw: number;
    ticksX: number;
    ticksY: number;
    w: number;
    private _axisX;
    private _axisY;
    private _canvas;
    private _color;
    private _data;
    private _extentX;
    private _extentY;
    private _id;
    private _isDate;
    private _line;
    private _scaleX;
    private _scaleY;
    private _selected;
    private _svg;
    constructor(options: TLinechartOptions);
    /**
     * Clears selection from chart
     */
    clearSelection(): Linechart;
    /**
     * Saves data into chart
     * @param data
     */
    data(data: TLine): Linechart;
    /**
     * Removes this chart from the DOM
     */
    destroy(): Linechart;
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
