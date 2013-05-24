function load_data() {
    var data = {
	index: 1,
	label: 10,
	stack: [],
	DFS: [],
	SCCs: [{x: 310, y: 20, w: 80, h: 80, visible: false},
	       {x: 220, y: 120, w: 170, h: 170, visible: false},
	       {x: 410, y: 120, w: 170, h: 260, visible: false},
	       {x: 410, y: 20, w: 170, h: 80, visible: false}],
	nodes: [{x: 500, y: 340, text: "A", fixed: true},
		{x: 350, y: 250, text: "B", fixed: true},
		{x: 300, y: 160, text: "C", fixed: true},
		{x: 260, y: 250, text: "D", fixed: true},
		{x: 500, y: 250, text: "E", fixed: true},
		{x: 540, y: 160, text: "F", fixed: true},
		{x: 450, y: 160, text: "G", fixed: true},
		{x: 350, y: 60, text: "H", fixed: true},
		{x: 450, y: 60, text: "I", fixed: true},
		{x: 540, y: 60, text: "J", fixed: true}],
	links: [{nodes: [0, 1], bidirectional: false},
		{nodes: [1, 2], bidirectional: false},
		{nodes: [2, 3], bidirectional: false},
		{nodes: [3, 1], bidirectional: false},
		{nodes: [0, 4], bidirectional: true},
		{nodes: [4, 1], bidirectional: false},
		{nodes: [4, 5], bidirectional: false},
		{nodes: [5, 6], bidirectional: false},
		{nodes: [6, 4], bidirectional: false},
		{nodes: [2, 7], bidirectional: false},
		{nodes: [8, 9], bidirectional: true}],
	flying_index: [],
	flying_min: [],
	flying_label: [],
	msg: "Use buttons to step through the SCC algorithm",
	steps: 0,
	previous_state: "",
	state: "LOOK",
	hot_seat: -1,
	min: -1,
    };
    return data;
}

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

function pop_dfs(data) {
    data.hot_seat = data.DFS.pop();
    data.msg = "Pop " + data.nodes[data.hot_seat].text  + " from the DFS stack.";
}

function push_bt(data) {
    data.nodes[data.hot_seat].link = data.min;
    data.stack.push(data.hot_seat);
    data.msg = "Push " + data.nodes[data.hot_seat].text + " to backtrack stack and set link to min (" + data.min + ")";
}

function set_link(data) {
    var v = data.DFS.last();
    data.nodes[v].link = data.index;
    data.index++;
    data.msg = "Set link of " + data.nodes[v].text + " to " + data.nodes[v].link;
}

function push_dfs(data, v) {
    data.DFS.push(v);
    data.msg = "Pushing " + data.nodes[v].text + " to the DFS stack";
}

function find_min(data) {
    var target;
    var v = data.hot_seat;
    var min = data.nodes[v].link;
    for (var i = 0; i < data.links.length; i++) {
	var link = data.links[i];
	if (v == link.nodes[0]) {
	    target = link.nodes[1];
	    if (data.nodes[target].link < min) {
		min = data.nodes[target].link;
	    }
	}
	if (v == link.nodes[1] && link.bidirectional) {
	    target = link.nodes[0];
	    if (data.nodes[target].link < min) {
		min = data.nodes[target].link;
	    }
	}

    }
    return min;
}

function push_kids(data) {
    var target;
    var found = [];
    var v = data.DFS.last();
    for (var i = 0; i < data.links.length; i++) {
	var link = data.links[i];
	if (v == link.nodes[0]) {
	    target = link.nodes[1];
	    if (data.nodes[target].link === undefined) {
		if (data.DFS.indexOf(target) >= 0) {
		    data.DFS.splice(data.DFS.indexOf(target), 1);
		}
		found.push(data.nodes[target].text);
		data.DFS.push(target);
	    }
	}
	if (v == link.nodes[1] && link.bidirectional) {
	    target = link.nodes[0];
	    if (data.nodes[target].link === undefined) {
		if (data.DFS.indexOf(target) >= 0) {
		    data.DFS.splice(data.DFS.indexOf(target), 1);
		}
		found.push(data.nodes[target].text);
		data.DFS.push(target);
	    }
	}
    }
    if (found.length > 0) { 
	data.msg = "Push unvisited children of " + data.nodes[v].text + " to DFS stack: " + found;
    } else {
	data.msg = data.nodes[v].text + " has no unvisited children to push to DFS stack";
    }
}

function set_label(data) {

    // Label all nodes
    data.nodes[data.hot_seat].link = data.label;
    for (var i = data.stack.length - 1; i >= 0 && data.nodes[data.stack[i]].link >= data.min; i--) {
	data.nodes[data.stack[i]].link = data.label;
    }
    data.label--;
    data.msg = "Set the label for " + data.nodes[data.hot_seat].text + " and nodes on stack which don't have a smaller link"
    data.SCCs[data.nodes.length - data.label - 1].visible = true;
}

function pop_bt(data) {
    while(data.stack.length > 0 && data.nodes[data.stack.last()].link == data.label + 1) {
	data.stack.pop();
	data.index--;
    }
    data.index--;
    data.msg = "Popping tags";
}

function process_node(data) {
    var v, min;
    console.log("STEP", data.state);
    data.previous_state = data.state;
    switch(data.state) {
	case "LOOK":
	    v = data.DFS.last();
	    if (v === undefined) {
		data.msg = "DFS is empty. Push an unvisited node to DFS."
		data.state = "PUSH_DFS";
	    } else if (data.nodes[v].link === undefined) {
		data.msg = "Top of DFS has no link. Begin phase 1 on " + data.nodes[v].text + ".";
		data.state = "SET_LINK";
	    } else {
		data.msg = "Top of DFS has a link. Begin phase 2 on " + data.nodes[v].text + ".";
		data.state = "POP_DFS";
	    }
	    break;
	case "SET_LINK":
            set_link(data);
	    data.state = "PUSH_KIDS";
	    break;
	case "PUSH_KIDS":
	    push_kids(data);
            data.state = "LOOK";
	    break;
	case "PUSH_DFS":
	    for (v=0; v < data.nodes.length; v++) {
		if (data.nodes[v].link == undefined) {
		    push_dfs(data, v);
		    data.state = "LOOK";
		    break;
		}
	    }
	    if (v == data.nodes.length) {
		data.msg = "All SCCs identified: Process finished!";
		data.state = "FINISH"
	    }
	    break;
	case "POP_DFS":
            pop_dfs(data);
            data.state = "MIN"
	    break;
	case "MIN":
            data.min = find_min(data);
            if (data.min == data.nodes[data.hot_seat].link) {
		data.msg = "No smaller linked nodes: " + data.nodes[data.hot_seat].text + " is a root node";
		data.state = "SET_LABEL";
	    } else {
		data.msg = "Min (" + data.min + ") < link of " + data.nodes[data.hot_seat].text + " (" + data.nodes[data.hot_seat].link + "). " + data.nodes[data.hot_seat].text + " is not a root node.";
		data.state = "PUSH_BT";
	    }
	    break;
	case "PUSH_BT":
	    push_bt(data);
            data.state = "LOOK"
	    break;
	case "SET_LABEL":
            set_label(data);
            data.state = "POP_BT"
	    break;
	case "POP_BT":
	    pop_bt(data);
            data.state = "LOOK"
	    break;
	case "FINISH":
	    break;
    }

    if (data.state != "FINISH")
	data.steps++;
}
