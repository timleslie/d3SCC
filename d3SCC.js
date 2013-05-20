function set_stack_label(svg, stack_x0, stack_y0, stack_w, label, color_idx) {

    svg.append("g").attr("id", "label" + label).append("text")
	.text(label)
	.attr("x", stack_x0 + stack_w/2)
	.attr("y", stack_y0 + 30)
	.attr("text-anchor", "middle")
        .attr("stroke", colors[color_idx]);
}

function node_text(node) { 
    if (node.link === undefined) {
	return node.text; 
    } else {
	return node.text + ": " + node.link;
    }
}

///////// GRAPH DRAWING

var colors = []
var color = d3.scale.category10();
for (var i=0;i < 10; i++) {
    colors.push(color(i));
}


function draw_links(data, path_g) {

    path_g.selectAll("path")
	.data(data.links)
	.enter().append("svg:path")
	.attr("class", "link")
	.attr("stroke-width", "2px")
	.attr("stroke", "#000")
	.attr("marker-start", function(d) { if (d.bidirectional) return "url(#start)"; } )
	.attr("marker-end", "url(#end)")
	.attr("d", function(d) {
            return "M" + 
		data.nodes[d.nodes[0]].x + "," + 
		data.nodes[d.nodes[0]].y + "L" + 
		data.nodes[d.nodes[1]].x + "," + 
		data.nodes[d.nodes[1]].y;
	});
}

function draw_nodes(data, circle_g) {
    var node = circle_g.selectAll("circle")
	.data(data.nodes);

    // Default circle state:
    node.enter().append("circle")
	.attr("r", 20)
	.attr("cx", function(d) { return d.x; })
	.attr("cy", function(d) { return d.y; })
        .attr("fill", "#FFF")
	.attr("stroke", colors[7]);
	
    // update
    node.transition().duration(1000)
	.attr("fill", function(d, i) {
	    var idx = i;
	    if (data.nodes[i].link >= data.label) {
		return colors[9];
	    } else if ( data.stack.indexOf(idx) >= 0) {
		return colors[6];
	    } else if (data.DFS.indexOf(idx) >= 0) {
		return colors[2];
	    } else if (data.nodes[i].link === undefined) {
		return colors[7];
	    } else {
		return colors[4];
	    }
	});
}

function draw_labels(data, label_g) {
    // Labels
    var label = label_g.selectAll("text")
	.data(data.nodes);

    // Update
    label.transition().delay(900).text( node_text );

    // Enter
    label.enter().append("text")
	.attr("text-anchor", "middle")
	.attr("x", function(d) { return d.x; } )
	.attr("y", function(d) { return d.y + 5; } )
        .text(node_text);
}

function draw_SCCs(data, SCC_g) {
    SCC_g.append("g").selectAll("rect")
	.data(data.SCCs)
        .enter()
	.append("rect")
	.attr("class", "SCC")
	.attr("x", function(d) { return d.x; } )
	.attr("y", function(d) { return d.y; } )
	.attr("width", function(d) { return d.w; } )
	.attr("height", function(d) { return d.h; } )
	.attr("rx", 10)
	.attr("ry", 10)
	.attr("stroke-opacity", 0)
	.attr("stroke", "#FFF");

    SCC_g.selectAll("rect")
        .data(data.SCCs)
        .transition().duration(1000)
        .attr("stroke-opacity", function(d) { return d.visible ? 1 : 0; } )
        .attr("stroke", function(d) { return d.visible ? "#000" : "#FFF"; } );
}

function draw_graph(data, path_g, circle_g, label_g, SCC_g) {
    draw_links(data, path_g);
    draw_nodes(data, circle_g);
    draw_labels(data, label_g);
    draw_SCCs(data, SCC_g);
}

function text_y(y, box_h) {
    return y + 0.5*box_h + 4;
}


function box_y(i, stack_y0, box_h) { return stack_y0 - box_h*(i + 1); }

function draw_DFS(data, DFS_g, stack_x0, box_h, box_w, hot_seat, stack_y0) {

    // Boxes
    var stack_rect = DFS_g.selectAll("rect")
	.data(data.DFS, function(d) { return d; });

    // Boxes are created in place and fade in
    stack_rect.enter().append("rect")
	.attr("fill", "#FFF")
	.attr("stroke", "#000")
	.attr("height", box_h)
	.attr("width", box_w)
	.attr("x", function(d, i) { return stack_x0; } )
	.attr("y", function(d, i) { return box_y(i, stack_y0, box_h) } )
        .attr("stroke", "#FFF")
        .transition().duration(1000)
        .attr("stroke", "#000");

    // On exit, they move to the hot seat
    stack_rect.exit()
	.transition().duration(1000)
        .attr("x", hot_seat.x)
        .attr("y", hot_seat.y)
  	.remove();

    // Text
    var stack_text = DFS_g.selectAll("text")
	.data(data.DFS);

    // Text slides in from the nodes
    stack_text.enter().append("text")
	.attr("text-anchor", "middle")
	.attr("x", function(d) { return data.nodes[d].x; } )
        .attr("y", function(d) { return data.nodes[d].y + 5; } )
	.transition().duration(1000)
	.attr("x", stack_x0 + box_w/2)
  	.attr("y", function(d, i) { return text_y(box_y(i, stack_y0, box_h), box_h); } )

    // If we have flying text coming in, delay until it has arrived
    if (data.flying_index.length > 0) 
	stack_text.transition().delay(1000).text(function(d) { return node_text(data.nodes[d]); });
    else
	stack_text.text(function(d) { return node_text(data.nodes[d]); });

    // On exit, either fade out or move to the hot seat
    stack_text.exit()
	.transition().duration(1000)
	.attr("x", hot_seat.text_x)
	.attr("y", hot_seat.text_y)
	.remove();
}

function draw_stack(data, stack_data, stack_x0, id, g, stack_x0_other, box_h, box_w, hot_seat, stack_y0) {
    var N = data.nodes.length;

    // Boxes
    var stack_rect = g.selectAll("rect")
	.data(stack_data, function(d) { return d; });

    // Boxes slide in from the hotseat
    stack_rect.enter().append("rect").attr("class", "stack")
	.attr("height", box_h)
	.attr("width", box_w)
        .attr("stroke", "#000")
	.attr("x", function(d) { return hot_seat.x; } )
	.attr("y", function(d) { return hot_seat.y } )
        .transition().duration(1000)
	.attr("x", function(d, i) { return stack_x0; } )
	.attr("y", function(d, i) { return box_y(i, stack_y0, box_h) } )

    // On exit, fade out
    stack_rect.exit()
	.transition().duration(1000)
	.attr("stroke", "#FFF").remove();

    // Text
    var stack_text = g.selectAll("text")
	.data(stack_data);

    // Text slides in from the hot seat
    stack_text.enter().append("text")
	.attr("text-anchor", "middle")
	.attr("x", hot_seat.text_x)
	.attr("y", hot_seat.text_y)
	.transition().duration(1000)
	.attr("x", stack_x0 + box_w/2)
  	.attr("y", function(d, i) { return text_y(box_y(i, stack_y0, box_h), box_h); } )

    // Update - if we're flying in data, give it time to arrive
    if (data.flying_label.length > 0) 
	stack_text.transition().delay(1000).text(function(d) { return node_text(data.nodes[d]); });
    else
	stack_text.text(function(d) { return node_text(data.nodes[d]); });

    // On exit, fade out
    stack_text.exit()
	.transition().duration(1000)
        .attr("stroke", "#FFF")
	.remove();
}

function draw_hotseat(data, hotseat_g, box_h, box_w, hot_seat) {

    if (data.need_to_find_min >= 0) {
	data = [data.nodes[data.need_to_find_min]];
    } else if (data.need_to_push_stack >= 0) {
	data = [data.nodes[data.need_to_push_stack]];
    } else {
	// Hotseat is empty
	data = [];
    }
    
    var hot_rects = hotseat_g.selectAll("rect").
	data(data);

    hot_rects.enter().append("rect")
        .attr("height", box_h)
        .attr("width", box_w)
        .attr("x", hot_seat.x)
        .attr("y", hot_seat.y)
        .attr("fill", "#FFF")
        .attr("stroke", "#FFF")
        .transition().delay(1000).duration(1e-6)
        .attr("stroke", "#000")

    hot_rects.exit().remove()

    var hot_text = hotseat_g.selectAll("text").
	data(data);

    hot_text.enter().append("text")
	.attr("text-anchor", "middle")
        .attr("x", hot_seat.text_x)
        .attr("y", hot_seat.text_y);

    hot_text.transition().delay(1000).duration(1e-6)
        .text( node_text );

    hot_text.exit().remove();
}

function draw_index(data, index_g) {
    var index_text = index_g.selectAll("text")
        .data([data.index]);

    index_text.enter().append("text")
        .attr("x", 20)
        .attr("y", 20)
	
    // Update
    index_text.text( function(d) { return "Index: " + d; } );
}

function draw_cur_label(data, cur_label_g) {
    var cur_label_text = cur_label_g.selectAll("text")
        .data([data.label]);

    cur_label_text.enter().append("text")
        .attr("x", 20)
        .attr("y", 40);
    // Update
    cur_label_text.text( function(d) { return "Label: " + d; } );
}

function draw_msg(data, msg_g) {
    var msg_text = msg_g.selectAll("text")
        .data([data.msg])

    msg_text.enter().append("text")
        .attr("x", 120)
        .attr("y", 470);
    msg_text.text( function(d) { return d; } ).attr("font-weight", "bold");
}

function draw_flying(data, flying_g, stack_y0, box_h) {
    if (data.flying_index.length > 0) 
	data.flying_index.push(data.flying_index[0]);
    var flying_text = flying_g.selectAll("text")
        .data(data.flying_index)
	.enter().append("text")
        .attr("x", 60)
        .attr("y", 20)
        .text( function(d) { return data.index - 1; } )
        .transition().duration(1000)
        .attr("x", function(d, i) { if (i == 0) { return data.nodes[d].x; } else { return 40; }})
        .attr("y", function(d, i) { if (i == 0) { return data.nodes[d].y; } else { return text_y(box_y(data.DFS.length - 1, stack_y0, box_h), box_h); } } )
        .remove()
}

function draw_flying_min(data, flying_min_g, hot_seat) {

    var flying_min_text = flying_min_g.selectAll("text")
        .data(data.flying_min)

    flying_min_text.enter().append("text")
        .attr("x", function(d) { return data.nodes[d].x; } )
        .attr("y", function(d) { return data.nodes[d].y; } )
        .text( function(d) { return data.nodes[d].link; } )
        .transition().duration(1000)
        .attr("x", hot_seat.text_x + 4)
        .attr("y", hot_seat.text_y)
        .remove()
}

function draw_flying_label(data, flying_label_a_g, flying_label_b_g, stack_x, box_w, box_h, stack_y0) {

    var len = data.flying_label.length;
    var flying_nodes = [];
    for (var i=0; i < data.flying_label.length; i++) {
	flying_nodes.push(data.nodes[data.stack[data.flying_label[i]]]);
    }
    var label_x = 60;
    var label_y = 40;

    // Flying label from top left to the stack
    var flying_label_a_text = flying_label_a_g.selectAll("text")
        .data(data.flying_label)

    flying_label_a_text.enter().append("text")
        .attr("x", label_x)
        .attr("y", label_y)
        .text(data.label)
        .transition().duration(1000)
	.attr("x", stack_x + box_w/2 + 2) // Slight offset to not land on top of the current label
  	.attr("y", function(d, i) { return text_y(box_y(d, stack_y0, box_h), box_h); } )
        .remove();

    // Flying label from top left to the graph
    var flying_label_b_text = flying_label_b_g.selectAll("text")
        .data(flying_nodes)

    flying_label_b_text.enter().append("text")
        .attr("x", label_x)
        .attr("y", label_y)
        .text(data.label)
        .transition().duration(1000)
	.attr("x", function(d) { return d.x; } )
  	.attr("y", function(d) { return d.y; } )
        .remove();
}

function draw_steps(data, steps_g) {
    var steps_text = steps_g.selectAll("text")
	.data([data.steps]);

    steps_text.enter().append("text")
        .attr("x", 460)
        .attr("y", 440);

    steps_text.text(function(d) { return "Step " + d + "/60"; });
}

function draw_all(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g) {
    draw_graph(data, path_g, circle_g, label_g, SCC_g);
    draw_stack(data, data.stack, stack_x, "stack", stack_g, DFS_x, box_h, box_w, hot_seat, stack_y0);
    draw_DFS(data, DFS_g, DFS_x, box_h, box_w, hot_seat, stack_y0);
    draw_hotseat(data, hotseat_g, box_h, box_w, hot_seat);
    draw_index(data, index_g);
    draw_cur_label(data, cur_label_g);
    draw_msg(data, msg_g);
    draw_flying(data, flying_g, stack_y0, box_h);
    draw_flying_min(data, flying_min_g, hot_seat);
    draw_flying_label(data, flying_label_a_g, flying_label_b_g, stack_x, box_w, box_h, stack_y0);
    draw_steps(data, steps_g);
}

function update_and_draw(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g) {
    process_node(data);
    draw_all(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g);
}

function init_markers(svg) {

    // build the arrow.
    svg.append("svg:defs").selectAll("marker")
	.data(["end"])      // Different link/path types can be defined here
	.enter().append("svg:marker")    // This section adds in the arrows
	.attr("id", String)
        .attr("strokeWidth", 1)
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", 25)
	.attr("refY", 0)
	.attr("markerWidth", 6)
	.attr("markerHeight", 6)
	.attr("orient", "auto")
	.append("svg:path")
	.attr("d", "M0,-5L10,0L0,5");

    svg.append("svg:defs").selectAll("marker")
	.data(["start"])      // Different link/path types can be defined here
	.enter().append("svg:marker")    // This section adds in the arrows
	.attr("id", String)
        .attr("strokeWidth", 1)
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", -15)
	.attr("refY", 0)
	.attr("markerWidth", 6)
	.attr("markerHeight", 6)
	.attr("orient", "auto")
	.append("svg:path")
	.attr('d', 'M10,-5L0,0L10,5')
	.attr('fill', '#000');
}


function draw_SCC_animation(target) {

    var data = load_data();

    // Image Dimensions
    var w = 581;
    var h = 500;
    var N = data.nodes.length;
    var stack_y0 = (h - 100) - 30;
    var box_h = stack_y0/(N + 1);
    var box_w = 37;
    var circle_r = 20;

    // Stack locations
    var DFS_x = 20;
    var stack_x = 100;

    // Hotseat location
    var hot_seat = {x: 100, y: 100};
    hot_seat.text_x = hot_seat.x + 18
    hot_seat.text_y = text_y(hot_seat.y, box_h)

    // The <svg> tag
    var svg = d3.select(target).append("svg")
	.attr("width", w)
	.attr("height", h)
        .attr("style", "display: block; margin: 0 auto;");

    // The main dynamic groups
    var hotseat_g = svg.append("g").attr("id", "hotseat");
    var stack_g = svg.append("g").attr("id", "stack");
    var DFS_g = svg.append("g").attr("id", "DFS");
    var index_g = svg.append("g").attr("id", "index");
    var cur_label_g = svg.append("g").attr("id", "cur_label");
    var msg_g = svg.append("g").attr("id", "msg");
    var flying_g = svg.append("g").attr("id", "flying");
    var flying_min_g = svg.append("g").attr("id", "flying_min");
    var flying_label_a_g = svg.append("g").attr("id", "flying_label_a");
    var flying_label_b_g = svg.append("g").attr("id", "flying_label_b");

    var button_g = svg.append("g").attr("id", "button");
    button_g.append("text").attr("id", "step_text")
        .attr("x", 20 + 40)
        .attr("y", 443 + 15)
	.attr("text-anchor", "middle")
        .text("step");
    button_g.append("text").attr("id", "reset_text")
        .attr("x", 20 + 40)
        .attr("y", 473 + 15)
	.attr("text-anchor", "middle")
        .text("reset");
    button_g.append("rect").attr("id", "step")
        .attr("x", 20)
        .attr("y", 443)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("height", 20)
        .attr("width", 80)
        .attr("stroke", "#000")
        .attr("fill", "#FFF")
        .attr("fill-opacity", 0)
        .on("click", function() { update_and_draw(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g); });
    button_g.append("rect").attr("id", "reset")
        .attr("x", 20)
        .attr("y", 473)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("height", 20)
        .attr("width", 80)
        .attr("stroke", "#000")
        .attr("stroke-width", "2px")
        .attr("fill", "#FFF")
        .attr("fill-opacity", 0)
        .on("click", function() { data = load_data(); draw_all(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g);});

    init_markers(svg);

    // Graph
    var graph_g = svg.append("g").attr("id", "graph");
    var path_g = graph_g.append("g").attr("id", "paths");
    
    var circle_g = graph_g.append("g").attr("id", "circles");
    var label_g = graph_g.append("g").attr("id", "labels");

    var SCC_g = svg.append("g").attr("id", "SCC");

    // The static content
    set_stack_label(svg, stack_x, stack_y0, box_w, "backtracked", 6);
    set_stack_label(svg, DFS_x, stack_y0, box_w, "DFS", 2);


    var steps_g = svg.append("g").attr("id", "steps");
    

    draw_all(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g);

}

function draw_lines(lines, g) {
    g.selectAll("line").data(lines).enter().append("line")
        .attr("x1", function(d) { return d.x1; })
        .attr("y1", function(d) { return d.y1; })
        .attr("x2", function(d) { return d.x2; })
        .attr("y2", function(d) { return d.y2; })
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
	.attr("marker-start", function(d) { if (d.bidirectional) return "url(#start)"; } )
	.attr("marker-end", "url(#end)")
}

function draw_circles(circles, g) {
    g.selectAll("circle").data(circles).enter().append("circle")
        .attr("cx", function(d) { return d.cx; })
        .attr("cy", function(d) { return d.cy; })
        .attr("r", function(d) { return d.r; })
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#FFF")
        .attr("fill-opacity", 1)
}

function draw_rects(rects, g) {
    g.selectAll("rect").data(rects).enter().append("rect")
        .attr("x", function(d) { return d.x; } )
        .attr("y", function(d) { return d.y; } )
        .attr("width", function(d) { return d.width; } )
        .attr("height", function(d) { return d.height; } )
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("stroke", "#000")
        .attr("stroke-width", 5)
        .attr("fill", "#FFF")
        .attr("fill-opacity", 0)
        
}

function draw_text(texts, g) {
    g.selectAll("text").data(texts).enter().append("text")
        .attr("x", function(d) { return d.x; } )
        .attr("y", function(d) { return d.y + 5; } )
	.attr("text-anchor", "middle")
        .text(function(d) { return d.text; } )
}

function draw_simple_graphs(target) {
    var w = 500, h = 150;
    var svg = d3.select(target).append("svg")
	.attr("width", w)
	.attr("height", h)
        .attr("style", "display: block; margin: 0 auto;");

    init_markers(svg);

    draw_lines([{x1: 50, x2: 200, y1: 50, y2: 50, bidirectional: false},
		{x1: 300, x2: 450, y1: 50, y2: 50, bidirectional: true},
	       ], svg);
    draw_circles([{cx: 50, cy: 50, r: 20},
		  {cx: 200, cy: 50, r: 20},
		  {cx: 300, cy: 50, r: 20},
		  {cx: 450, cy: 50, r: 20},
		 ], svg);
    draw_text([{x: 50, y: 50, text: "A"},
	       {x: 200, y: 50, text: "B"},
	       {x: 125, y: 100, text: "Weakly connected"},
	       {x: 300, y: 50, text: "A"},
	       {x: 450, y: 50, text: "B"},
	       {x: 375, y: 100, text: "Strongly connected"},
	      ], svg)
}

function draw_ABC_graph(target) {
    var w = 260, h = 250;
    var svg = d3.select(target).append("svg")
	.attr("width", w)
	.attr("height", h)
        .attr("style", "display: block; margin: 0 auto;");

    init_markers(svg)

    draw_lines([{x1: w/2 - 80, x2: w/2, y1: 50, y2: 150, bidirectional: true},
		{x1: w/2 + 80, x2: w/2, y1: 50, y2: 150, bidirectional: true},
	       ], svg);
    draw_circles([{cx: w/2 - 80, cy: 50, r: 20},
		  {cx: w/2 + 80, cy: 50, r: 20},
		  {cx: w/2, cy: 150, r: 20}
		 ], svg);
    draw_text([{x: w/2 - 80, y: 50, text: "B"},
	       {x: w/2 + 80, y: 50, text: "C"},
	       {x: w/2, y: 150, text: "A"},
	       {x: w/2, y: 200, text: "A is strongly connect to both B and C"},
	       {x: w/2, y: 220, text: "so B and C are also strongly connected"},
	      ], svg)

}

function draw_SCC_graph(target) {
    var w = 350, h = 230;
    var svg = d3.select(target).append("svg")
	.attr("width", w)
	.attr("height", h)
        .attr("style", "display: block; margin: 0 auto;")

    init_markers(svg)

    draw_lines([{x1: 50, y1: 50, x2: 50, y2: 150, bidirectional: false},
		{x1: 50, y1: 150, x2: 125, y2: 100, bidirectional: false},
		{x1: 125, y1: 100, x2: 50, y2: 50, bidirectional: false},
		{x1: 125, y1: 100, x2: 225, y2: 100, bidirectional: false},
		{x1: 225, y1: 100, x2: 300, y2: 50, bidirectional: false},
		{x1: 300, y1: 50, x2: 300, y2: 150, bidirectional: false},
		{x1: 300, y1: 150, x2: 225, y2: 100, bidirectional: false},
	       ], svg);
    draw_circles([{cx: 50, cy: 50, r: 20},
		  {cx: 50, cy: 150, r: 20},
		  {cx: 125, cy: 100, r: 20},
		  {cx: 225, cy: 100, r: 20},
		  {cx: 300, cy: 50, r: 20},
		  {cx: 300, cy: 150, r: 20},
		 ], svg);

    draw_rects([{x: 20, y: 20, height: 160, width: 140},
		{x: 190, y: 20, height: 160, width: 140},
	       ], svg);
    draw_text([{x: 175, y: 200, text: "A graph split into strongly connected components"},
	      ], svg);
}

function main() {
    draw_SCC_animation("#animation");
    draw_simple_graphs("#strong_weak");
    draw_ABC_graph("#ABC");
    draw_SCC_graph("#split_up");
}

//main();
