// Load the dataset from a CSV file
d3.csv("../data/inpatient_charges_2011.csv").then(function (dataset) {
  // Set up the dimensions of the SVG container
  const width = 1000;
  const height = 800;

  // Create the SVG container by selecting the existing SVG element in the HTML
  // const svg = d3
  //   .select("#bubble-chart-svg")
  //   .attr("width", width)
  //   .attr("height", height);
  const svg = d3
    .select(".bubble")
    .append("svg")
    .attr("height", height)
    .attr("width", width);

  // Convert numeric values from strings to numbers
  dataset.forEach(function (d) {
    d.average_medicare_payments = +d.average_medicare_payments;
    d.average_total_payments = +d.average_total_payments;
  });

  const groupedData = d3.group(dataset, (d) => d.drg_definition);

  // Calculate aggregate values for each group
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

  // Create a color scale
  const colorScale = d3.scaleSequential(d3.interpolateRainbow);
  // .domain(aggregatedData.map((d) => d.drg_definition))
  // .range(d3.schemeCategory10);

  // Structure the data hierarchy and sum the values for the layout
  const root = d3.hierarchy({ children: aggregatedData }).sum((d) => d.count); // Define the value to calculate the area of the circles

  // Create a pack layout
  const pack = d3.pack().size([width, height]).padding(1.5);

  root.sort((a, b) => b.value - a.value);

  // Generate the pack layout nodes
  const nodes = pack(root).leaves();

  // Create a scale for the radius based on the data values
  const radiusScale = d3
    .scalePow()
    .exponent(0.7) // Adjust the exponent as needed
    .domain([
      d3.min(nodes, (d) => d.data.totalAverageMedicarePayments),
      d3.max(nodes, (d) => d.data.totalAverageMedicarePayments),
    ])
    .range([10, 100]);

  const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(15))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3
        .forceCollide(30)
        .radius((d) => radiusScale(d.data.totalAverageMedicarePayments) + 1)
    )
    .stop();

  // Create the bubbles and bind them to the nodes data
  const bubbles = svg
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => radiusScale(d.data.totalAverageMedicarePayments)) // The radius is determined by the pack layout
    .style("fill", (d) => colorScale(d.data.totalAverageTotalPayments));

  // Add tooltips to each bubble using the title tag for simplicity
  bubbles
    .append("title")
    .text(
      (d) =>
        `${d.data.drg_definition}\nAverage Medicare Payments: ${d.data.totalAverageMedicarePayments}\nAverage Total Payments: ${d.data.totalAverageTotalPayments}`
    );

  // Create a scale for the text size based on the radius of the circles
  // Create a scale for the text size based on the radius of the circles
  const textScale = d3
    .scaleLinear()
    .domain([1, d3.max(nodes, (d) => d.r)]) // Set the domain to the range of radii
    .range([0, 15]); // Set the range of font sizes

  // Create the labels for the big circles
  const labels = svg
    .selectAll("text")
    .data(nodes.filter((d) => d.r > 1)) // Only include nodes with a radius greater than 1
    .enter()
    .append("text")
    .attr("dy", "0.35em")
    .style("text-anchor", "middle")
    .style(
      "font-size",
      (d) => `${textScale(radiusScale(d.data.totalAverageMedicarePayments))}px`
    ) // Use the text scale to set the font size
    .text((d) => d.data.totalAverageMedicarePayments.toFixed(2)) // Display the price
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y);

  simulation.on("tick", () => {
    // Update circle positions
    bubbles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

    // Update label positions
    labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
  });

  simulation.alpha(1).restart();
});
