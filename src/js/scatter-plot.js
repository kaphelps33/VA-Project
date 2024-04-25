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
      .append("g")
      .attr(
        "transform",
        "translate(" +
          vis.config.margin.left +
          "," +
          vis.config.margin.top +
          ")"
      );

    vis.svg
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .style("font-family", "Helvetica")
      .style("font-size", 20)
      .text("What charges are covered by medicare vs. what charges are paid");

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
    vis.topData = aggregatedData.slice(0, 50);

    vis.yMax = d3.max(vis.topData, (d) => d.totalAverageCoveredCharges);
    vis.xMax = d3.max(vis.topData, (d) => d.totalAverageMedicarePayments);

    vis.x = d3
      .scaleLinear()
      .domain([0, vis.xMax + 100])
      .range([0, vis.width]);

    vis.y = d3.scaleLinear().domain([0, vis.yMax]).range([vis.height, 0]);

    vis.svg
      .append("g")
      .attr("transform", "translate(0," + (vis.height - 30) + ")")
      .call(d3.axisBottom(vis.x).ticks(5));

    vis.svg.append("g").call(d3.axisLeft(vis.y).ticks(5));

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
      .data(vis.topData)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return vis.x(d.totalAverageMedicarePayments);
      })
      .attr("cy", function (d) {
        return vis.y(d.totalAverageCoveredCharges);
      })
      .attr("r", 5)
      .style("fill", (d) => colorScale(d.totalAverageTotalPayments))
      .on("mouseover", (e, d) => {
        console.log("Working");
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
