let data, bubbleChart, scatterPlot;
let colorScale;

const dispatcher = d3.dispatch("highlight", "reset");

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

  console.log(topData);

  const maxMedicaidNotCovered = d3.max(
    topData,
    (d) => d.totalAverageCoveredCharges - d.totalAverageTotalPayments
  );

  colorScale = d3
    .scaleSequential(d3.interpolateOrRd)
    .domain([0, maxMedicaidNotCovered]);

  bubbleChart = new BubbleChart(
    {
      parentElement: ".bubble",
      containerWidth: 600,
      containerHeight: 800,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    topData,
    colorScale,
    dispatcher
  );
  bubbleChart.updateVis();

  scatterPlot = new ScatterPlot(
    {
      parentElement: ".scatter",
      containerWidth: 600,
      containerHeight: 600,
      margin: { top: 30, right: 50, bottom: 100, left: 50 },
    },
    topData,
    colorScale,
    dispatcher
  );
  scatterPlot.updateVis();
});
