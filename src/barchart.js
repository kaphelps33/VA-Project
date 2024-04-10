var svg = d3.select(".barchart").attr("fill", "red"),
  margin = 800,
  width = svg.attr("width") - margin,
  height = svg.attr("height") - margin;

var xScale = d3.scaleBand().range([0, width]).padding(0.4),
  yScale = d3.scaleLinear().range([height, 0]);

var g = svg.append("g").attr("transform", "translate(" + 100 + "," + 100 + ")");

d3.csv("../data/outpatient_charges_2011.csv").then((data) => {
  data.forEach((d) => {
    d.provider_id = +d["Povider Id"];
    d.provider_city = d["Provider City"];
    d.provider_state = d["Provider State"];
  });

  console.log(data);

  xScale.domain(
    data.map(function (d) {
      return d.provider_state;
    })
  );

  yScale.domain([
    0,
    d3.max(data, function (d) {
      return d.average_total_payments;
    }),
  ]);

  g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));

  g.append("g")
    .call(
      d3
        .axisLeft(yScale)
        .tickFormat(function (d) {
          return "$" + d;
        })
        .ticks(10)
    )
    .append("text")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("value");
});

// provider_id: d.provider_id,
// provider_name: d.provider_name,
// provider_street_address: d.provider_street_address,
// provider_city: d.provider_city,
// provider_state: d.provider_state,
// provider_zipcode: d.provider_zipcode,
// apc: d.apc,
// hospital_referral_region: d.hospital_referral_region,
// outpatient_services: d.outpatient_services,
// average_estimated_submitted_charges:
//   d.average_estimated_submitted_charges,
// average_total_payments: d.average_total_payments,
