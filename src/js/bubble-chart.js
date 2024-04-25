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
      return {
        drg_definition: key,
        totalAverageMedicarePayments,
        totalAverageTotalPayments,
        count: value.length,
      };
    });

    aggregatedData.sort(
      (a, b) => b.totalAverageMedicarePayments - a.totalAverageMedicarePayments
    );

    // Showing only the top spots of data
    const topData = aggregatedData.slice(0, 50);

    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height);

    vis.pack = d3.pack().size([vis.width, vis.height]).padding(1.5);

    // Define the value to calculate the area of the circles
    vis.root = d3.hierarchy({ children: topData }).sum((d) => d.count);

    vis.nodes = vis.pack(vis.root).leaves();

    vis.radiusScale = d3
      .scalePow()
      .exponent(0.7)
      .domain([
        d3.min(vis.nodes, (d) => d.data.totalAverageMedicarePayments),
        d3.max(vis.nodes, (d) => d.data.totalAverageMedicarePayments),
      ])
      .range([10, 100]);

    vis.textScale = d3
      .scaleLinear()
      .domain([1, d3.max(vis.nodes, (d) => d.r)]) // Set the domain to the range of radii
      .range([0, 15]); // Set the range of font sizes
  }

  updateVis() {
    let vis = this;

    vis.root.sort((a, b) => b.value - a.value);

    // Create the bubbles and bind them to the nodes data
    vis.bubbles = vis.svg
      .selectAll("circle")
      .data(vis.nodes)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => vis.radiusScale(d.data.totalAverageMedicarePayments)) // The radius is determined by the pack layout
      .style("fill", (d) => vis.colorScale(d.data.totalAverageTotalPayments));

    // Add tooltips to each bubble using the title tag for simplicity
    vis.bubbles
      .append("title")
      .text(
        (d) =>
          `${d.data.drg_definition}\nAverage Medicare Payments: ${d.data.totalAverageMedicarePayments}\nAverage Total Payments: ${d.data.totalAverageTotalPayments}`
      );
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    const simulation = d3
      .forceSimulation(vis.nodes)
      .force("charge", d3.forceManyBody().strength(15))
      .force("center", d3.forceCenter(vis.width / 2, vis.height / 2))
      .force(
        "collision",
        d3
          .forceCollide(30)
          .radius(
            (d) => vis.radiusScale(d.data.totalAverageMedicarePayments) + 1
          )
      )
      .stop();

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
        (d) =>
          `${vis.textScale(
            vis.radiusScale(d.data.totalAverageMedicarePayments)
          )}px`
      ) // Use the text scale to set the font size
      .text((d) => "$" + d.data.totalAverageMedicarePayments.toLocaleString()) // Display the price
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
