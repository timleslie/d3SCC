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
		{nodes: [4, 5], bidirectional: false},
		{nodes: [5, 6], bidirectional: false},
		{nodes: [6, 4], bidirectional: false},
		{nodes: [2, 7], bidirectional: false},
		{nodes: [8, 9], bidirectional: true}],
	need_to_push: -1,
	need_to_find_min: -1,
	need_to_process_root: -1,
	need_to_process_non_root: -1,
	need_to_push_stack: -1,
	need_to_pop_label: -1,
	flying_index: [],
	flying_min: [],
	flying_label: [],
	msg: "Use buttons to step through the SCC algorithm",
    };
    return data;
}

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

function update_DFS_head(data, v) {
    data.nodes[v].link = data.index;
    data.index++;
    data.flying_index = [v];
}

function push_links(data, v) {
    var target;
    var found = false;
    for (var i = 0; i < data.links.length; i++) {
	var link = data.links[i];
	if (v == link.nodes[0]) {
	    target = link.nodes[1];
	    if (data.nodes[target].link === undefined) {
		if (data.DFS.indexOf(target) >= 0) {
		    data.DFS.splice(data.DFS.indexOf(target), 1);
		}
		found = true;
		data.DFS.push(target);
	    }
	}
	if (v == link.nodes[1] && link.bidirectional) {
	    target = link.nodes[0];
	    if (data.nodes[target].link === undefined) {
		if (data.DFS.indexOf(target) >= 0) {
		    data.DFS.splice(data.DFS.indexOf(target), 1);
		}
		found = true;
		data.DFS.push(target);
	    }
	}
    }
    if (found) { 
	data.msg = "Push children to DFS stack";
    } else {
	data.msg = "No children to push to DFS stack";
    }
}

function min_link(data, v) {
    var target;
    var min = data.nodes[v].link;
    for (var i = 0; i < data.links.length; i++) {
	var link = data.links[i];
	if (v == link.nodes[0]) {
	    target = link.nodes[1];
	    if (data.nodes[target].link < min) {
		min = data.nodes[target].link;
		data.flying_min = [target];
	    }
	}
	if (v == link.nodes[1] && link.bidirectional) {
	    target = link.nodes[0];
	    if (data.nodes[target].link < min) {
		min = data.nodes[target].link;
		data.flying_min = [target];
	    }
	}

    }
    return min;
}

function process_non_root(data, v) {
    data.stack.push(v);
}

function process_root(data, link) {
    // Label all nodes

    var i = data.stack.length - 1;
    while (i >= 0 && data.nodes[data.stack[i]].link >= link) {
	data.nodes[data.stack[i]].link = data.label;
	data.flying_label.push(i);
	i--;
    }
    data.SCCs[data.nodes.length - data.label].visible = true;
}

function pop_labelled(data) { 
    // Pop nodes, update index/label
    while(data.stack.length > 0 && data.nodes[data.stack.last()].link == data.label) {
	data.stack.pop();
	data.index--;
    }
    data.label--;
}

function backtrack(data, v) {
    var min = min_link(data, v);
    data.need_to_push_stack = v;
    if (min == data.nodes[v].link) {
	data.need_to_process_root = data.nodes[v].link;
	data.flying_min = [v];
    } else {
	data.nodes[v].link = min; // has a lower link, push to stack
    }
}


function process_node(data) {
    data.flying_index = [];
    data.flying_min = [];
    data.flying_label = [];
    if (data.need_to_push >= 0) {
	v = data.need_to_push;
	data.need_to_push = -1;
	// Add links
	push_links(data, v);
    } else if (data.need_to_find_min >= 0) {
	v = data.need_to_find_min;
	data.need_to_find_min = -1;
	data.msg = "Find minimum link number of children";
	backtrack(data, v);
    } else if (data.need_to_push_stack >= 0) {
	v = data.need_to_push_stack;
	data.need_to_push_stack = -1;
	data.msg = "Push node onto stack";
	data.stack.push(v);
    } else if (data.need_to_process_root >= 0) {
	v = data.need_to_process_root;
	data.need_to_process_root = -1;
	data.msg = "Set label for nodes in this SCC";
	process_root(data, v);	
	data.need_to_pop_label = v;
    } else if (data.need_to_pop_label >= 0) {
	data.need_to_pop_label = -1;
	data.msg = "Pop nodes in this SCC from the stack";
	pop_labelled(data);
    } else {
	var v = data.DFS.last();
	if (v === undefined) {
	    // Push root to DFS
	    var i;
	    for (i=0; i < data.nodes.length; i++) {
		if (data.nodes[i].link == undefined) {
		    data.msg = "Add next unvisited node to DFS stack";
		    data.DFS.push(i);
		    break;
		}
	    }
	    if (i == data.nodes.length) {
		data.msg = "All SCCs identified";
	    }
	} else if (data.nodes[v].link === undefined) {
	    // Begin DFS update
	    data.msg = "Set index of top of DFS stack";
	    update_DFS_head(data, v);
	    data.need_to_push = v;
	} else {
	    // Begin DFS backtrack
	    data.msg = "Pop DFS stack and begin backtrack";
	    v = data.DFS.pop();
	    data.need_to_find_min = v;
	}
    }
}
