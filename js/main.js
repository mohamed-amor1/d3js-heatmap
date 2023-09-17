document.addEventListener("DOMContentLoaded", () => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const url =
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

  // Define margin, width, and height
  const margin = { top: 100, right: 100, bottom: 50, left: 100 };
  const width = 1400 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Define the SVG element
  const svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Fetch and process the data
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const baseTemp = data.baseTemperature;
      const monthlyVariance = data.monthlyVariance;

      // Extract necessary data
      const year = monthlyVariance.map((item) => new Date(item.year, 0, 1));
      const month = monthlyVariance.map((item) => item.month);
      const variance = monthlyVariance.map((item) => item.variance);
      const temperature = monthlyVariance.map(
        (item) => baseTemp + item.variance
      );

      console.log(temperature);

      // Build X scales and axis:
      const x = d3.scaleTime().domain(d3.extent(year)).range([0, width]);

      svg
        .append("g")
        .style("font-size", 12)
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(10)).tickSize(10));

      // Build Y scales and axis:
      const y = d3
        .scaleBand()
        .range([height, 0])
        .domain(d3.range(1, 13))
        .padding(0.05);
      svg
        .append("g")
        .style("font-size", 12)
        .attr("id", "y-axis")
        .call(d3.axisLeft(y).tickSize(10))
        .selectAll(".tick text")
        .text((d) => monthNames[d - 1])
        .select(".domain")
        .remove();

      // Build color scale based on temperature
      const myColor = d3
        .scaleSequential()
        .domain([d3.max(temperature), d3.min(temperature)])
        .interpolator(d3.interpolateRdYlBu);

      // Create a tooltip
      const tooltip = d3
        .select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "rgb(17 24 39)")
        .style("color", "white")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "10px");

      // Functions for tooltip interactions
      const mouseover = function (event, d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "black").style("opacity", 1);
      };

      const mousemove = function (event, d) {
        tooltip
          .html(
            ` ${d.year} - ${monthNames[d.month - 1]} <br/>Variance: ${
              d.variance
            }°C <br/>Base Temperature: ${baseTemp} °C
            <br/>Temperature: ${(baseTemp + d.variance).toFixed(3)} °C`
          )
          .style("left", event.pageX + 10 + "px") // Adjust left position
          .style("top", event.pageY - 30 + "px"); // Adjust top position
      };

      const mouseleave = function (event, d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "none").style("opacity", 0.8);
      };

      // Add the squares
      svg
        .selectAll()
        .data(monthlyVariance)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d) => x(new Date(d.year, 0, 1)))
        .attr("y", (d) => y(d.month))
        .attr("rx", 0)
        .attr("ry", 0)
        .attr(
          "width",
          x(new Date(year[1].getFullYear() + 1, 0, 1)) -
            x(new Date(year[0].getFullYear(), 0, 1))
        )
        .attr("height", y.bandwidth())
        .style("fill", (d) => myColor(baseTemp + d.variance))
        .style("stroke-width", 1)
        .style("stroke", "none")
        .style("opacity", 0.8)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

      // Select the existing "legend" div
      const legendDiv = d3.select("#legend");
      const numberOfLegendColors = 9; // Change this to the desired number of colors

      // Create temperature values for legend
      const legendValues = [];
      const temperatureRange = d3.extent(temperature);
      const step =
        (temperatureRange[1] - temperatureRange[0]) / numberOfLegendColors;

      for (let i = 0; i < numberOfLegendColors; i++) {
        legendValues.push(temperatureRange[0] + i * step);
      }

      // Create a legend group inside the "legend" div
      const legend = legendDiv
        .append("svg")
        .attr("id", "legend-svg")
        .attr("width", "fit-content") // Adjust the width as needed
        .attr("height", 60); // Adjust the height as needed

      // Create rectangles and text labels for the legend
      legend
        .selectAll("rect")
        .data(legendValues)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * 60) // Adjust the spacing between legend items
        .attr("width", 60) // Adjust the width of each legend item
        .attr("height", 20) // Adjust the height of each legend item
        .style("fill", (d) => myColor(d)); // Use the color scale to fill the legend item

      // Add text labels next to the legend rectangles (optional)
      legend
        .selectAll("text")
        .data(legendValues)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * 60 + 15) // Adjust the x-position for text labels
        .attr("y", 45) // Adjust the y-position for text labels
        .style("text-anchor", "middle")
        .style("font-size", 14)
        .text((d) => d.toFixed(2)); // Display the temperature value as text
    });

  // Add title to graph
  svg
    .append("text")
    .attr("x", 0)
    .attr("y", -50)
    .attr("text-anchor", "left")
    .style("font-size", "22px")
    .text("A d3.js heatmap");

  // Add subtitle to graph
  svg
    .append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style("fill", "grey")
    .style("max-width", 400)
    .text("Monthly Global Land-Surface Temperature.");

  // Add label to x axis
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Years");

  // text label for the y axis
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Months");
});
