var width = 1024,
    height = 768,
    root;

var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

var formatedDataList = [];

d3.json("scripts/data.json", function(error, json) {
  if (error) throw error;

  root = json;
  update();
});

function update() {
  var nodes = flatten(root);
  var links = d3.layout.tree().links(nodes);
  var MinMaxNode = d3.extent(nodes, function(d) { return d.size; });
  var bubbleScale = d3.scale.linear().domain(MinMaxNode).range([30, 320]);
  var linkScale = d3.scale.linear().domain(MinMaxNode).range([110,420]);

  // Restart the force layout.
  force
      .nodes(nodes)
      .links(links)
      .linkStrength(1)
      .friction(0.5)
      .linkDistance(function(d){ return linkScale(d.target.size); })
      .charge(-1000)
      .theta(0.1)
      .alpha(0.1)
      .start();

  // Update the links…
  link = link.data(links, function(d) { return d.target.id; });

  // Exit any old links.
  link.exit().remove();

  // Enter any new links.
  link.enter().insert("line", ".node")
      .attr("class", function(d){
        return d.source.name == "flare" ? "" : "link";
      })
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  // Update the nodes…
  node = node.data(nodes, function(d) { return d.id; });

  // Exit any old nodes.
  node.exit().remove();

  // Enter any new nodes.
  node.enter().append("circle")
      .attr("class", function(d){
        formatedDataList.push(d);
        return d.children || d._children ? "node" : "leaf";
      })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { 
        if(d.type == "root") return 60;
        return bubbleScale(d.size) || 0; 
      })
      .style("fill", color)
      .on("click", click)
      .call(force.drag);

  node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });



}

//
// centers all of the node and aligns them respectully
//

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return d._children ? "#BECDD5" : d.children ? "#BECDD5" : "white";
}

// Toggle children on click.
function click(d) {
  if (!d3.event.defaultPrevented) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update();
  }
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  
  return nodes;
}

