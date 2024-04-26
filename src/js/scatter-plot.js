class ScatterPlot {
  constructor(_config, _data, _colorScale, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: _config.margin || { top: 5, right: 5, bottom: 20, left: 50 },
    };
    this.data = _data;
    this.colorScale = _colorScale;
    this.dispatcher = _dispatcher || null;
    this.initVis();
  }

  initVis() {
    let vis = this;
    vis.width = vis.config.containerWidth;
    vis.height = vis.config.containerHeight;

    vis.svg = d3
      .select(".scatter")
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height)
      .append("g");

    vis.svg
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .style("font-family", "Helvetica")
      .style("font-size", 20)
      .text("What charges are covered by medicare vs. what charges are paid");

    vis.yMax = d3.max(vis.data, (d) => d.totalAverageCoveredCharges);
    vis.xMax = d3.max(vis.data, (d) => d.totalAverageMedicarePayments);

    // x-axis
    vis.x = d3
      .scaleLinear()
      .domain([0, vis.xMax])
      .range([0, vis.width - vis.config.margin.right]);

    vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.format(".2s"));

    vis.svg
      .append("g")
      .attr(
        "transform",
        "translate(0, " + (vis.height - vis.config.margin.bottom) + ")"
      )
      .call(vis.xAxis);

    // y-axis
    vis.y = d3
      .scaleLinear()
      .domain([0, vis.yMax])
      .range([vis.height - vis.config.margin.bottom, vis.config.margin.top]);

    vis.yAxis = d3.axisLeft().scale(vis.y).tickFormat(d3.format(".2s"));

    vis.svg
      .append("g")
      .attr("transfrom", `translate(${vis.config.margin.left},0)`)
      .call(vis.yAxis);

    vis.tooltip = d3.select(".tooltip").append("p");
  }

  updateVis() {
    let vis = this;
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    vis.svg
      .append("g")
      .selectAll("dot")
      .data(vis.data)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return vis.x(d.totalAverageMedicarePayments);
      })
      .attr("cy", function (d) {
        return vis.y(d.totalAverageCoveredCharges);
      })
      .attr("r", 5)
      // .style("fill", (d) => colorScale(d.totalAverageTotalPayments))
      .style("fill", (d) => colorScale(d.drg_definition))
      .on("mouseover", (e, d) => {
        vis.tooltip
          .html(
            `Covered Charges: $${d.totalAverageCoveredCharges.toLocaleString()}`
          )
          .style("opacity", 1);
      })
      .on("mouseout", () => {
        vis.tooltip.style("opacity", 0);
      });
  }
}
