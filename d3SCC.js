///////// GRAPH DRAWING
var i;
var colors = [];
var color = d3.scale.category10();
for (i = 0; i < 10; i++) {
    colors.push(color(i));
}


function set_stack_label(svg, stack_x0, stack_y0, stack_w, label, color_idx) {

    svg.append("g").attr("id", "label" + label).append("text")
        .text(label)
        .attr("x", stack_x0 + stack_w / 2)
        .attr("y", stack_y0 + 30)
        .attr("text-anchor", "middle")
        .attr("stroke", colors[color_idx]);
}

function node_text(node) {
    var ret;
    if (node.link === undefined) {
        ret = node.text;
    } else {
        ret = node.text + ": " + node.link;
    }
    return ret;
}

function draw_links(data, path_g) {

    path_g.selectAll("path")
        .data(data.links)
        .enter().append("svg:path")
        .attr("class", "link")
        .attr("stroke-width", "2px")
        .attr("stroke", "#000")
        .attr("marker-start", function (d) {
            if (d.bidirectional) {
                return "url(#start)";
            }
        })
        .attr("marker-end", "url(#end)")
        .attr("d", function (d) {
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
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; })
        .attr("fill", "#FFF")
        .attr("stroke", colors[7]);

    // update
    node.transition().duration(1000)
        .attr("fill", function (d, i) {
            var ret;
            var idx = i;
            if (data.nodes[i].link >= data.label) {
                ret = colors[9];
            } else if (data.stack.indexOf(idx) >= 0) {
                ret = colors[6];
            } else if (data.DFS.indexOf(idx) >= 0) {
                ret = colors[2];
            } else if (data.nodes[i].link === undefined) {
                ret = colors[7];
            } else {
                ret = colors[4];
            }
            return ret;
        });
}

function draw_labels(data, label_g) {
    // Labels
    var label = label_g.selectAll("text")
        .data(data.nodes);

    // Update
    label.transition().delay(900).text(node_text);

    // Enter
    label.enter().append("text")
        .attr("text-anchor", "middle")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y + 5; })
        .text(node_text);
}

function draw_SCCs(data, SCC_g) {
    SCC_g.append("g").selectAll("rect")
        .data(data.SCCs)
        .enter()
        .append("rect")
        .attr("class", "SCC")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", function (d) { return d.w; })
        .attr("height", function (d) { return d.h; })
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("stroke-opacity", 0)
        .attr("stroke", "#FFF");

    SCC_g.selectAll("rect")
        .data(data.SCCs)
        .transition().duration(1000)
        .attr("stroke-opacity", function (d) { return d.visible ? 1 : 0; })
        .attr("stroke", function (d) { return d.visible ? "#000" : "#FFF"; });
}

function draw_graph(data, path_g, circle_g, label_g, SCC_g) {
    draw_links(data, path_g);
    draw_nodes(data, circle_g);
    draw_labels(data, label_g);
    draw_SCCs(data, SCC_g);
}

function text_y(y, box_h) {
    return y + (0.5 * box_h) + 4;
}


function box_y(i, stack_y0, box_h) { return stack_y0 - box_h * (i + 1); }

function draw_DFS(data, DFS_g, stack_x0, box_h, box_w, hot_seat, stack_y0) {

    // Boxes
    var stack_rect = DFS_g.selectAll("rect")
        .data(data.DFS, function (d) { return d; });

    stack_rect.transition().duration(1000)
        .attr("x", function (d, i) { return stack_x0; })
        .attr("y", function (d, i) { return box_y(i, stack_y0, box_h); });

    // Boxes are created in place and fade in
    stack_rect.enter().append("rect")
        .attr("fill", "#FFF")
        .attr("stroke", "#000")
        .attr("height", box_h)
        .attr("width", box_w)
        .attr("x", function (d, i) { return stack_x0; })
        .attr("y", function (d, i) { return box_y(i, stack_y0, box_h); })
        .attr("stroke", "#FFF")
        .attr("stroke-width", 2)
        .transition().duration(1000)
        .attr("stroke", "#000")
        .transition().delay(1000).text(function (d) { return node_text(data.nodes[d]); });

    // On exit, they move to the hot seat
    stack_rect.exit()
        .transition().duration(1000)
        .attr("x", hot_seat.x)
        .attr("y", hot_seat.y)
        .remove();

    // Text
    var stack_text = DFS_g.selectAll("text")
        .data(data.DFS, function (d) { return d; });

    stack_text.transition().duration(1000)
        .attr("x", stack_x0 + box_w / 2)
        .attr("y", function (d, i) { return text_y(box_y(i, stack_y0, box_h), box_h); });

    // Text slides in from the nodes
    stack_text.enter().append("text")
        .attr("text-anchor", "middle")
        .attr("x", function (d) { return data.nodes[d].x; })
        .attr("y", function (d) { return data.nodes[d].y + 5; })
        .text(function (d) { return node_text(data.nodes[d]); })
        .transition().duration(1000)
        .attr("x", stack_x0 + box_w / 2)
        .attr("y", function (d, i) { return text_y(box_y(i, stack_y0, box_h), box_h); });

    // If we have flying text coming in, delay until it has arrived
    if (data.state === "PUSH_KIDS") {
        stack_text.transition().delay(1000).text(function (d) { return node_text(data.nodes[d]); });
    }

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
        .data(stack_data, function (d) { return d; });

    // Boxes slide in from the hotseat
    stack_rect.enter().append("rect").attr("class", "stack")
        .attr("height", box_h)
        .attr("width", box_w)
        .attr("stroke", "#000")
        .attr("x", function (d) { return hot_seat.x; })
        .attr("y", function (d) { return hot_seat.y; })
        .transition().duration(1000)
        .attr("x", function (d, i) { return stack_x0; })
        .attr("y", function (d, i) { return box_y(i, stack_y0, box_h); });

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
        .attr("x", stack_x0 + (box_w / 2))
        .attr("y", function (d, i) { return text_y(box_y(i, stack_y0, box_h), box_h); });

    // Update - if we're flying in data, give it time to arrive
    if (data.flying_label.length > 0) {
        stack_text.transition().delay(1000).text(function (d) { return node_text(data.nodes[d]); });
    } else {
        stack_text.text(function (d) { return node_text(data.nodes[d]); });
    }

    // On exit, fade out
    stack_text.exit()
        .transition().duration(1000)
        .attr("stroke", "#FFF")
        .remove();
}

function draw_hotseat(data, hotseat_g, box_h, box_w, hot_seat) {
    var hotseat_data = [];

    if (data.state === "MIN" || data.state === "PUSH_BT" || data.state === "SET_LABEL" || data.state === "POP_BT") {
        hotseat_data = [data.nodes[data.hot_seat]];
    }

    var hot_rects = hotseat_g.selectAll("rect")
        .data(hotseat_data);

    hot_rects.enter().append("rect")
        .attr("height", box_h)
        .attr("width", box_w)
        .attr("x", hot_seat.x)
        .attr("y", hot_seat.y)
        .attr("fill", "#FFF")
        .attr("stroke", "#FFF")
        .transition().delay(1000).duration(1e-6)
        .attr("stroke", "#000");

    if (data.previous_state === "POP_BT") {
        hot_rects.exit().transition().duration(1000)
            .attr("stroke", "#FFF")
            .remove();
    } else {
        hot_rects.exit().remove();
    }

    var hot_text = hotseat_g.selectAll("text")
        .data(hotseat_data);

    hot_text.enter().append("text")
        .attr("text-anchor", "middle")
        .attr("x", hot_seat.text_x)
        .attr("y", hot_seat.text_y);

    hot_text.transition().delay(1000).duration(1e-6)
        .text(node_text);

    if (data.previous_state === "POP_BT") {
        hot_text.exit().transition().duration(1000)
            .attr("stroke", "#FFF")
            .remove();
    } else {
        hot_text.exit().remove();
    }
}

function draw_index(data, index_g) {
    var index_text = index_g.selectAll("text")
        .data([data.index]);

    index_text.enter().append("text")
        .attr("x", 20)
        .attr("y", 20);

    // Update
    index_text.text(function (d) { return "Index: " + d; });
}

function draw_cur_label(data, cur_label_g) {
    var cur_label_text = cur_label_g.selectAll("text")
        .data([data.label]);

    cur_label_text.enter().append("text")
        .attr("x", 20)
        .attr("y", 40);
    // Update
    cur_label_text.text(function (d) { return "Label: " + d; });
}

function draw_msg(data, msg_g) {
    var msg_text = msg_g.selectAll("text")
        .data([data.msg]);

    msg_text.enter().append("text")
        .attr("x", 120)
        .attr("y", 470);
    msg_text.text(function (d) { return d; }).attr("font-weight", "bold");
}

function draw_flying(data, flying_g, stack_y0, box_h) {
    var flying_index = [];
    if (data.state === "PUSH_KIDS") {
        flying_index.push(data.DFS.last());
        flying_index.push(data.DFS.last());
    }
    var flying_text = flying_g.selectAll("text")
        .data(flying_index)
        .enter().append("text")
        .attr("x", 60)
        .attr("y", 20)
        .text(function (d) { return data.index - 1; })
        .transition().duration(1000)
        .attr("x", function (d, i) {
            var ret;
            if (i === 0) {
                ret = data.nodes[d].x;
            } else {
                ret = 40;
            }
            return ret;
        })
        .attr("y", function (d, i) {
            var ret;
            if (i === 0) {
                ret = data.nodes[d].y;
            } else {
                ret = text_y(box_y(data.DFS.length - 1, stack_y0, box_h), box_h);
            }
            return ret;
        })
        .remove();
}

function draw_flying_min(data, flying_min_g, hot_seat) {

    var flying_min_text = flying_min_g.selectAll("text")
        .data(data.flying_min);

    flying_min_text.enter().append("text")
        .attr("x", function (d) { return data.nodes[d].x; })
        .attr("y", function (d) { return data.nodes[d].y; })
        .text(function (d) { return data.nodes[d].link; })
        .transition().duration(1000)
        .attr("x", hot_seat.text_x + 4)
        .attr("y", hot_seat.text_y)
        .remove();
}

function draw_flying_label(data, flying_label_a_g, flying_label_b_g, stack_x, box_w, box_h, stack_y0, hot_seat) {

    var i;
    var label_x = 60;
    var label_y = 40;

    var flying_to_stack = [];
    var flying_nodes = [];
    if (data.state === "POP_BT") {
        flying_to_stack = [hot_seat.y];
        flying_nodes = [data.nodes[data.hot_seat]];
        for (i = data.stack.length - 1; i >= 0; i--) {
            if (data.nodes[data.stack[i]].link === data.label + 1) {
                flying_to_stack.push(box_y(i, stack_y0, box_h));
                flying_nodes.push(data.nodes[data.stack[i]]);
            }
        }
    }

    // Flying label from top left to the stack
    var flying_label_a_text = flying_label_a_g.selectAll("text")
        .data(flying_to_stack);

    flying_label_a_text.enter().append("text")
        .attr("x", label_x)
        .attr("y", label_y)
        .text(data.label + 1)
        .transition().duration(1000)
        .attr("x", stack_x + (box_w / 2) + 2) // Slight offset to not land on top of the current label
        .attr("y", function (d) { return text_y(d, box_h); })
        .remove();

    // Flying label from top left to the graph
    var flying_label_b_text = flying_label_b_g.selectAll("text")
        .data(flying_nodes);

    flying_label_b_text.enter().append("text")
        .attr("x", label_x)
        .attr("y", label_y)
        .text(data.label + 1)
        .transition().duration(1000)
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .remove();
}

function draw_steps(data, steps_g) {
    var steps_text = steps_g.selectAll("text")
        .data([data.steps]);

    steps_text.enter().append("text")
        .attr("x", 460)
        .attr("y", 440);

    steps_text.text(function (d) { return "Step " + d + "/79"; });
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
    draw_flying_label(data, flying_label_a_g, flying_label_b_g, stack_x, box_w, box_h, stack_y0, hot_seat);
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
    var box_h = stack_y0 / (N + 1);
    var box_w = 37;
    var circle_r = 20;

    // Stack locations
    var DFS_x = 20;
    var stack_x = 100;

    // Hotseat location
    var hot_seat = {x: 100, y: 100};
    hot_seat.text_x = hot_seat.x + 18;
    hot_seat.text_y = text_y(hot_seat.y, box_h);

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

    var graph_g = svg.append("g").attr("id", "graph");
    var path_g = graph_g.append("g").attr("id", "paths");
    var steps_g = svg.append("g").attr("id", "steps");

    var circle_g = graph_g.append("g").attr("id", "circles");
    var label_g = graph_g.append("g").attr("id", "labels");

    var SCC_g = svg.append("g").attr("id", "SCC");

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
        .on("click", function () {
            update_and_draw(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g);
        });
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
        .on("click", function () {
            data = load_data();
            draw_all(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g);
        });

    init_markers(svg);

    // Graph

    // The static content
    set_stack_label(svg, stack_x, stack_y0, box_w, "backtracked", 6);
    set_stack_label(svg, DFS_x, stack_y0, box_w, "DFS", 2);



    draw_all(data, path_g, circle_g, label_g, SCC_g, stack_x, stack_g, DFS_x, DFS_g, box_h, box_w, hotseat_g, hot_seat, index_g, cur_label_g, msg_g, flying_g, flying_min_g, flying_label_a_g, flying_label_b_g, stack_y0, steps_g);

}

function draw_lines(lines, g) {
    g.selectAll("line").data(lines).enter().append("line")
        .attr("x1", function (d) { return d.x1; })
        .attr("y1", function (d) { return d.y1; })
        .attr("x2", function (d) { return d.x2; })
        .attr("y2", function (d) { return d.y2; })
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("marker-start", function (d) {
            if (d.bidirectional) {
                return "url(#start)";
            }
        })
        .attr("marker-end", "url(#end)");
}

function draw_circles(circles, g) {
    g.selectAll("circle").data(circles).enter().append("circle")
        .attr("cx", function (d) { return d.cx; })
        .attr("cy", function (d) { return d.cy; })
        .attr("r", function (d) { return d.r; })
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#FFF")
        .attr("fill-opacity", 1);
}

function draw_rects(rects, g) {
    g.selectAll("rect").data(rects).enter().append("rect")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", function (d) { return d.width; })
        .attr("height", function (d) { return d.height; })
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("stroke", "#000")
        .attr("stroke-width", 5)
        .attr("fill", "#FFF")
        .attr("fill-opacity", 0);
}

function draw_text(texts, g) {
    g.selectAll("text").data(texts).enter().append("text")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y + 5; })
        .attr("text-anchor", "middle")
        .text(function (d) { return d.text; });
}

function draw_simple_graphs(target) {
    var w = 500, h = 150;
    var svg = d3.select(target).append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("style", "display: block; margin: 0 auto;");

    init_markers(svg);

    draw_lines([{x1: 50, x2: 200, y1: 50, y2: 50, bidirectional: false},
        {x1: 300, x2: 450, y1: 50, y2: 50, bidirectional: true}
           ], svg);
    draw_circles([{cx: 50, cy: 50, r: 20},
          {cx: 200, cy: 50, r: 20},
          {cx: 300, cy: 50, r: 20},
          {cx: 450, cy: 50, r: 20}
         ], svg);
    draw_text([{x: 50, y: 50, text: "A"},
           {x: 200, y: 50, text: "B"},
           {x: 125, y: 100, text: "Weakly connected"},
           {x: 300, y: 50, text: "A"},
           {x: 450, y: 50, text: "B"},
           {x: 375, y: 100, text: "Strongly connected"}
          ], svg);
}

function draw_ABC_graph(target) {
    var w = 260, h = 250;
    var svg = d3.select(target).append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("style", "display: block; margin: 0 auto;");

    init_markers(svg);

    draw_lines([{x1: (w / 2) - 80, x2: (w / 2), y1: 50, y2: 150, bidirectional: true},
        {x1: (w / 2) + 80, x2: (w / 2), y1: 50, y2: 150, bidirectional: true}
           ], svg);
    draw_circles([{cx: (w / 2) - 80, cy: 50, r: 20},
          {cx: (w / 2) + 80, cy: 50, r: 20},
          {cx: (w / 2), cy: 150, r: 20}
         ], svg);
    draw_text([{x: (w / 2) - 80, y: 50, text: "B"},
           {x: (w / 2) + 80, y: 50, text: "C"},
           {x: (w / 2), y: 150, text: "A"},
           {x: (w / 2), y: 200, text: "A is strongly connect to both B and C"},
           {x: (w / 2), y: 220, text: "so B and C are also strongly connected"}
          ], svg);
}

function draw_SCC_graph(target) {
    var w = 350, h = 230;
    var svg = d3.select(target).append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("style", "display: block; margin: 0 auto;");

    init_markers(svg);

    draw_lines([{x1: 50, y1: 50, x2: 50, y2: 150, bidirectional: false},
        {x1: 50, y1: 150, x2: 125, y2: 100, bidirectional: false},
        {x1: 125, y1: 100, x2: 50, y2: 50, bidirectional: false},
        {x1: 125, y1: 100, x2: 225, y2: 100, bidirectional: false},
        {x1: 225, y1: 100, x2: 300, y2: 50, bidirectional: false},
        {x1: 300, y1: 50, x2: 300, y2: 150, bidirectional: false},
        {x1: 300, y1: 150, x2: 225, y2: 100, bidirectional: false}
           ], svg);
    draw_circles([{cx: 50, cy: 50, r: 20},
          {cx: 50, cy: 150, r: 20},
          {cx: 125, cy: 100, r: 20},
          {cx: 225, cy: 100, r: 20},
          {cx: 300, cy: 50, r: 20},
          {cx: 300, cy: 150, r: 20}
         ], svg);

    draw_rects([{x: 20, y: 20, height: 160, width: 140},
        {x: 190, y: 20, height: 160, width: 140}
           ], svg);
    draw_text([{x: 175, y: 200, text: "A graph split into strongly connected components"}
          ], svg);
}

function draw_stack_arrays(target) {
    var N = 8; // number of values to consider
    var box = 30; // Scale to work with
    var w = (8 + N) * box;
    var h = 10 * box;
    var DFS_x = box;
    var main_x = 4 * box;
    var bt_x = (6 + N) * box;

    var base_y = h - (2 * box);

    var svg = d3.select(target).append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("style", "display: block; margin: 0 auto;");

    svg.append("svg:defs").selectAll("marker")
        .data(["end1"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("strokeWidth", 1)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", 75)
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr('fill', colors[2]);

    svg.append("svg:defs").selectAll("marker")
        .data(["start1"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("strokeWidth", 1)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", 305)
        .append("svg:path")
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', colors[2]);

    svg.append("svg:defs").selectAll("marker")
        .data(["end3"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("strokeWidth", 1)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", 75)
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr('fill', colors[6]);
    svg.append("svg:defs").selectAll("marker")
        .data(["start3"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("strokeWidth", 1)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", 305)
        .append("svg:path")
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', colors[6]);

    svg.append("svg:defs").selectAll("marker")
        .data(["end2"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("strokeWidth", 1)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", 280)
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr('fill', colors[2]);

    svg.append("svg:defs").selectAll("marker")
        .data(["start2"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("strokeWidth", 1)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", 40)
        .append("svg:path")
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', '#000')
        .attr('fill', colors[2]);


    var DFS_data = [2, 6, 4];
    var DFS_g = svg.append("g").attr("id", "DFS");
    DFS_g.selectAll("rect")
        .data(DFS_data).enter().append("rect")
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#FFF")
        .attr("height", box)
        .attr("width", box)
        .attr("x", DFS_x)
        .attr("y", function (d, i) { return base_y - (i + 1) * box; });

    DFS_g.selectAll("text")
        .data(DFS_data).enter().append("text")
        .attr("x", DFS_x + (box / 2))
        .attr("y", function (d, i) { return base_y - (i + 1) * box + (box / 2) + 5; })
        .attr("text-anchor", "middle")
        .attr("stroke", colors[2])
        .text(function (d) { return d; });

    var backtrack_data = [5, 7, 3, 1];
    var backtrack_g = svg.append("g").attr("id", "backtrack");
    backtrack_g.selectAll("rect")
        .data(backtrack_data).enter().append("rect")
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#FFF")
        .attr("height", box)
        .attr("width", box)
        .attr("x", bt_x)
        .attr("y", function (d, i) { return base_y - (i + 1) * box; });

    backtrack_g.selectAll("text")
        .data(backtrack_data).enter().append("text")
        .attr("x", bt_x + (box / 2))
        .attr("y", function (d, i) { return base_y - (i + 1) * box + (box / 2) + 5; })
        .attr("text-anchor", "middle")
        .attr("stroke", colors[6])
        .text(function (d) { return d; });

    var path1_data = [[-1, 4], [4, 6], [6, 2]];
    var path1_g = svg.append("g").attr("id", "path1");
    path1_g.selectAll("path")
        .data(path1_data).enter().append("path")
        .attr("stroke-width", "2px")
        .attr("stroke", colors[2])
        .attr("fill", "#FFF")
        .attr("fill-opacity", 0)
        .attr("marker-start", function (d) {
            if (d[0] > d[1]) {
                return "url(#start1)";
            }
        })
        .attr("marker-end", function (d) {
            if (d[0] < d[1]) {
                return "url(#end1)";
            }
        })
        .attr("d", function (d) {
            var ret;
            var swap = d[0] > d[1];
            if (swap) {
                d = [d[1], d[0]];
            }
            var dx = box * (d[0] - d[1]),
                dy = 0,
                dr = Math.sqrt(dx * dx);
            var y = base_y - (5 * box);
            if (swap) {
                ret = "M" + (main_x + box * (d[0] + 0.5) + 5) + "," + y + "A" + (dr / 2) + "," + (dr / 2) + " 0 0,1 " + (main_x + box * (d[1] + 0.5) - 5) + "," + y;
            } else {
                ret = "M" + (main_x + box * (d[0] + 0.5) - 5) + "," + y + "A" + (dr / 2) + "," + (dr / 2) + " 0 0,1 " + (main_x + box * (d[1] + 0.5) + 5) + "," + y;
            }
            return ret;
        });

    var path3_data = [[8, 1], [1, 3], [3, 7], [7, 5]];
    var path3_g = svg.append("g").attr("id", "path3");
    path3_g.selectAll("path")
        .data(path3_data).enter().append("path")
        .attr("stroke-width", "2px")
        .attr("stroke", colors[6])
        .attr("fill", "#FFF")
        .attr("fill-opacity", 0)
        .attr("marker-start", function (d) {
            if (d[0] > d[1]) {
                return "url(#start3)";
            }
        })
        .attr("marker-end", function (d) {
            if (d[0] < d[1]) {
                return "url(#end3)";
            }
        })
        .attr("d", function (d) {
            var ret;
            var swap = d[0] > d[1];
            if (swap) {
                d = [d[1], d[0]];
            }
            var dx = box * (d[0] - d[1]),
                dy = 0,
                dr = Math.sqrt(dx * dx);
            var y = base_y - (5 * box);
            if (swap) {
                ret = "M" + (main_x + box * (d[0] + 0.5) + 5) + "," + y + "A" + (dr / 2) + "," + (dr / 2) + " 0 0,1 " + (main_x + box * (d[1] + 0.5) - 5) + "," + y;
            } else {
                ret = "M" + (main_x + box * (d[0] + 0.5) - 5) + "," + y + "A" + (dr / 2) + "," + (dr / 2) + " 0 0,1 " + (main_x + box * (d[1] + 0.5) + 5) + "," + y;
            }
            return ret;
        });

    var path2_data = [[-1, 2], [2, 6], [6, 4]];
    var path2_g = svg.append("g").attr("id", "path2");
    path2_g.selectAll("path")
        .data(path2_data).enter().append("path")
        .attr("stroke-width", "2px")
        .attr("stroke", colors[2])
        .attr("fill", "#FFF")
        .attr("fill-opacity", 0)
        .attr("marker-start", function (d) {
            if (d[0] > d[1]) {
                return "url(#start2)";
            }
        })
        .attr("marker-end", function (d) {
            if (d[0] < d[1]) {
                return "url(#end2)";
            }
        })
        .attr("d", function (d) {
            var ret;
            var swap = d[0] > d[1];
            if (swap) {
                d = [d[1], d[0]];
            }
            var dx = box * (d[0] - d[1]),
                dy = 0,
                dr = Math.sqrt(dx * dx);
            var y = base_y - (3 * box);
            if (swap) {
                ret = "M" + (main_x + box * (d[0] + 0.5) + 5) + "," + y + "A" + (dr / 2) + "," + (dr / 2) + " 0 0,0 " + (main_x + box * (d[1] + 0.5) - 5) + "," + y;
            } else {
                ret = "M" + (main_x + box * (d[0] + 0.5) - 5) + "," + y + "A" + (dr / 2) + "," + (dr / 2) + " 0 0,0 " + (main_x + box * (d[1] + 0.5) + 5) + "," + y;
            }
            return ret;
        });

    var arrays_data = [0, 1, 2, 3, 4, 5, 6, 7];
    var arrays_g = svg.append("g").attr("id", "arrays1");
    arrays_g.selectAll("rect")
        .data(arrays_data).enter().append("rect")
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#FFF")
        .attr("height", box)
        .attr("width", box)
        .attr("y", base_y - (5 * box))
        .attr("x", function (d, i) { return main_x + (i * box); });
    arrays_g = svg.append("g").attr("id", "arrays2");
    arrays_g.selectAll("rect")
        .data(arrays_data).enter().append("rect")
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#FFF")
        .attr("height", box)
        .attr("width", box)
        .attr("y", base_y - (4 * box))
        .attr("x", function (d, i) { return main_x + (i * box); });

    arrays_g.selectAll("text")
        .data(arrays_data).enter().append("text")
        .attr("x", function (d, i) { return main_x + (i * box) + (box / 2); })
        .attr("y", function (d, i) { return base_y - box + (box / 2) + 5; })
        .attr("text-anchor", "middle")
        .text(function (d) { return d; });


    var stack1_data = [-1, -1, -1, -1, 6, -1, 2, -1];
    var stack1_g = svg.append("g").attr("id", "stack1");
    stack1_g.selectAll("text")
        .data(stack1_data).enter().append("text")
        .attr("y", base_y - (5 * box) + (box / 2) + 5)
        .attr("x", function (d, i) { return main_x + (i * box) + (box / 2); })
        .attr("text-anchor", "middle")
        .attr("stroke", colors[2])
        .text(function (d) {
            if (d >= 0) {
                return d;
            }
        });

    var stack2_data = [-1, -1, 6, -1, -1, -1, 4, -1];
    var stack2_g = svg.append("g").attr("id", "stack2");
    stack2_g.selectAll("text")
        .data(stack2_data).enter().append("text")
        .attr("y", base_y - (4 * box) + (box / 2) + 5)
        .attr("x", function (d, i) { return main_x + (i * box) + (box / 2); })
        .attr("text-anchor", "middle")
        .attr("stroke", colors[2])
        .text(function (d) {
            if (d >= 0) {
                return d;
            }
        });

    // The backtrack stack
    var stack3_data = [-1, 3, -1, 7, -1, -1, -1, 5];
    var stack3_g = svg.append("g").attr("id", "stack3");
    stack3_g.selectAll("text")
        .data(stack3_data).enter().append("text")
        .attr("y", base_y - (5 * box) + (box / 2) + 5)
        .attr("x", function (d, i) { return main_x + (i * box) + (box / 2); })
        .attr("text-anchor", "middle")
        .attr("stroke", colors[6])
        .text(function (d) {
            if (d >= 0) {
                return d;
            }
        });

    var start_values = [[4, -1, 5, 2], [2, -1, 4, 2], [1, 8, 5, 6]];
    var start_g = svg.append("g").attr("id", "start");
    start_g.selectAll("text")
        .data(start_values).enter().append("text")
        .attr("x", function (d) { return main_x + (d[1] * box) + (box / 2); })
        .attr("y", function (d) { return base_y - (d[2] * box) + (box / 2) + 5; })
        .attr("text-anchor", "middle")
        .attr("stroke", function (d) { return colors[d[3]]; })
        .text(function (d) { return d[0]; });

    var labels_data = [["DFS", DFS_x, 2], ["backtrack", bt_x, 6]];
    var labels_g = svg.append("g").attr("id", "labels");
    labels_g.selectAll("text")
        .data(labels_data).enter().append("text")
        .attr("x", function (d) { return d[1] + (box / 2); })
        .attr("y", base_y + (box / 2) + 5)
        .attr("text-anchor", "middle")
        .attr("stroke", function (d) { return colors[d[2]]; })
        .text(function (d) { return d[0]; });

    var caption_g = svg.append("g").attr("id", "caption");
    caption_g.selectAll("text")
        .data(["Memory sharing of the DFS and backtrack stacks"]).enter().append("text")
        .attr("x", function (d) { return w / 2; })
        .attr("y", h - (box / 2))
        .attr("text-anchor", "middle")
        .text(function (d) { return d; });
}

function main() {
    draw_SCC_animation("#animation");
    draw_simple_graphs("#strong_weak");
    draw_ABC_graph("#ABC");
    draw_SCC_graph("#split_up");
    draw_stack_arrays("#stack_arrays");
}

//main();
