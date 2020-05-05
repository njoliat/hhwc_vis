$(document).ready(function() {

  // set the dimensions and margins of the graph
  var bar_margin = {top: 20, right: 30, bottom: 40, left: 90},
      width = 300 - bar_margin.left - bar_margin.right,
      height = 120 - bar_margin.top - bar_margin.bottom;

  function make_barch(data, svg) {
    var biggest_bar = data[0].count;

    // Add X axis
    var x = d3.scaleLinear()
      .domain([0, biggest_bar])
      .range([ 0, width]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(8))
      .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    var y = d3.scaleBand()
      .range([ 0, height ])
      .domain(data.map(function(d) { return d.artist; }))
      .padding(.1);

    svg.append("g")
      .call(d3.axisLeft(y))

    //Bars
    svg.selectAll("myRect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", x(0) )
      .attr("y", function(d) { return y(d.artist); })
      .attr("width", function(d) { return x(d.count); })
      .attr("height", y.bandwidth() )
      .attr("fill", "#69b3a2")
  }

  function add_barch(datum) {
    // based on https://www.d3-graph-gallery.com/graph/barplot_horizontal.html

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + bar_margin.left + bar_margin.right)
        .attr("height", height + bar_margin.top + bar_margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + bar_margin.left + "," + bar_margin.top + ")");

    make_barch(datum.freqs, svg);
  }

  $("#myBtn").click(function(){
    var text_input = $("#myInput").val();
    console.log('1');
    $.getJSON($SCRIPT_ROOT + '/_get_top5s', {
        words: text_input
    }, function(myfreqs) {
      console.log('2');
      $.getJSON($SCRIPT_ROOT + '/_get_histos', {
          words: text_input
      }, function(histos) {
        console.log('3');
        $.getJSON($SCRIPT_ROOT + '/_get_neighbors', {
            words: text_input
        }, function(neighbors) {
          console.log('4');
          for (var i=0; i < histos.length; i++) {
            $('#my_dataviz').append('<br/><span>' + histos[i].word + '</span><br/>');
            if (myfreqs[i].freqs.length > 0) {
              add_barch(myfreqs[i]);
              if (i < histos.length) {
                add_histo(histos[i].histo);
              }
              if (i < neighbors.length) {
                add_nns(neighbors[i]);
              }
            } else {
              $('#my_dataviz').append('<span style="color:red">no data</span><br/>');
            }
          }
        });
      });
    });
  });

  function add_histo(data) {
    // adapted from https://www.d3-graph-gallery.com/graph/line_cursor.html

    var xMin = 1973;
    var xMax = 2020;
    var yMin = 99999999;
    var yMax = 0;
    console.log(data);
    for (var i=0; i<data.length; i++) {
      count = data[i].count;
      if (count < yMin) {
        yMin = count;
      }
      if (count > yMax) {
        yMax = count;
      }
    }

    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 130, bottom: 40, left: 60},
        width = 400 - margin.left - margin.right,
        height = 120 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    function run() {

      // Add X axis --> it is a date format
      var x = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
          .tickFormat(d3.format("d"))
          .ticks(6));

      // Add Y axis
      var y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([ height, 0 ]);
      svg.append("g")
        .call(d3.axisLeft(y)
        .ticks(4));

      // This allows to find the closest X index of the mouse:
      var bisect = d3.bisector(function(d) { return d.year; }).left;

      // Create the circle that travels along the curve of chart
      var focus = svg
        .append('g')
        .append('circle')
          .style("fill", "none")
          .attr("stroke", "black")
          .attr('r', 8.5)
          .style("opacity", 0)

      // Create the text that travels along the curve of chart
      var focusText = svg
        .append('g')
        .append('text')
          .style("opacity", 0)
          .attr("text-anchor", "left")
          .attr("alignment-baseline", "middle")

      // Add the line
      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d.year) })
          .y(function(d) { return y(d.count) })
          )

      // Create a rect on top of the svg area: this rectangle recovers mouse position
      svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);


      // What happens when the mouse move -> show the annotations at the right positions.
      function mouseover() {
        focus.style("opacity", 1)
        focusText.style("opacity",1)
      }

      function mousemove() {
        // recover coordinate we need
        var x0 = x.invert(d3.mouse(this)[0]);
        var i = bisect(data, x0, 1);
        selectedData = data[i]
        focus
          .attr("cx", x(selectedData.year))
          .attr("cy", y(selectedData.count))
        focusText
          .html(selectedData.year + ": " + selectedData.count + " uses")
          .attr("x", x(selectedData.year)+15)
          .attr("y", y(selectedData.count))
        }
      function mouseout() {
        focus.style("opacity", 0)
        focusText.style("opacity", 0)
      }
    }
    run();

  }

  function add_nns(nn_data) {
    //  nn_data: {
    //      word,
    //      nn_coords: {
    //          target_coords: {x, y, z}
    //          neighbors: [
    //              {word, x, y, z}
    //          ]
    //      }
    //  }
    //https://bl.ocks.org/Niekes/1c15016ae5b5f11508f92852057136b5
    var origin = [150, 70], j = 10, scale = 8, scatter = [], yLine = [],
      xGrid = [], beta = 0, alpha = 0, key = function(d){ return d.id; },
      startAngle = Math.PI/4;
    var svg    = d3.select('#my_dataviz').append('svg')
      .attr("width", 300)
      .attr("height", 140)
      .call(d3.drag().on('drag',
      dragged).on('start', dragStart).on('end', dragEnd)).append('g');
    var color  = d3.scaleOrdinal(d3.schemeCategory20);
    var mx, my, mouseX, mouseY;

    // center data around target word
    for (var i=0; i < nn_data.nn_coords.neighbors.length; i++) {
      nn_data.nn_coords.neighbors[i].x -= nn_data.nn_coords.target_coords.x;
      nn_data.nn_coords.neighbors[i].y -= nn_data.nn_coords.target_coords.y;
      nn_data.nn_coords.neighbors[i].z -= nn_data.nn_coords.target_coords.z;
    }

    var grid3d = d3._3d()
        .shape('GRID', 20)
        .origin(origin)
        .rotateY( startAngle)
        .rotateX(-startAngle)
        .scale(scale);

    var point3d = d3._3d()
        .x(function(d){ return d.x; })
        .y(function(d){ return d.y; })
        .z(function(d){ return d.z; })
        .origin(origin)
        .rotateY( startAngle)
        .rotateX(-startAngle)
        .scale(scale);

    var yScale3d = d3._3d()
        .shape('LINE_STRIP')
        .origin(origin)
        .rotateY( startAngle)
        .rotateX(-startAngle)
        .scale(scale);

    function processData(data, tt){

        /* ----------- GRID ----------- */

        var xGrid = svg.selectAll('path.grid').data(data[0], key);

        xGrid
            .enter()
            .append('path')
            .attr('class', '_3d grid')
            .merge(xGrid)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.3)
            .attr('fill', function(d){ return d.ccw ? 'lightgrey' : '#717171'; })
            .attr('fill-opacity', 0.9)
            .attr('d', grid3d.draw);

        xGrid.exit().remove();

        /* ----------- POINTS ----------- */

        var points = svg.selectAll('circle').data(data[1], key);

        points
            .enter()
            .append('circle')
            .attr('class', '_3d')
            .attr('opacity', 0)
            .attr('cx', posPointX)
            .attr('cy', posPointY)
            .merge(points)
            .transition().duration(tt)
            .attr('r', 3)
            .attr('stroke', function(d){ return d3.color(color(d.id)).darker(3); })
            .attr('fill', function(d){ return color(d.id); })
            .attr('opacity', 1)
            .attr('cx', posPointX)
            .attr('cy', posPointY);

        points.exit().remove();

        var pointText = svg.selectAll('text.pointText').data(data[1]);

        pointText
          .data(data[1]).enter()
          .append("text")
            .attr('class', '_3d pointText')
        .merge(pointText)
          .attr("x", function(d) {return d.projected.x})
            .attr("y", function(d) {return d.projected.y})
          .text(function(d) {return d.label})
            .attr("font-size", function(d){ return (14 + (d.rotated.z)/ 3) + "px"});

        pointText.exit().remove();

        /* ----------- y-Scale ----------- */

        var yScale = svg.selectAll('path.yScale').data(data[2]);

        yScale
            .enter()
            .append('path')
            .attr('class', '_3d yScale')
            .merge(yScale)
            .attr('stroke', 'black')
            .attr('stroke-width', .5)
            .attr('d', yScale3d.draw);

        yScale.exit().remove();

         /* ----------- y-Scale Text ----------- */

        var yText = svg.selectAll('text.yText').data(data[2][0]);

        yText
            .enter()
            .append('text')
            .attr('class', '_3d yText')
            .attr('dx', '.3em')
            .merge(yText)
            .each(function(d){
                d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
            })
            .attr('x', function(d){ return d.projected.x; })
            .attr('y', function(d){ return d.projected.y; })
            .text(function(d){ return d[1] <= 0 ? d[1] : ''; });

        yText.exit().remove();

        svg.selectAll('._3d').sort(d3._3d().sort);
    }

    function posPointX(d){
        return d.projected.x;
    }

    function posPointY(d){
        return d.projected.y;
    }

    function init(){
        var cnt = 0;
        xGrid = [], scatter = [], yLine = [];
        for(var z = -j; z < j; z++){
            for(var x = -j; x < j; x++){
                xGrid.push([x, 1, z]);
            }
        }

        for (var i=0; i<10; i++)
            scatter.push({x: nn_data.nn_coords.neighbors[i].x,
                y: nn_data.nn_coords.neighbors[i].y,
                z: nn_data.nn_coords.neighbors[i].z,
                id: 'point_' + i++});

        d3.range(-1, 11, 1).forEach(function(d){ yLine.push([-j, -d, -j]); });

        var data = [
            grid3d(xGrid),
            point3d(scatter),
            yScale3d([yLine])
        ];

        //XXX XXX what's with the 5 vs ten thing?  i make ten scatter points
        // but then data[1] length equals five
        for (var i=0; i<5; i++) {
          data[1][i]["label"] = nn_data.nn_coords.neighbors[i].word;
        }
        processData(data, 1000);
    }

    function dragStart(){
        mx = d3.event.x;
        my = d3.event.y;
    }

    function dragged(){
        mouseX = mouseX || 0;
        mouseY = mouseY || 0;
        beta   = (d3.event.x - mx + mouseX) * Math.PI / 230 ;
        alpha  = (d3.event.y - my + mouseY) * Math.PI / 230  * (-1);
        var data = [
             grid3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(xGrid),
            point3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(scatter),
            yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([yLine]),
        ];
        processData(data, 0);
    }

    function dragEnd(){
        mouseX = d3.event.x - mx + mouseX;
        mouseY = d3.event.y - my + mouseY;
    }

    init();
  }
})
