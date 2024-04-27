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
      .attr(
        "width",
        vis.width + vis.config.margin.right + vis.config.margin.left
      )
      .attr("height", vis.height)
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left}, ${vis.config.margin.top})`
      );

    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", -vis.config.margin.top + 30)
      .attr("text-anchor", "middle")
      .style("font-family", "Helvetica")
      .style("font-size", 20)
      .style("fill", "white")
      .text("What Charges Are Covered By Medicare vs. What Charges Are Paid?");

    vis.yMax = d3.max(vis.data, (d) => d.totalAverageCoveredCharges);
    vis.xMax = d3.max(vis.data, (d) => d.totalAverageMedicarePayments);

    // x-axis (total average medicare payments)
    vis.x = d3
      .scaleLinear()
      .domain([0, vis.xMax])
      .range([0, vis.width - vis.config.margin.right]);

    vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.format(".2s"));

    vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left}, ${
          vis.height - vis.config.margin.bottom
        })`
      )
      .call(vis.xAxis);

    // axis label
    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", vis.height - vis.config.margin.bottom + 40)
      .attr("text-anchor", "middle")
      .style("font-family", "Helvetica")
      .style("font-size", 16)
      .style("fill", "white")
      .text("Total Average Medicare Payments");

    // y-axis
    vis.y = d3
      .scaleLinear()
      .domain([0, vis.yMax])
      .range([vis.height - vis.config.margin.bottom, vis.config.margin.top]);

    vis.yAxis = d3.axisLeft().scale(vis.y).tickFormat(d3.format(".2s"));

    vis.svg
      .append("g")
      .attr("transform", `translate(${vis.config.margin.left},0)`)
      .call(vis.yAxis);

    // axis label
    vis.svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -vis.height / 2)
      .attr("y", -vis.config.margin.left + 60) // Position to the left of y-axis
      .attr("text-anchor", "middle")
      .style("font-family", "Helvetica")
      .style("font-size", 16)
      .style("fill", "white")
      .text("Total Average Covered Charges");

    // tooltip
    vis.tooltip = d3
      .select(vis.config.parentElement)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
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
      .style("fill", (d) =>
        colorScale(d.totalAverageCoveredCharges - d.totalAverageTotalPayments)
      )
      .on("mouseover", (event, d) => {
        // increase selected circle radius
        d3.select(event.target).attr("r", 10);
        // lower opacity of all other circles
        vis.svg
          .selectAll("circle")
          .filter((dOther) => dOther !== d)
          .attr("opacity", 0.2);
        vis.tooltip
          .html(
            `
            MS-DRG Code: ${d.drg_definition}<br>
            Covered Charges: $${d.totalAverageCoveredCharges.toLocaleString()}<br>
            Medicare Paid Charges: $${d.totalAverageMedicarePayments.toLocaleString()}<br>
            <b>Uncovered Charges: $${(
              d.totalAverageCoveredCharges - d.totalAverageTotalPayments
            ).toLocaleString()}<b>`
          )
          .style("opacity", 1)
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY}px`);
      })
      .on("mouseout", function () {
        // reset radius
        d3.select(this).attr("r", 5);
        // reset opacity
        vis.svg.selectAll("circle").attr("opacity", 1);
        vis.tooltip.style("opacity", 0);
      });
  }
}
