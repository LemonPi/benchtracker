from __future__ import print_function, division
import re
import sys
import os.path
import socket
import getpass

# working on the task directory
def sort_runs(runs):
    natural_sort(runs)

def get_runs(params):
    if params.one_shot:
        return ['run1']
    else:
        return [run for run in immediate_subdir(params.task_dir) if run.startswith(params.run_prefix)]
        
def walk_runs(params, operation, select=sort_runs):
    """walk the selected run# directories and apply operation on each"""
    runs = get_runs(params)
    # select how to and which runs to use for a certain range
    select(runs)
    if not runs:
        print("no {}s in {}".format(params.run_prefix, params.task_dir))
        sys.exit(1)
    for run in runs:
        operation(params, run)

def natural_sort(l):
    convert = lambda text: int(text) if text.isdigit() else text.lower()
    alphanum_key = lambda key: [ convert(c) for c in re.split('([0-9]+)', key) ]
    l.sort(key=alphanum_key)

def get_base_name(path):
    return os.path.splitext(os.path.basename(path))[0]
    
def get_result_file(params, run):
    if params.one_shot:
        return params.result_file
    return os.path.join(params.task_dir, run, params.result_file)

def get_task_table_name(params):
    return '[' + "|".join([params.task_name, socket.gethostname(), getpass.getuser(), params.task_path]) + ']'

def immediate_subdir(root):
    return [name for name in os.listdir(root) if os.path.isdir(os.path.join(root, name))]

def get_trailing_num(s):
    match = re.search(r'\d+$', s)
    return int(match.group()) if match else None

def sql_escape(s):
    return '\"' + s + '\"'

def strip_quotes(s):
    if not s:
        return ""

    quote_set = {'\'', '"'}
    first_non_quote = 0
    while s[first_non_quote] in quote_set:
        first_non_quote += 1

    last_non_quote = len(s)-1
    while s[last_non_quote] in quote_set:
        last_non_quote -= 1

    return s[first_non_quote : last_non_quote+1]

def strip_last_word(s):
    return s.rsplit(' ', 1)[0]

def is_type_of(s, convert):
    try:
        convert(s)
        return True
    except ValueError:
        return False

def is_int(s):
    return is_type_of(s, int)

def is_float(s):
    return is_type_of(s, float)

# try converting to numerical types using the strictest converters first
def convert_strictest(s):
    try:
        return int(s)
    except ValueError:
        try:
            return float(s)
        except ValueError:
            return s
