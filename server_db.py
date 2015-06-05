#!/usr/bin/python
# web service, so return only JSON (no HTML)
from flask import Flask, jsonify, request, url_for
import interface_db as d

app = Flask(__name__)

# each URI should be a noun since it is a resource (vs a verb for most library functions)

@app.route('/')
@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify({'tasks':d.list_tasks()})

@app.route('/tasks/', methods=['GET'])
def get_param_desc():
    task = parse_tasks()
    param = request.args.get('p')
    (param_type, param_val) = d.describe_param(param, task)
    return jsonify({'task':task, 'param': param, 'type': param_type, 'val': param_val})

@app.route('/params', methods=['GET'])
def get_shared_params():
    tasks = parse_tasks()
    params = d.describe_tasks(tasks)
    return jsonify({'tasks':tasks, 'params': params})

@app.route('/data', methods=['GET'])
def get_filtered_data():
    x_param = request.args.get('x')
    y_param = request.args.get('y')
    (filtered_params, filters) = parse_filters()
    task = parse_tasks()
    data = d.retrieve_data(x_param, y_param, filters, task)
    data = [tuple(row) for row in data]
    params = [x_param.split()[0], y_param.split()[0]]
    filtered_params = [p for p in filtered_params if p != x_param and p != y_param]
    params.extend(filtered_params)
    return jsonify({'task':task, 'params':params, 'data':data})

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)

def parse_tasks():
    tasks = request.args.getlist('t')
    if tasks[0].isdigit():
        all_tasks = d.list_tasks()
        tasks = [all_tasks[int(t)] for t in tasks]
    return tasks[0] if len(tasks) == 1 else tasks

def parse_filters():
    filter_params = request.args.getlist('fp')
    filter_methods = request.args.getlist('fm')
    filter_arg_len = [int(l) for l in request.args.getlist('fl')]
    filter_args = request.args.getlist('fa')
    filters = []
    init_f = 0
    for f in range(len(filter_params)):
        filters.append(d.Task_filter(filter_params[f], filter_methods[f], 
                                    filter_args[init_f : init_f + filter_arg_len[f]]))
        init_f += filter_arg_len[f]

    return filter_params,filters


if __name__ == '__main__':
    app.run(debug=True)
