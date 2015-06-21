# Benchtracker
Track benchmarks locally and interactively display the results.  
A collection of chained tools are provided to create multiple entry points for different projects.
Your project can enter and exit at any point!


# Definitions
**Task**: A collection of benchmarks that are run together. Is defined by a [`config.txt` file](#config_file) inside `<task_dir>/config/`.

**Run**: One sweep through the benchmarks defined in a task. 

**Key parameters**: A set of parameters that in combination define a particular benchmark. 
  They are usually the "input" parameters and not measured "output" parameters. For example,
  architecture and circuit define a [VTR benchmark](https://code.google.com/p/vtr-verilog-to-routing/), so
  each benchmark is one particular combination of an architecture and a circuit.

# Tools
Each tool has additional options found by running them with `-h`. Listed in order that they should be run:

(TODO) run_task.py: 
 - preconditions: 
    - a task-run directory set up like sample_task and shown below.
 - inputs: 
    - task directory (relative or absolute path to it)
 - actions:
    - runs the user script specified in the configuration file and creates the next run directory
    - create subdirectories for all key parameters, with each level being one key parameter
 - outputs:
    - raw output files in the deepest subdirectories
  
(TODO) parse_task.py:
 - preconditions:
    - task-run structure
    - output files under each run
 - inputs:
    - task directory
    - a [**user specified parse file**](#parse_file) which can be optionally defined in the configuration file
 - actions:
    - tries to match regex corresponding to parameters in the parse file in the relevant output file
 - outputs:
    - a [**result file**](#result_file), defaulting to `parsed_results.txt` in the run's root directory
  
populate_db.py:
  - preconditions:
    - task-run structure
  - inputs:
    - task directory
  - actions:
    - creates a SQLite database (defaults to `results.db`) if it does not exist
    - creates a table for the input task if it does not exist (table name is `<task_name>|<host_name>|<user_name>|<abs_path>`)
    - populate the table with all runs of that task, ignoring existing runs
  - outputs:
    - updates database
     
interface_db.py:
  - preconditions:
    - none
  - inputs:
    - database name
    - task names
    - filters
    - x and y parameters
  - actions:
    - defines a library of python functions to query into database
    - defines `Task_filter` class
  - outputs:
    - none

server_db.py:
  - preconditions:
    - none
  - inputs:
    - database name
  - actions:
    - creates a WSGI web service to be either hosted locally or publically (see [instructions](#public_hosting))
    - renders the viewer template for a web interface into the database
  - outputs:
    - web API for querying into database with query string as arguments
      - arguments: t = tasks, p = parameter, m = mode, fp = filtered parameter, fm = filter method, fa = filter argument,
      x = x paramter, y = y parameter
      - list tasks `/`, `/tasks` ()
      - describe parameter `/param` (t,p,m)
      - retieve data `/data` (t,x,y,[fp,fm,fa]...)
    - web viewer and plotter for GUI into database under `/view`


(Hanson can describe his offline plotter)

<a name="config_file"> </a>
# Task Configuration File
The format of each line should be `<parameter_name>=<parameter_value>`.  
Lines beginning in '#' are treated as comments.

Parameters include:
 - 
 
<a name="parse_file"> </a>
# Parse File
The format of each line should be  
`<parameter_name>;<output_file>;<regex>;<default_value>`  
where the regex should have one capture group, the match of which becomes the value of the parameter. 
The default value is optional, defaulting to "-1" if not specified. If nothing is matched, then
the parameter will have the default value.

<a name="result_file"> </a>
# Result File
Each item on every line should end in a tab. This includes the last element.  
The first line is the header with all the parameter names.
N lines follow, where N=number of benchmarks for that task. 
On each line is the value of each parameter for that benchmark.


<a name="public_hosting"> </a>
# Public Hosting Instructions
