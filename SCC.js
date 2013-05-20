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
	steps: 0,
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
    var found = [];
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
    var nodes = [];
    var root = data.nodes[data.stack[i]].text;
    while (i >= 0 && data.nodes[data.stack[i]].link >= link) {
	data.nodes[data.stack[i]].link = data.label;
	data.flying_label.push(i);
	nodes.push(data.nodes[data.stack[i]].text);
	i--;
    }
    data.msg = root + " is a root node. Set label = " + data.label + " for nodes with link >= " + link + ": " + nodes;
    data.SCCs[data.nodes.length - data.label].visible = true;
}

function pop_labelled(data) { 
    // Pop nodes, update index/label
    nodes = []
    while(data.stack.length > 0 && data.nodes[data.stack.last()].link == data.label) {
	v = data.stack.pop();
	nodes.push(data.nodes[v].text);
	data.index--;
    }
    data.label--;
    data.msg = "Pop nodes in this SCC from the backtracked stack: " + nodes;
}

function backtrack(data, v) {
    var min = min_link(data, v);
    data.need_to_push_stack = v;
    if (min == data.nodes[v].link) {
	data.need_to_process_root = data.nodes[v].link;
	//data.flying_min = [v];
	data.msg = "No children of " + data.nodes[v].text + " have a smaller link number: " + data.nodes[v].text + " is a root node"
    } else {
	data.nodes[v].link = min; // has a lower link, push to stack
	data.msg = "Set link of " + data.nodes[v].text +  " to minimum link of its children (" + data.nodes[v].text + " = " + min + ")"
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
	backtrack(data, v);
    } else if (data.need_to_push_stack >= 0) {
	v = data.need_to_push_stack;
	data.need_to_push_stack = -1;
	data.msg = "Push " + data.nodes[v].text + " onto backtracked stack";
	data.stack.push(v);
    } else if (data.need_to_process_root >= 0) {
	v = data.need_to_process_root;
	data.need_to_process_root = -1;
	process_root(data, v);	
	data.need_to_pop_label = v;
    } else if (data.need_to_pop_label >= 0) {
	data.need_to_pop_label = -1;
	pop_labelled(data);
    } else {
	var v = data.DFS.last();
	if (v === undefined) {
	    // Push root to DFS
	    var i;
	    for (i=0; i < data.nodes.length; i++) {
		if (data.nodes[i].link == undefined) {
		    data.msg = "Add next unvisited node to DFS stack (" + data.nodes[i].text + ")";
		    data.DFS.push(i);
		    break;
		}
	    }
	    if (i == data.nodes.length) {
		data.steps--;
		data.msg = "All SCCs identified";
	    }
	} else if (data.nodes[v].link === undefined) {
	    // Begin DFS update
	    data.msg = "Set link number of node at top of DFS stack to index (" + data.nodes[v].text + " = " + data.index + ")";
	    update_DFS_head(data, v);
	    data.need_to_push = v;
	} else {
	    // Begin DFS backtrack
	    v = data.DFS.pop();
	    data.msg = "Pop DFS stack and begin backtrack operations on " + data.nodes[v].text;
	    data.need_to_find_min = v;
	}
    }
    data.steps++;
}
