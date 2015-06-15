// globals
var root_url = 'http://localhost:5000'
var tasks = new Set();
var task_cached = "";
var params = [];
var labels = [];
var overlayed_params = [];
var subplotted_params = [];
var active_querying_filter;
var filter_method_map = {"range":"BETWEEN", "categorical":"IN"};
// serialize without [] for array parameters
jQuery.ajaxSettings.traditional = true; 


// DOM modifying functions
$(document).ready(function() {

// update all other selection boxes if necessary when tasks are changed
var task_select = document.getElementById("task_select").getElementsByClassName('task');
for (var i=0; i < task_select.length; ++i) {
	task_select[i].addEventListener('click', function(e) {
		e.preventDefault();
		task_cached = "";
		if (this.className === "task") {tasks.add(this.title); this.className = "task sel_task";}
		else {tasks.delete(this.title); this.className = "task";}
		update_params();
	});
}

var add_filter = document.getElementById("add_filter");
add_filter.addEventListener('click', create_filter_window);

var gen_plot = document.getElementById('generate_plot');
gen_plot.addEventListener('click', generate_plot);


});



// actions upon selecting a task
function update_params() {
	remove_all_filters();
	if (tasks.size === 0) {
		params = [];
		add_filter.style.visibility = 'hidden';
		report_debug("cleared params");
		populate_param_windows();
	}
	else {
		$.getJSON(root_url+'/tasks/?'+create_task_query(), get_params);
		add_filter.style.visibility = 'visible';
		report_debug("updated params");
	}
	// to assure correct sequence, populate param windows must be called inside the functions that update params
	report_debug("---------------");
}
function populate_param_windows() {
	$('#x_param').empty();
	$('#y_param').empty();
	var x_param = document.getElementById('x_param');
	var y_param = document.getElementById('y_param');
	for (p of params) {
		p_pair = p.split(' ');
		var label = document.createElement('label');
		var input = document.createElement('input');
		input.type = 'radio';
		input.value = p;
		input.name = "param";
		label.title = p_pair[1];
		label.className = "param_label";

		label.appendChild(input);
		label.appendChild(document.createTextNode(p_pair[0]));
		label.appendChild(document.createElement('br'));
		x_param.appendChild(label);
		label_y = label.cloneNode(true);
		y_param.appendChild(label_y);
	}
	report_debug("populated param windows");
}

// actions upon adding a filter
function create_filter_window() {
	var sel_bar = document.getElementById('selection_bar');
	var filter = document.createElement('div');
	filter.className = "filter selection_box";

	// create selection menu
	var param_texts = [];
	for (p of params) param_texts.push(p.split(' ')[0]);
	var select_param = create_selection(param_texts, params, "--- parameters ---", false);
	select_param.className = "filter_param";
	select_param.addEventListener('change', query_param, false);

	// create close button
	var close = document.createElement('a');
	close.className = "close attractive_button";
	close.text = 'delete filter';
	close.addEventListener('click', remove_filter, false);

	// // create overlay button
	// var overlay_label = document.createElement('label');
	// var overlay = document.createElement('input');
	// overlay.type = 'checkbox';
	// overlay.value = 'overlay';
	// overlay.className = 'filter_opt';
	// overlay_label.title = 'plot multiple series on a single plot, each distinguished by this parameter';
	// overlay_label.appendChild(overlay);
	// overlay_label.appendChild(document.createTextNode('overlay'));

	// // create subplot button
	// var subplot_label = document.createElement('label');
	// var subplot = document.createElement('input');
	// subplot.type = 'checkbox';
	// subplot.value = 'subplot';
	// subplot.className = 'filter_opt';
	// subplot_label.title = 'plot multiple side-by-side plots, each distinguished by this parameter';
	// subplot_label.appendChild(subplot);
	// subplot_label.appendChild(document.createTextNode('subplot'));	
	// filter.appendChild(overlay_label);
	// filter.appendChild(subplot_label);

	filter.appendChild(select_param);
	filter.appendChild(close);
	var wrapper = document.createElement('div');
	wrapper.className = "box_wrapper";
	wrapper.appendChild(filter);
	sel_bar.insertBefore(wrapper, add_filter);
}

// actions upon clicking the generate plot button
function generate_plot() {
	var data_query = [root_url, '/data?', create_task_query(), '&x='];
	var x = document.querySelector('#x_param input[name="param"]:checked');
	var y = document.querySelector('#y_param input[name="param"]:checked');
	if (!x) {report_error("x parameter not selected"); return;}
	if (!y) {report_error("y parameter not selected"); return;}
	report_debug("x_param: " + x.value);
	report_debug("y_param: " + y.value);
	data_query.push(x.value.split(' ')[0], '&y=', y.value.split(' ')[0], '&');

	var sel_bar = document.getElementById('selection_bar');

	filters = sel_bar.getElementsByClassName('filter');
	for (var f = 0, len = filters.length; f < len; ++f) {
		var filter = parse_filter(filters[f]);		
		report_debug(filter);
		data_query.push.apply(data_query, filter);
	}
    console.log(">>>>  data query >>>>");
	report_debug(data_query.join(''));
	$.getJSON(data_query.join(''), plotter_setup, false);
}

// JSON request callbacks
function get_params( data ) {
	if (data.status !== "OK") {
		report_error(data.status);
		return;
	}
	params = data.params;
	report_debug("got params");
	populate_param_windows();
}

// after selecting a parameter, describe its properties
function describe_param( data ) {
	if (data.status !== "OK") {
		report_error(data.status);
		return;
	}
	clean_querying_filter(data);

	// add a selection if it doesn't exist
	if (active_querying_filter.getElementsByClassName('filter_sel').length === 0) {
		var data_type = document.createElement('select');
		data_type.className = "filter_sel";

		var categorical = document.createElement('option');
		var range = document.createElement('option');

		categorical.value = categorical.text = 'categorical';
		range.value = range.text = 'range';

		if (data.type === "categorical") categorical.selected = "selected";
		else if (data.type === "range") range.selected = "selected";

		data_type.appendChild(categorical);
		data_type.appendChild(range);

		data_type.addEventListener('change', function() {
			active_querying_filter = this.parentNode;
			mode = this.value;
			var query_param = active_querying_filter.getElementsByClassName("filter_param")[0].value;
			report_debug(query_param);
			$.getJSON([root_url,'/param?',create_task_query(),'&p=',query_param,'&m=',mode].join(""), 
				describe_param_adjust, false );
		});

		active_querying_filter.appendChild(data_type);
	}
	// need to update event listener
	else {
		var data_type = active_querying_filter.getElementsByClassName('filter_sel')[0];

	}

	// fill in either a range or a multi-select
	create_filter_val(active_querying_filter, data);
	// query completed
	active_querying_filter = "";
}

// update existing elements
function describe_param_adjust( data ) {
	if (data.status !== "OK") {
		report_error(data.status);
		return;
	}
	clean_querying_filter(data);

	report_debug("adjusting parameter query");

	create_filter_val(active_querying_filter, data);
	// query adjustment completed
	active_querying_filter = "";
}


// remove old elements inside active querying filter (to be updated)
function clean_querying_filter( data ) {
	var old_filter_vals = active_querying_filter.getElementsByClassName("filter_val");
	while (old_filter_vals[0]) active_querying_filter.removeChild(old_filter_vals[0]);

	var filter_sel = active_querying_filter.getElementsByClassName("filter_sel");
	if (filter_sel.length > 0) {
		report_debug(filter_sel.length);
		filter_sel[0].value = data.type;
	}
}

function create_filter_val(target, data) {
	// create either 2 selection boxes for min and max or a multi-select for in filter
	var filter_val = document.createElement('div');
	filter_val.className = "filter_val";
	if (data.type === "categorical") {
		var select_in = create_selection(data.val, data.val, "ctrl+click for multiple, shift+click for range", true);
		select_in.className = "in";
		filter_val.appendChild(select_in);
	}
	else if (data.type === "range") {
		var min = document.createElement('input');
		var max = document.createElement('input');
		min.type = max.type = "text";
		min.className = "min";
		max.className = "max";
		min.placeholder = min.min = data.val[0];
		max.placeholder = max.max = data.val[1];
		filter_val.appendChild(min);
		filter_val.appendChild(max);
	}	
	target.appendChild(filter_val);
}





// utility functions
// always attached to a close button inside the filter
function remove_filter() {
	var filter_box = this.parentNode.parentNode;
	filter_box.parentNode.removeChild(filter_box);
}

function remove_all_filters() {
	var filters = document.getElementsByClassName('filter');
	while (filters[0]) {
		// box wrapper surrounding filter
		filters[0].parentNode.parentNode.removeChild(filters[0].parentNode);
	}
}

function parse_filter( filter ) {
	var parsed_filter = ['fp='];
	var filtered_param = filter.getElementsByClassName('filter_param');
	if (filtered_param.length === 0) return [];
	filtered_param = filtered_param[0].value.split(' ')[0];
	parsed_filter.push(filtered_param);
	
	var filter_type = filter.getElementsByClassName('filter_sel');
	if (filter_type.length === 0) return [];
	filter_type = filter_type[0].value;
	parsed_filter.push('&fm=', filter_method_map[filter_type]);

	if (filter_type === "categorical") {
		var select = filter.getElementsByClassName('in')[0];
		var selected = get_selected(select);
		if (!selected || !selected[0]) {report_debug("nothing selected"); return [];}
		for (var s=0, len=selected.length; s < len; ++s) 
			parsed_filter.push('&fa=', selected[s]);
	}
	else if (filter_type === "range") {
		var min = filter.getElementsByClassName('min')[0].value;
		var max = filter.getElementsByClassName('max')[0].value;
		if (!min || !max) {report_debug("min or max missing"); return [];}
		parsed_filter.push('&fa=', min, '&fa=', max);
	}
	parsed_filter.push('&');
	return parsed_filter;
}

function query_param() {
	var param = this.value;
	active_querying_filter = this.parentNode;
	$.getJSON([root_url,'/param?',create_task_query(),'&p=',param].join(""), describe_param, false );
	report_debug(this.value);
}

function get_selected(select) { 
	var result = [];
	var options = select && select.options;
	var opt;

	for (var i=0, len=options.length; i < len; ++i) {
		opt = options[i];
		if (opt.selected) result.push(opt.value);
	}
	return result;
}
function create_selection(texts, values, prompt_text, multiple) {
	var select = document.createElement('select');
	if (multiple) select.multiple = true;
	var prompt = document.createElement('option');
	prompt.disabled = "disabled";
	prompt.selected = "selected";
	prompt.text = prompt_text;
	prompt.value = "";
	select.appendChild(prompt);
	for (var i = 0, len = values.length; i < len; ++i) {
		var opt = document.createElement('option');
		opt.value = values[i];
		opt.text = texts[i];
		select.appendChild(opt);
	}	
	return select;
}
function create_task_query() {
	if (!task_cached) {
		var qs = [];
		for (task of tasks) 
			qs.push("t=",encodeURIComponent(task),"&");	
		if (qs.length > 0) 
			qs.pop();	// chop last & (mostly harmless)

		task_cached = qs.join("");
	}
	else {
		report_debug("task cached");
	}
	return task_cached;
}

function report_error(error) {
	alert(error);
}
function report_debug(debug) {
	console.log(debug)
}
