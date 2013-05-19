function set_stack_label(svg, stack_x0, stack_y0, stack_w, label, h) {

    svg.append("g").attr("id", "label").append("text")
	.text(label)
	.attr("x", stack_x0 + stack_w/2)
	.attr("y", (h + stack_y0)/2 + 5)
	.attr("text-anchor", "middle")
}

function node_text(node) { 
    if (node.link === undefined) {
	return node.text; 
    } else {
	return node.text + ": " + node.link;
    }
}

///////// GRAPH DRAWING

var colors = d3.scale.category10();

function draw_links(data, path_g) {

    path_g.selectAll("path")
	.data(data.links)
	.enter().append("svg:path")
	.attr("class", "link")
	.attr("stroke-width", "2px")
	.attr("stroke", "#000")
	.attr("marker-end", "url(#end)")
	.attr("d", function(d) {
            return "M" + 
		data.nodes[d.nodes[0]].x + "," + 
		data.nodes[d.nodes[0]].y + "L" + 
		data.nodes[d.nodes[1]].x + "," + 
		data.nodes[d.nodes[1]].y;
	});

    
    //var link = line_g.selectAll("line")
//	.data(data.links);

    // Create
  //  link.enter().append("line")
//	.attr("x1", function(d) { return data.nodes[d.nodes[0]].x; })
//	.attr("y1", function(d) { return data.nodes[d.nodes[0]].y; })
//	.attr("x2", function(d) { return data.nodes[d.nodes[1]].x; })
//	.attr("y2", function(d) { return data.nodes[d.nodes[1]].y; });
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
	.attr("stroke", colors(7));
	
    // update
    node.transition().duration(1000)
	.attr("fill", function(d, i) {
	    var idx = i;
	    if ( data.stack.indexOf(idx) >= 0) {
		return colors(0);
	    } else if (data.DFS.indexOf(idx) >= 0) {
		return colors(1);
	    } else if (data.nodes[i].link === undefined) {
		return colors(2);
	    } else if (data.nodes[i].link > data.label) {
		return colors(9);
	    } else {
		return colors(7);
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
        .attr("x", function(d, i) { if (i == 0) { return data.nodes[d].x; } else { return 31; }})
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
        .attr("x", hot_seat.text_x)
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
	.attr("x", stack_x + box_w/2 + 1) // Slight offset to not land on top of the current label
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

function draw_all(path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0) {
    draw_graph(data, path_g, circle_g, label_g, SCC_g);
    draw_stack(data, data.stack, stack_x, "stack", stack_g, DFS_x, box_h, box_w, hot_seat, stack_y0);
    draw_DFS(data, DFS_g, DFS_x, box_h, box_w, hot_seat, stack_y0);
    draw_hotseat(data, hotseat_g, box_h, box_w, hot_seat);
    draw_index(data, index_g);
    draw_cur_label(data, cur_label_g);
    draw_flying(data, flying_g, stack_y0, box_h);
    draw_flying_min(data, flying_min_g, hot_seat);
    draw_flying_label(data, flying_label_a_g, flying_label_b_g, stack_x, box_w, box_h, stack_y0);
}

function update_and_draw(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0) {
    process_node(data);
    draw_all(path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0);
}

function main() {

    // Image Dimensions
    var w = 600;
    var h = 400;
    var N = data.nodes.length;
    var stack_y0 = h - 30;
    var box_h = stack_y0/(N + 1);
    var box_w = 35;
    var circle_r = 20;

    // Stack locations
    var DFS_x = 10;
    var stack_x = 50;

    // Hotseat location
    var hot_seat = {x: 100, y: 100};
    hot_seat.text_x = hot_seat.x + 18
    hot_seat.text_y = text_y(hot_seat.y, box_h)

    // The <svg> tag
    var svg = d3.select("body").append("svg")
	.attr("width", w)
	.attr("height", h);


    // The main dynamic groups
    var hotseat_g = svg.append("g").attr("id", "hotseat");
    var stack_g = svg.append("g").attr("id", "stack");
    var DFS_g = svg.append("g").attr("id", "DFS");
    var index_g = svg.append("g").attr("id", "index");
    var cur_label_g = svg.append("g").attr("id", "cur_label");
    var flying_g = svg.append("g").attr("id", "flying");
    var flying_min_g = svg.append("g").attr("id", "flying_min");
    var flying_label_a_g = svg.append("g").attr("id", "flying_label_a");
    var flying_label_b_g = svg.append("g").attr("id", "flying_label_b");


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


    // Graph
    var graph_g = svg.append("g").attr("id", "graph");
    //var line_g = graph_g.append("g").attr("id", "lines");
    var path_g = graph_g.append("g").attr("id", "paths");
    
    var circle_g = graph_g.append("g").attr("id", "circles");
    var label_g = graph_g.append("g").attr("id", "labels");

    var SCC_g = svg.append("g").attr("id", "SCC");

    // The static content
    set_stack_label(svg, DFS_x, stack_y0, box_w, "DFS", h);
    set_stack_label(svg, stack_x, stack_y0, box_w, "stack", h);

    draw_all(path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0);

    setInterval(function() {
	update_and_draw(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0);
    }, 1500);
}

main();
