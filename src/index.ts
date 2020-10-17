import { bisectLeft, extent, least } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { pointer, select, selectAll } from "d3-selection";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import { Basechart, TMargin } from "@buckneri/spline";

export type TLineAxisLabel = {
  x?: string,
  y?: string
};

export type TLineSeries = {
  color?: string,
  label: string,
  values: [number | string | Date, number][]
};

export type TLine = {
  labels?: { axis?: TLineAxisLabel },
  series: TLineSeries[]
};

export type TLinechartOptions = {
  container: HTMLElement,
  data: TLine,
  formatX?: any,
  formatY?: Intl.NumberFormat,
  locale?: string,
  margin: TMargin,
  ticksX?: number,
  ticksY?: number
};

export class Linechart extends Basechart {
  public formatX: any;
  public formatY: Intl.NumberFormat;
  public origin: number = 0;
  public ticksX: number = 10;
  public ticksY: number = 10;

  private _axisX: any;
  private _axisY: any;
  private _data: TLine = { series: []};
  private _extentX: [number, number] = [0, 0];
  private _extentY: [number, number] = [0, 0];
  private _isDate = (d: any) => !isNaN(Date.parse(d));
  private _line: any;

  constructor(options: TLinechartOptions) {
    super(options);

    if (options.formatX !== undefined) {
      this.formatX = options.formatX;
    } else {
      this.formatX = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2, style: "decimal" });
    }

    if (options.formatY !== undefined) {
      this.formatY = options.formatY;
    } else {
      this.formatY = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2, style: "decimal" });
    }

    if (options.ticksX !== undefined) {
      this.ticksX = options.ticksX;
    }

    if (options.ticksY !== undefined) {
      this.ticksY = options.ticksY;
    }

    const box: DOMRect = this.container.getBoundingClientRect();
    this.h = box.height;
    this.w = box.width;
    this.rh = this.h - this.margin.top - this.margin.bottom;
    this.rw = this.w - this.margin.left - this.margin.right;
    
    this.data(options.data);
  }

  /**
   * Saves data into chart
   * @param data
   */
  public data(data: TLine): Linechart {
    this._data = data;

    this._data.series.forEach((item: TLineSeries) => {
      if (item.color === undefined) {
        item.color = this.scale.color(item.label);
      }
      item.values.forEach((item: [string | number | Date, number]) => {
        if (this._isDate(item[0])) {
          item[0] = new Date(item[0]);
        }
      });
    });

    this._line = line()
      .x((d: any) => this.scale.x(d[0]))
      .y((d: any) => this.scale.y(d[1]));
  
    this._scalingExtent();
    this._scaling();

    return this;
  }

  /**
   * Draws the chart
   */
  public draw(): Linechart {
    super.draw();

    this._drawCanvas()
        ._drawAxes()
        ._drawSeries()
        ._drawMarker();
    return this;
  }

  /**
   * Serialise chart data
   */
  public toString(): string {
    let dt: string = this._data.series.map((n: any) => `${n}`).join("\n");
    return `data:\n${dt}`;
  }

  // ***** PRIVATE METHODS

  private _drawAxes(): Linechart {
    if (this._axisX === undefined) {
      this._axisX = this.canvas.append("g")
        .attr("class", "line-axis-x")
        .attr("transform", `translate(0,${this.rh})`);
    }

    this._axisX.call(
      axisBottom(this.scale.x)
    ).select(".domain").remove();

    if (this._axisY === undefined) {
      this._axisY = this.canvas.append("g")
        .attr("class", "line-axis-y")
        .attr("transform", `translate(0,0)`);
    }

    this._axisY.call(
      axisLeft(this.scale.y)
    ).select(".domain").remove();

    let xAxisLabel = this.canvas.select("text.line-axis-x-text");
    if (xAxisLabel.empty()) {
      xAxisLabel = this.canvas.append("text")
        .attr("class", "line-axis-x-text")
        .attr("text-anchor", "end")
        .attr("x", this.rw)
        .attr("y", this.rh - 10);
    }
    xAxisLabel.text(this._data.labels?.axis?.x);

    let yAxisLabel = this.canvas.select("text.line-axis-y-text");
    if (yAxisLabel.empty()) {
      yAxisLabel = this.canvas.append("text")
        .attr("class", "line-axis-y-text")
        .attr("text-anchor", "start")
        .attr("x", 10)
        .attr("y", 0);
    }
    yAxisLabel.text(this._data.labels?.axis?.y);

    return this;
  }

  private _drawCanvas(): Linechart {
    this.id = "linechart" + Array.from(document.querySelectorAll(".linechart")).length;
    const svg = this.container.querySelector("svg");
    if (svg) {
      svg.classList.add("linechart");
      svg.id = this.id;
    }
    return this;
  }

  private _drawMarker(): Linechart {
    const self = this;
    const dot = this.canvas.append("g")
      .attr("display", "none");

    dot.append("circle").attr("r", 2.5);

    dot.append("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("y", -8);

    const path = self.canvas.selectAll("path.linechart");
    const series = self.canvas.selectAll("g.series");

    if ("ontouchstart" in document) {
      series
        .on("touchmove", (event: any) => moved(event))
        .on("touchstart", entered)
        .on("touchend", left);
    } else {
      series
        .on("mousemove", (event: any) => moved(event))
        .on("mouseenter", entered)
        .on("mouseleave", left);
    }

    function entered() {
      dot.attr("display", null);
    }

    function left() {
      dot.attr("display", "none");
    }

    function moved(event: any) {
      event.preventDefault();
      const [x, y] = pointer(event);
      const xm = self.scale.x.invert(x);
      const ym = self.scale.y.invert(y);
      const xvalues = path.datum().values.map((d: any) => d[0]);
      const i1 = bisectLeft(xvalues, xm, 1);
      const i0 = i1 - 1;
      const i = xm - xvalues[i0] > xvalues[i1] - xm ? i1 : i0;
      const s = least(self._data.series, (d: any) => Math.abs(d.values[i][1] - ym));
      if (s) {
        const dt = self._isDate(xvalues[i]) ? new Date(xvalues[i]) : xvalues[i] ;
        dot.attr("transform", `translate(${self.scale.x(dt)},${self.scale.y(s.values[i][1])})`);
        dot.select("text").text(s.label);
      }
    }

    return this;
  }

  private _drawSeries(): Linechart {
    let g = this.canvas.select("g.series");
    if (g.empty()) {
      g = this.canvas.append("g").attr("class", "series");
    }

    g.selectAll("path.linechart")
      .data(this._data.series)
      .join(
        (enter: any) => {
          const series = enter.append("path")
            .attr("id", (d: any, i: number) => `${this.id}_p${i}`)
            .attr("class", "linechart")
            .attr("d", (d: any) => this._line(d.values))
            .attr("stroke", (d: any) => d.color)
            .on("click", (event: any) => this._lineClickHandler(event, event.target));
          series.append("title").text((d: any) => `${d.label}`);
        },
        (update: any) => {
          update.attr("id", (d: any, i: number) => `${this.id}_p${i}`)
            .attr("d", this._line as any)
            .attr("stroke", (d: any) => d.color);
          update.select("title").text((d: any) => `${d.label}`);
        },
        (exit: any) => exit.remove()
      );

    return this;
  }

  private _lineClickHandler(event: any, el: Element): void {
    event.stopPropagation();
    this.clearSelection();
    window.dispatchEvent(new CustomEvent("line-selected", { detail: el }));
    selectAll("path.linechart")
      .each((d: any, i: number, n: any) => {
        if (n[i] === el) {
          select(el).classed("selected", true);
        } else {
          select(n[i]).classed("fade", true);
        }
      });
  }

  /**
   * Calculates the chart scale
   */
  private _scaling(): Linechart {
    if (this._isDate(this._extentX[0])) {
      this.scale.x = scaleTime().domain(this._extentX).range([0, this.rw - this.margin.left]).nice(this.ticksX);
    } else {
      this.scale.x = scaleLinear().domain(this._extentX).range([0, this.rw - this.margin.left]).nice(this.ticksX);
    }
    this.scale.y = scaleLinear().domain(this._extentY).range([this.rh, 0]).nice(this.ticksY);
    return this;
  }

  /**
   * Determines the minimum and maximum extent values used by scale
   */
  private _scalingExtent(): Linechart {
    const maxX: any[] = [];
    const maxY: number[] = [];

    this._data.series.forEach((s: TLineSeries) => {
      s.values.forEach((v: [string | number | Date, number]) => {
        maxX.push(v[0]);
        maxY.push(v[1]);
      });
    });

    this._extentX = extent(maxX) as [any, any];
    if (!this._isDate(this._extentX[0]) && this._extentX[0] > this.origin) {
      this._extentX[0] = this.origin;
    }

    this._extentY = extent(maxY) as [number, number];
    if (this._extentY[0] > this.origin) {
      this._extentY[0] = this.origin;
    }
    return this;
  }
}