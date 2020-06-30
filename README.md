# linechart

My take on building a line chart. The build includes a starter CSS file, and two javascript versions for ES modules and current browsers. No serious attempt has been made towards ie11 compatibility.

## Installation

```shell
npm i --save @buckneri/linechart
```

## API

### Data frame schema

Receives a JSON object as described below:

```javascript
{
  labels: {
    axis: {
      x: string,
      y: string
    }
  },
  series: [
    {
      color: string,
      label: string,
      values: [string | number | Date, number][]
    }
  ]
}

// Example data
{
  labels: {
    axis: {
      x: "day",
      y: "sales"
    }
  },
  series: [
    { label: "apple", values: [["2020-01-01", 241], ["2020-01-02", 117], ["2020-01-03", 12]] },
    { label: "pear", values: [["2020-01-01", 263], ["2020-01-02", 112], ["2020-01-03", 14]] },
    { label: "grape", values: [["2020-01-01", 288], ["2020-01-02", 123], ["2020-01-03", 15]] },
    { label: "melon", values: [["2020-01-01", 287], ["2020-01-02", 120], ["2020-01-03", 16]] }
  ]
}
```

### Constructor

```javascript
const line = new Linechart({
  container: document.getElementById("chart"),
  data: data,
  margin: { bottom: 20, left: 20, right: 20, top: 20 }
});
```

### Events

line-selected - emitted when user clicks on line

### Methods

```javascript
line.clearSelection();
// clears selection from chart elements

line.data(data);
// stores and initialises data

line.destroy();
// self-destruct

line.draw();
// draws chart to DOM

line.toString();
// serialises the internal data
```

### Properties

```javascript
line.container;
// parent element for chart

line.formatX
// Intl.NumberFormat instance. Default is decimal

line.formatY
// Intl.NumberFormat instance. Default is decimal

line.h;
// height of chart

line.locale
// locale for formatting values. Default is en-GB

line.margin;
// defines the border zone around the canvas

line.rh;
// relative height, height - margins

line.rw;
// relative width, width - margins

line.ticksX
// Default is 5. Sets detail level on x axis

line.ticksY
// Default is 5. Sets detail level on y axis

line.w;
// width of chart
```
