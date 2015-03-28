app.controller('AfterControl', ['$scope', '$location', 'Room', 'SharedData', function($scope, $location, Room, SharedData) {
  $scope.room;


//   var data = [
//   {"time": "20111001", "New York": "63.4", "San Francisco": "62.7", "Austin": "72.2"},
//   {"time": "20111002", "New York": "58.0", "San Francisco": "59.9", "Austin": "67.7"}
// ];

  var data = SharedData.get('result');
  console.log(data);

  $scope.drawGraph = function() {
    var margin = {top: 20, right: 80, bottom: 30, left: 50},
        width = window.innerWidth-20 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    
    // var parseTime = d3.time.format("%H:%M:%S").parse;
    var parseTime = d3.time.format("%H:%M:%S").parse;

    data.forEach(function(d) {
      var time = moment(d.time).format('HH:MM:SS');
      d.time = parseTime(time);
    });


    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(d.time); })
        .y(function(d) { return y(d.totalThumbs); });

    var svg = d3.select("#graph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      //after data is available
      color.domain(d3.keys(data[0]).filter(function(key) { return key !== "time"; }));

      var thumbs = color.domain().map(function(name) {
        return {
          name: name,
          values: data.map(function(d) {
            return {time: d.time, totalThumbs: d[name]};
          })
        };
      });

     

      x.domain(d3.extent(data, function(d) { return d.time; }));

      y.domain([
        d3.min(thumbs, function(c) { return d3.min(c.values, function(v) { return v.totalThumbs; }); }),
        d3.max(thumbs, function(c) { return d3.max(c.values, function(v) { return v.totalThumbs; }); })
      ]);

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("# of Thumbs");

      var thumb = svg.selectAll(".thumb")
          .data(thumbs)
        .enter().append("g")
          .attr("class", "thumb");

      thumb.append("path")
          .attr("class", "line")
          .attr("d", function(d) { return line(d.values); })
          .style("stroke", function(d) { return color(d.name); });

      thumb.append("text")
          .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
          .attr("transform", function(d) { return "translate(" + x(d.value.time) + "," + y(d.value.totalThumbs) + ")"; })
          .attr("x", 3)
          .attr("dy", ".35em")
          .text(function(d) { return d.name; });

  }

  $scope.drawGraph();

}]);