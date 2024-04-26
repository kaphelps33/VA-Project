let data, bubbleChart, scatterPlot;
let colorScale;

let bubbleColorScale = d3.scaleSequential(d3.interpolateRainbow);

const dispatcher = d3.dispatch("filterYear");

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

  const year = filterYear();
  console.log(year);

  const groupedData = d3.group(data, (d) => d.drg_definition);

  const aggregatedData = Array.from(groupedData, ([key, value]) => {
    const totalAverageMedicarePayments = d3.mean(
      value,
      (d) => d.average_medicare_payments
    );
    const totalAverageTotalPayments = d3.mean(
      value,
      (d) => d.average_total_payments
    );
    const totalAverageCoveredCharges = d3.mean(
      value,
      (d) => d.average_covered_charges
    );
    return {
      drg_definition: key,
      totalAverageMedicarePayments,
      totalAverageTotalPayments,
      totalAverageCoveredCharges,
      count: value.length,
    };
  });

  aggregatedData.sort(
    (a, b) => b.totalAverageMedicarePayments - a.totalAverageMedicarePayments
  );

  // Showing only the top spots of data
  const topData = aggregatedData.slice(0, 50);

  bubbleColorScale = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.Year))
    .range(d3.schemeSet1);

  colorScale = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.average_total_payments))
    .range(d3.schemeSet1);

  bubbleChart = new BubbleChart(
    {
      parentElement: ".bubble",
      containerWidth: 600,
      containerHeight: 600,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    topData,
    bubbleColorScale,
    dispatcher
  );
  bubbleChart.updateVis();

  scatterPlot = new ScatterPlot(
    {
      parentElement: ".scatter",
      containerWidth: 600,
      containerHeight: 600,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    topData,
    colorScale,
    dispatcher
  );
  scatterPlot.updateVis();
});

function filterYear() {
  const slider = d3.select(".year-slider");
  let selectedYear = +slider.property("value");
  return selectedYear;
  // dispatcher.call("filterYear", null, selectedYear);
}

// Add event listener to the dispatcher
dispatcher.on("filterYear", function (year) {
  // Update the visualization based on the selected year
  bubbleChart.filterYear(year);
  scatterPlot.filterYear(year);
});
