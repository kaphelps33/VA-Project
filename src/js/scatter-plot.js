var margin = { top: 10, right: 30, bottom: 30, left: 60 },
  width = 500 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

var svg = d3
  .select(".scatter")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg
  .append("text")
  .attr("x", 0)
  .attr("y", 0)
  .attr("text-anchor", "middle")
  .style("font-family", "Helvetica")
  .style("font-size", 20)
  .text("What charges are covered by medicare vs. what charges are paid");

d3.csv("../data/inpatient_charges_2011.csv").then((data) => {
  data.forEach((d) => {
    d.average_medicare_payments = +d["average_medicare_payments"];
    d.average_covered_charges = +d["average_covered_charges"];
    d.average_total_payments = +d["average_total_payments"];
  });

  const yMax = d3.max(data, (d) => d.average_covered_charges);
  const xMax = d3.max(data, (d) => d.average_medicare_payments);

  const tooltip = d3.select(".tooltip").append("p");

  const colorScale = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.average_total_payments))
    .range(d3.schemeSet1);

  // Add X axis
  var x = d3.scaleLinear().domain([0, xMax]).range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  var y = d3
    .scaleLinear()
    .domain([0, parseInt(yMax)])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  svg
    .append("g")
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return x(d.average_medicare_payments);
    })
    .attr("cy", function (d) {
      return y(d.average_covered_charges);
    })
    .attr("r", 1.5)
    .style("fill", (d) => colorScale(d.average_total_payments))
    .on("mouseover", (e, d) => {
      tooltip
        .html(
          `Covered Charges: $${numberWithCommas(d.average_covered_charges)}`
        )
        .style("opacity", 1);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });
});

function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
