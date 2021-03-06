var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)-125,
    height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)-250,
    radius = (Math.min(width, height) / 2);

		var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.sqrt()
    .range([0, radius]);

var color = d3.scale.category10();

var coolor = //d3.scale.category20();
{
  "Static Analysis of Android apps: A systematic literature review":"#e0e0e0",
  "Data Leaks":"#3366cc",
  "Cryptography":"#dc3912",
  "Permission Misuse":"#ff9900",
  "Vulnerabilities":"#f9e784",
  "Code Verification":"#990099",
  "Energy Consumption":"#0099c6",
  "Clone Detection":"#dd4477",
  "Test Case Generation":"#66aa00",
  "JIMPLE":"#de6449",
  "WALA_IR":"#316395",
  "DEX_ASSEMBLER":"#994499",
  "SMALI":"#22aa99",
  "JAVA_CLASS":"#aaaa11",
  "OTHER":"#6633cc"
}

var svg = d3.select("#mySVG")
    .attr("width", width)
    .attr("height", function(){return height+10})
  .append("g")
    .attr("transform", "translate(" + width/2 + "," + ((height / 2)+5) + ")");

var partition = d3.layout.partition()
    .sort(null)
    .value(function(d) { return d.size; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

// Keep track of the node that is currently being displayed as the root.
var node;

d3.json("data.json", function(error, root) {
  console.log(root);
  node = root;
  var path = svg.datum(root).selectAll("path")
      .data(partition.nodes)
    .enter().append("path")
      .attr("d", arc)
      .style("fill", function(d) { return coolor[d.name]})//(d.children)?color(d.name):coolor(d.name) })
      .style('stroke', 'white')
      .style('stroke-width', 3)
      .on("click", click)
      .on("mouseover", hover)
      .each(stash);

  d3.selectAll(".second").on("change", function change() {
    var value = this.value === "size"
        ? function(d) { return d.size; }
        : function() { return 1; };

    path
        .data(partition.value(value).nodes)
      .transition()
        .duration(1000)
        .attrTween("d", arcTweenData);
  });

  function click(d) {
    node = d;
    path.transition()
      .duration(1000)
      .attrTween("d", arcTweenZoom(d));
  }
  function deshover(){
  	$("#ir").html("");
      $("#set").html("");
      $("#irAmount").html("");
      $("#setAmount").html("");
  }

  function hover(d) {
    if(d.parent===undefined){
      $("#ir").html("");
      $("#set").html("");
      $("#irAmount").html("");
      $("#setAmount").html("");
    }
    else if(d.parent !== undefined && d.parent.parent === undefined){
      $("#ir").html(d.name);
      $("#set").html("");
      $("#irAmount").html(function(){return d.value+"/"+d.parent.value+" - "+((d.value*100)/d.parent.value).toString().substring(0,4)+"%"});
      $("#setAmount").html("");
    }
    else {
      $("#ir").html(d.parent.name);
      $("#set").html(d.name);
      $("#irAmount").html(function(){return d.parent.value+"/"+d.parent.parent.value+" - "+((d.parent.value*100)/d.parent.parent.value).toString().substring(0,4)+"%"});
      $("#setAmount").html(function(){return d.value+"/"+d.parent.parent.value+" - "+((d.value*100)/d.parent.parent.value).toString().substring(0,4)+"%"});
    }
  }
});

d3.select(self.frameElement).style("height", height + "px");

// Setup for switching data: stash the old values for transition.
function stash(d) {
  d.x0 = d.x;
  d.dx0 = d.dx;
}

// When switching data: interpolate the arcs in data space.
function arcTweenData(a, i) {
  var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  function tween(t) {
    var b = oi(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc(b);
  }
  if (i == 0) {
   // If we are on the first arc, adjust the x domain to match the root node
   // at the current zoom level. (We only need to do this once.)
    var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
    return function(t) {
      x.domain(xd(t));
      return tween(t);
    };
  } else {
    return tween;
  }
}

// When zooming: interpolate the scales.
function arcTweenZoom(d) {
  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, 1]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
  return function(d, i) {
    return i
        ? function(t) { return arc(d); }
        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}
