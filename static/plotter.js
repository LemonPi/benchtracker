/*
$(document).ready(function () {
   $("#plot").click(function(){simple_plot();}); 
});
*/
// create the actual plot in the display_canvas
//
var overlay_list = [];
// raw data means it is not processed by gmean, and its param name has not been manipulated.
var raw_data = null;
var gmean_data = null;
function plotter_setup(data) {
    if (data.status !== 'OK') {
        report_error(data.status);
        return;
    }
    // initialize
    raw_data = data;
    gmean_data = null;
    overlay_list = [];
    generate_overlay_selector('raw');
}

// type is to used to decide whether to generate axes of raw data or gmean data
function generate_overlay_selector(type) {
    var selector_div = d3.select('#overlay_select');
    // clear up
    selector_div.html('');
    var choice = null;
    if (type == 'raw') {
        choice = raw_data.params;
    } else {
        choice = gmean_data.params;
    }
    selector_div.append('h5').text('select overlay axis');
    var form = selector_div.append('form').attr("id", "overlay_options").attr('action', '').append("fieldset");
    form.append('legend').text('select overlay axes:');
    for (var i = 2; i < choice.length; i ++ ) {
        //var label = form.append('label').attr('class', 'param_label');
        form.append('input').attr('type', 'checkbox').attr('value', choice[i]).attr('index', i-2);
        form.append('label').text(choice[i]).append('br');
    }
    form.append('button').attr('type', 'button').attr('id', 'overlay_submission').text('Get Plot!');
    $('#overlay_submission').click(function () {var checkbox = form.selectAll('input', '[type="checkbox"]');
                                                checkbox.each(function () {if (d3.select(this).property('checked')) {
                                                                               overlay_list.push(d3.select(this).attr('index'));
                                                                               console.log('get index');
                                                                               console.log(d3.select(this).attr('index'));
                                                                           }
                                                                         });
                                                plot_generator();} );
}
function simple_plot(params, series, overlay_list) {
    // setup plot name
    var plot_name = "";
    for (var i = 2; i < series[0].length; i ++){
        if (!(i-2 in overlay_list)) {
            plot_name += series[0][i];
            plot_name += '  ';
        }
    }
    // setup raw_data lines
    var lineData = data_transform(series, overlay_list, 'overlay');
    var lineInfo = [];
    for (k in lineData) {
        var lineVal = [];
        for (var j = 0; j < lineData[k].length; j ++ ){
            lineVal.push({x: lineData[k][j][0], y: lineData[k][j][1]});
        }
        lineVal = _.sortBy(lineVal, 'x');
        lineInfo.push({values: lineVal, key: k});
    }
    nv.addGraph(function() {
       var chart = nv.models.lineChart()
                            .margin({left:100, top:100}) 
                            .useInteractiveGuideline(true)
                            .showLegend(true)
                            .showYAxis(true)
                            .showXAxis(true);
        chart.xAxis.axisLabel(params[0])
                   .tickFormat(d3.format(',r'));
        chart.yAxis.axisLabel(params[1])
                   .tickFormat(d3.format('.02f'));
        chart.legend.margin({top:30});
        var width = 600;
        var height = 300;
        //var title = d3.select('#chart').append('h2').attr('align', 'center').text(plot_name);
        var svg = d3.select('#chart')
                    .append('svg').attr('id', plot_name)
                    .attr('height', 300).attr('width', 600);
        /*
        var $svg = $(document.getElementById(plot_name));
        $svg.parent().append('<div class="chart-title">' + plot_name + '</div>');
        */
        //$(svg).parent().append('<div class="chart-title">' + plot_name + '</div>');
        svg.append("text")
           .attr("x", width/2)
           .attr("y", 20)
           .attr("text-anchor", "middle")
           .attr("class", "chart-title")
           .style("font-size", "16px")
           .text(plot_name);
        svg.datum(lineInfo).call(chart);
        nv.utils.windowResize(function() { chart.update(); } );
    });
}
/*
function sinAndCos() {
    var sin = [];
    for (var i = 0; i < 100; i++) {
        sin.push({x: i, y: Math.sin(i/10)});
    }
    return [{values: sin, key: 'sine wave', color: '#ff7f0e'}];

}
*/
function plot_generator(type) {
    var series = raw_data.data;
    console.log("================================");
    console.log(series);
    // filter is an array of array: filter[i][*] stores all possible values of axis i
    var filter = [];
    for (var t = 0; t < raw_data.tasks.length; t++) {
        for (var i = 0; i < raw_data.params.length - 2; i++) {
            var temp = new Set();
            for (var j = 0; j < raw_data.data[t].length; j++) {
                temp.add(raw_data.data[t][j][i+2]);
            }
            var filt_name = [];
            for (v of temp) {
                filt_name.push(v);
            }
            filter.push(filt_name);
            console.log("filt_name: " + raw_data.params[i+2]);
            console.log("filt_temp " + filt_name);
        }
    }
    /*
    // task dir
    for (var i = 0; i < raw_data.tasks.length; i++) {
        alert("task name: " + raw_data.tasks[i]);
        // traverse all possible combinations of all filter axes
        traverse(series, filter, raw_data.param.length - 2, '');
    }
    */
    for (var i = 0; i < series.length; i++) {
        var grouped_series = data_transform(series[i], overlay_list, 'non-overlay');
        console.log(grouped_series);
        for (var k in grouped_series) {
            simple_plot(raw_data.params, grouped_series[k], overlay_list);
        }
    }
}

// we can choose a slightly more neat method: first group by all the axes
// that is not overlaid, then do legend plot upon every group. this will
// not require any recursive function.

function data_transform (series, overlay_list, mode) {
    // group by
    if (mode == 'non-overlay') {
        return _.groupBy(series, function (dot_info) {  axis_group = "";
                                                        for (var i = 2; i < dot_info.length; i++) {
                                                            if (!(i-2 in overlay_list)){
                                                                axis_group += dot_info[i];
                                                            } 
                                                        }   
                                                        return axis_group;
                                                     } );
    } else {
        return _.groupBy(series, function (dot_info) {  axis_group = "";
                                                        for (var i = 2; i < dot_info.length; i++) {
                                                            if (i-2 in overlay_list){
                                                                axis_group += dot_info[i];
                                                            } 
                                                        }   
                                                        return axis_group;
                                                     } );
    }
}
/*
// now we draw one line in each plot
// eventually we should support overlay
function traverse(series, filter, filt_index, plot_key) {
    if (filt_index == 0) {
        //do plotting
        console.log("plotting");
    } else {
        for (var i = 0; i < filter[filt_index].length; i++) {
            sub_series = subtract_series(series, filter[filt_index][i]);
            traverse(sub_series, filter, filt_index-1, plot_key + filter[filt_index][i]);
        }
    }
}


// a better way to do this is to use the database "group by" clause: 
// if so, you don't even need any sub_series
// return series only with certain filt_key, and reduce one column which
// corresponds the filt_key
function subtract_series(series, filt_key) {
    return sreies;
}
*/
