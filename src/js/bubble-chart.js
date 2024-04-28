class BubbleChart {
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
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height);

    vis.pack = d3.pack().size([vis.width, vis.height]).padding(1.5);

    // Define the value to calculate the area of the circles
    vis.root = d3.hierarchy({ children: vis.data }).sum((d) => d.count);

    // Calculate the maximum count for the radius scale
    vis.maxCount = d3.max(vis.data, (d) => d.count);
    vis.minCount = d3.min(vis.data, (d) => d.count);

    vis.nodes = vis.pack(vis.root).leaves();

    vis.radiusScale = d3
      .scalePow()
      .exponent(0.5)
      .domain([0, this.maxCount])
      .range([15, 90]);

    // vis.radiusScale = d3
    //   .scalePow()
    //   .exponent(0.7)
    //   .domain([
    //     d3.min(vis.nodes, (d) => d.data.totalAverageMedicarePayments),
    //     d3.max(vis.nodes, (d) => d.data.totalAverageMedicarePayments),
    //   ])
    //   .range([10, 100]);

    vis.textScale = d3
      .scaleLinear()
      .domain([1, d3.max(vis.nodes, (d) => d.r)]) // Set the domain to the range of radii
      .range([0, 24]); // Set the range of font sizes

    // tooltip
    vis.tooltip = d3
      .select(vis.config.parentElement)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", vis.config.margin.top + 10)
      .attr("text-anchor", "middle")
      .style("font-size", 20)
      .style("fill", "White")
      .text("The Most Common DRGs and Their Costs");
  }

  updateVis() {
    let vis = this;

    vis.root.sort((a, b) => b.count - a.count);
    // vis.root.sort((a, b) => b.value - a.value);

    // Create the bubbles and bind them to the nodes data
    vis.bubbles = vis.svg
      .selectAll("circle")
      // .data(vis.nodes)
      .data(vis.root.leaves())
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      // Size of circle = average total payments
      // .attr("r", (d) => vis.radiusScale(d.data.totalAverageMedicarePayments))
      .attr("r", (d) => vis.radiusScale(d.data.count))
      .style("fill", (d) =>
        vis.colorScale(
          d.data.totalAverageCoveredCharges - d.data.totalAverageTotalPayments
        )
      );

    // listen for highlight on scatter plot
    vis.dispatcher.on("highlight", (drg_definition) => {
      console.log("Working");
      vis.svg
        .selectAll("circle")
        .style("opacity", (d) =>
          d.data.drg_definition === drg_definition ? 1 : 0.3
        );
    });

    vis.dispatcher.on("reset", () => {
      vis.svg.selectAll("circle").style("opacity", 1);
    });

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    const simulation = d3
      .forceSimulation(vis.nodes)
      .force("charge", d3.forceManyBody().strength(14))
      .force("center", d3.forceCenter(vis.width / 2, vis.height / 2))
      .force(
        "collision",
        d3.forceCollide(30).radius((d) => vis.radiusScale(d.data.count) + 1)
        // .radius(
        //   (d) => vis.radiusScale(d.data.totalAverageMedicarePayments) + 1
      )
      .stop();

    // Hover actions
    vis.bubbles
      .on("mouseover", (event, d) => {
        vis.dispatcher.call("highlight", event, d.data.drg_definition);
        vis.bubbles
          .transition()
          .duration(200)
          .style("opacity", (circle) => (circle === d ? 1 : 0.3));
        vis.tooltip
          .html(
            `${d.data.drg_definition}<br>
          Uncovered Charges: $${(
            d.data.totalAverageCoveredCharges - d.data.totalAverageTotalPayments
          ).toLocaleString()}`
          )
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
          .style("opacity", 0.9);
      })
      .on("mouseout", (event) => {
        vis.dispatcher.call("reset", event, null);
        vis.tooltip.style("opacity", 0);
        vis.bubbles.transition().duration(200).style("opacity", 1);
      });

    // Create the labels for the big circles
    const labels = vis.svg
      .selectAll("text")
      .data(vis.nodes.filter((d) => d.r > 1)) // Only include nodes with a radius greater than 1
      .enter()
      .append("text")
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style(
        "font-size",
        (d) => `${vis.textScale(vis.radiusScale(d.data.count))}px`
        // `${vis.textScale(
        //   vis.radiusScale(d.data.totalAverageMedicarePayments)
      ) // Use the text scale to set the font size
      .text(
        (d) =>
          "$" +
          (
            d.data.totalAverageCoveredCharges - d.data.totalAverageTotalPayments
          ).toLocaleString()
      ) // Display the price
      // .text((d) => d.data.drg_definition) // Display the price
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y);

    simulation.on("tick", () => {
      // Update circle positions
      vis.bubbles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      // Update label positions
      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    simulation.alpha(1).restart();
  }
}
