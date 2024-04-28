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

    vis.dispatcher.on("highlight", (drg_definition) => {
      vis.svg
        .selectAll("circle")
        .transition()
        .style("opacity", (d) =>
          d.drg_definition === drg_definition ? 1 : 0.1
        )
        .attr("r", (d) => (d.drg_definition === drg_definition ? 7 : 3));
    });

    vis.dispatcher.on("reset", () => {
      vis.svg.selectAll("circle").transition().style("opacity", 1).attr("r", 5);
    });

    vis.renderVis();
  }

  renderVis() {
    let vis = this;
    vis.svg.selectAll("circle").remove();

    vis.svg
      .append("g")
      // .selectAll("dot")
      .selectAll("circle")
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
      .style("fill", (d) =>
        vis.colorScale(
          d.totalAverageCoveredCharges - d.totalAverageTotalPayments
        )
      )
      .on("mouseover", (event, d) => {
        vis.dispatcher.call("highlight", event, d.drg_definition);
        // Display the tooltip at the position of the mouse
        vis.tooltip
          .html(
            `
            MS-DRG Code: ${d.drg_definition}<br>
            Average Covered Charges: $${d.totalAverageCoveredCharges.toLocaleString()}<br>
            Average Medicare Payments: $${d.totalAverageMedicarePayments.toLocaleString()}<br>
            <b>
            ${(
              (d.totalAverageTotalPayments / d.totalAverageCoveredCharges) *
              100
            ).toFixed(0.2)}% Paid By individual<b>`
          )
          .style("opacity", 1)
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY}px`);
      })
      // Reset all animations
      .on("mouseout", function (event, d) {
        vis.dispatcher.call("reset", event, null);
        vis.tooltip.transition().style("opacity", 0);
      });
  }
}
