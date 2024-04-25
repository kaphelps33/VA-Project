let data, bubbleChart, scatterPlot;
let colorScale;

let bubbleColorScale = d3.scaleSequential(d3.interpolateRainbow);

const dispatcher = d3.dispatch("filerDrugType");

d3.csv("../data/final_data.csv").then((_data) => {
  data = _data;

  const keys = [
    "Year",
    "average_covered_charges",
    "average_total_payments",
    "average_medicare_payments",
  ];

  // data cleaning
  data.forEach((d) => {
    keys.forEach((key) => {
      d[key] = +d[key];
    });
  });

  colorScale = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.average_total_payments))
    .range(d3.schemeSet1);

  bubbleChart = new BubbleChart(
    {
      parentElement: ".bubble",
      containerWidth: 500,
      containerHeight: 600,
      margin: { top: 20, right: 20, bottom: 50, left: 50 },
    },
    data,
    bubbleColorScale,
    dispatcher
  );
  bubbleChart.updateVis();

  scatterPlot = new ScatterPlot(
    {
      parentElement: ".scatter",
      containerWidth: 500,
      containerHeight: 500,
      margin: { top: 20, right: 20, bottom: 50, left: 50 },
    },
    data,
    colorScale,
    dispatcher
  );
  scatterPlot.updateVis();
});
