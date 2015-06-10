// globals
var root_url = 'http://localhost:5000'
var tasks = new Set();
var params = [];
var labels = [];

// DOM modifying functions
$(document).ready(function() {

// update all other selection boxes if necessary when tasks are changed
$("#task_select").on('change', ':checkbox', function() {
	if (this.checked) tasks.add(this.value);
	else tasks.delete(this.value);
	update_params();
});

$("#add_filter").on('click', null, function() {
	alert("adding filter");
});


});


// utility functions
function update_params() {
	if (tasks.size === 0) {
		params = [];
		console.log("cleared params");
		populate_param_windows();
	}
	else {
		$.getJSON(root_url+'/tasks/?'+create_task_query(), get_params);
		console.log("updated params");
	}
	// to assure correct sequence, populate param windows must be called inside the functions that update params

}

function get_params( data ) {
	if (data.status !== "OK") {
		alert(data.status);
		return;
	}
	params = data.params;
	console.log("got params");
	populate_param_windows();
}

// populate x and y parameter windows
function populate_param_windows() {
	$('#x_param').empty();
	$('#y_param').empty();
	fill_labels();

	fill_selects('x_param');
	fill_selects('y_param');
	console.log("populated param windows");
}

// parameter labels are shared by x,y, and filters
function fill_labels() {
	labels = [];
	for (p of params) {
		p_pair = p.split(' ');
		var label = document.createElement('label');
		label.title = p_pair[1];
		label.appendChild(document.createTextNode(p_pair[0]));
		label.appendChild(document.createElement('br'));
		labels.push(label);
	}
}

// fill the labels with the actual selections
function fill_selects(select_name) {
	var param_len = params.length;
	var select_box = document.getElementById(select_name);

	for (var p = 0; p < param_len; ++p) {
		// new label
		var label = labels[p].cloneNode(true);
		var select = document.createElement('input');
		select.type = "radio";
		// select name might be unncessary (since enclosed by select box with same id)
		// select.name = select_name;
		select.value = params[p];
		// selection should be before text
		label.insertBefore(select, label.firstChild);

		select_box.appendChild(label);		
	}
}

function create_task_query() {
	var qs = "";
	for (task of tasks) 
		qs += "t=" + encodeURIComponent(task) + "&";	
	if (qs.length > 0) 
		qs = qs.substring(0, qs.length - 1);	// chop last & (mostly harmless)

	return qs;
}

