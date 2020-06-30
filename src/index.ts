import { bisectLeft, extent, least } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { event, mouse, select, selectAll } from "d3-selection";
import { scaleLinear, scaleOrdinal, scaleTime } from "d3-scale";
import { schemePaired } from "d3-scale-chromatic";
import { line } from "d3-shape";
import { svg, TMargin } from "@buckneri/spline";

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

export class Linechart {
  public container: HTMLElement = document.querySelector("body") as HTMLElement;
  public formatX: any;
  public formatY: Intl.NumberFormat;
  public h: number = 200;
  public locale: string = "en-GB";
  public margin: TMargin = { bottom: 20, left: 20, right: 30, top: 20 };
  public origin: number = 0;
  public rh: number = 160;
  public rw: number = 150;
  public ticksX: number = 10;
  public ticksY: number = 10;
  public w: number = 200;

  private _area: any;
  private _axisX: any;
  private _axisY: any;
  private _canvas: any;
  private _color = scaleOrdinal(schemePaired);
  private _data: TLine = { series: []};
  private _extentX: [number, number] = [0, 0];
  private _extentY: [number, number] = [0, 0];
  private _id: string = "";
  private _isDate = (d: any) => !isNaN(Date.parse(d));
  private _line: any;
  private _scaleX: any;
  private _scaleY: any;
  private _selected: SVGElement | undefined;
  private _svg: any;
  private _xvalues: Set<any> = new Set();

  constructor(options: TLinechartOptions) {
    if (options.margin !== undefined) {
      let m = options.margin;
      m.left = isNaN(m.left) ? 0 : m.left;
      m.right = isNaN(m.right) ? 0 : m.right;
      m.top = isNaN(m.top) ? 0 : m.top;
      m.bottom = isNaN(m.bottom) ? 0 : m.bottom;
      this.margin = m;
    }

    if (options.locale !== undefined) {
      this.locale = options.locale;
    }

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

    if (options.container !== undefined) {
      this.container = options.container;
    }

    const box: DOMRect = this.container.getBoundingClientRect();
    this.h = box.height;
    this.w = box.width;
    this.rh = this.h - this.margin.top - this.margin.bottom;
    this.rw = this.w - this.margin.left - this.margin.right;
    
    this.data(options.data);
  }

  /**
   * Clears selection from chart
   */
  public clearSelection(): Linechart {
    selectAll(".selected").classed("selected", false);
    selectAll(".fade").classed("fade", false);
    this._selected = undefined;
    return this;
  }

  /**
   * Saves data into chart
   * @param data
   */
  public data(data: TLine): Linechart {
    this._data = data;
    this._xvalues.clear();

    this._data.series.forEach((item: TLineSeries) => {
      if (item.color === undefined) {
        item.color = this._color(item.label);
      }
      item.values.forEach((item: [string | number | Date, number]) => {
        if (this._isDate(item[0])) {
          item[0] = new Date(item[0]);
        }
        this._xvalues.add(item[0]);
      });
    });

    this._line = line()
      .x((d: any) => this._scaleX(d[0]))
      .y((d: any) => this._scaleY(d[1]));
  
    this._scalingExtent();
    this._scaling();

    return this;
  }

  /**
   * Removes this chart from the DOM
   */
  public destroy(): Linechart {
    select(this.container).select("svg").remove();
    return this;
  }

  /**
   * Draws the chart
   */
  public draw(): Linechart {
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
      this._axisX = this._canvas.append("g")
        .attr("class", "line-axis-x")
        .attr("transform", `translate(0,${this.rh})`);
    }

    this._axisX.call(
      axisBottom(this._scaleX)
    ).select(".domain").remove();

    if (this._axisY === undefined) {
      this._axisY = this._canvas.append("g")
        .attr("class", "line-axis-y")
        .attr("transform", `translate(0,0)`);
    }

    this._axisY.call(
      axisLeft(this._scaleY)
    ).select(".domain").remove();

    let xAxisLabel = this._canvas.select("text.line-axis-x-text");
    if (xAxisLabel.empty()) {
      xAxisLabel = this._canvas.append("text")
        .attr("class", "line-axis-x-text")
        .attr("text-anchor", "end")
        .attr("x", this.rw)
        .attr("y", this.rh - 10);
    }
    xAxisLabel.text(this._data.labels?.axis?.x);

    let yAxisLabel = this._canvas.select("text.line-axis-y-text");
    if (yAxisLabel.empty()) {
      yAxisLabel = this._canvas.append("text")
        .attr("class", "line-axis-y-text")
        .attr("text-anchor", "start")
        .attr("x", 10)
        .attr("y", 0);
    }
    yAxisLabel.text(this._data.labels?.axis?.y);

    return this;
  }

  private _drawCanvas(): Linechart {
    if (select(this.container).select("svg.linechart").empty()) {
      this._id = "linechart" + Array.from(document.querySelectorAll(".linechart")).length;
      let sg: SVGElement | null = svg(this.container, {
        class: "linechart",
        height: this.h,
        id: this._id,
        margin: this.margin,
        width: this.w
      }) as SVGElement;
      this._svg = select(sg)
        .on("click", () => this.clearSelection());
      this._canvas = this._svg.select(".canvas");
    }

    return this;
  }

  private _drawMarker(): Linechart {
    const self = this;
    const dot = this._canvas.append("g")
      .attr("display", "none");

    dot.append("circle").attr("r", 2.5);

    dot.append("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("y", -8);

    if ("ontouchstart" in document) {
      this._canvas
        .style("-webkit-tap-highlight-color", "transparent")
        .on("touchmove", moved)
        .on("touchstart", entered)
        .on("touchend", left);
    } else {
      this._canvas
        .on("mousemove", moved)
        .on("mouseenter", entered)
        .on("mouseleave", left);
    }

    function entered() {
      self._canvas.selectAll("g.series")
        .style("mix-blend-mode", null)
        .attr("stroke", "#ddd");
      dot.attr("display", null);
    }

    function left() {
      self._canvas.selectAll("g.series")
        .style("mix-blend-mode", "multiply")
        .attr("stroke", null);
      dot.attr("display", "none");
    }

    function moved(this: any) {
      const path = self._canvas.selectAll("g.series");
      event.preventDefault();
      const ms = mouse(this);
      const xm = self._scaleX.invert(ms[0]);
      const ym = self._scaleY.invert(ms[1]);
      const xvalues = Array.from(self._xvalues.values());
      const i1 = bisectLeft(xvalues, xm, 1);
      const i0 = i1 - 1;
      const i = xm - xvalues[i0] > xvalues[i1] - xm ? i1 : i0;
      const s = least(self._data.series, (d: any) => Math.abs(d.values[i][0] - ym));
      path.attr("stroke", (d: any) => d === s ? null : "#ddd").filter((d: any) => d === s).raise();
      dot.attr("transform", `translate(${self._scaleX(xvalues[i])},${this._scaleY(s.values[i])})`);
      dot.select("text").text(s.label);
    }

    return this;
  }

  private _drawSeries(): Linechart {
    let n: number = 0;
    let series: any;

    let g = this._canvas.select("g.series");
    if (g.empty()) {
      g = this._canvas.append("g").attr("class", "series");
    }

    g.selectAll("path.linechart")
      .data(this._data.series)
      .join(
        (enter: any) => {
          series = enter.append("path")
            .attr("id", (d: any, i: number) => `${this._id}_p${i}`)
            .attr("class", "linechart")
            .attr("d", (d: any) => this._line(d.values))
            .style("mix-blend-mode", "multiply")
            .style("stroke", (d: any) => d.color)
            .on("click", () => this._lineClickHandler(event.target));
          series.append("title").text((d: any) => `${d.label}`);
        },
        (update: any) => {
          update.attr("id", (d: any, i: number) => `${this._id}_p${i}`)
            .attr("d", this._line as any)
            .style("stroke", (d: any) => d.color);
          update.select("title").text((d: any) => `${d.label}`);
        },
        (exit: any) => exit.remove()
      );

    return this;
  }

  private _lineClickHandler(el: Element): void {
    event.stopPropagation();
    this.clearSelection();
    window.dispatchEvent(new CustomEvent("line-selected", { detail: el }));
    selectAll("path.linechart")
      .each((d: any, i: number, n: any) => {
        if (n[i] === el) {
          select(el).classed("selected", true);
          this._selected = n[i];
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
      this._scaleX = scaleTime().domain(this._extentX).range([0, this.rw - this.margin.left]).nice(this.ticksX);
    } else {
      this._scaleX = scaleLinear().domain(this._extentX).range([0, this.rw - this.margin.left]).nice(this.ticksX);
    }
    this._scaleY = scaleLinear().domain(this._extentY).range([this.rh, 0]).nice(this.ticksY);
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