# Benchtracker
Track benchmarks locally and interactively display the results.  
A collection of chained tools are provided to create multiple entry points for different projects.
Your project can enter and exit at any point!


# Definitions
**Task**: A collection of benchmarks that are run together. Is defined by a [`config.txt` file](#config_file) inside `<task_dir>/config/`. Structure should look like:

    task_name
        config
            config.txt
        run1
        run2
        run3
        ...

**Run**: One sweep through the benchmarks defined in a task. 

**Key parameters**: A set of parameters that in combination define a particular benchmark. 
  They are usually the "input" parameters and not measured "output" parameters. For example,
  architecture and circuit define a [VTR benchmark](https://code.google.com/p/vtr-verilog-to-routing/), so
  each benchmark is one particular combination of an architecture and a circuit.

**Metrics**: A set of values that are measured as an outcome of the experiment.
  For example, minimum channel width, critical path delay obtained by the output of [VTR benchmark](https://code.google.com/p/vtr-verilog-to-routing/) are the metrics. 

**Axis**: is mainly referred to by the plotter. Basically, the data input to the plotter is stored in a 2D table,
  whose columns are filled in by values of either a parameter or a metric. This table can be transformed into a 
  high dimensional array, with each dimension corresponding to a parameter or a metric. So an axis is a synonym 
  for dimension. In other words, for the plotter, an axis can be a filter, an x or a y.

**Raw**: data is called "raw" if it is not "compressed" or "reduced". Specifically, for the plotter, data is regarded
  as raw if it is not reduced by "gmean" (see the definition below).

**Gmean**: "gmean" is the abbreviations for "geometric mean". For example, in the VTR experiment, if the metric in 
  interest (i.e.: y axis) is minimum channel width, then the "gmean" operation over "circuits" will merge the
  circuit axis by calculating the geometric mean of all circuits' minimum channel width.

**Overlay**: in the plotter, if you choose an overlay axis "P", then all lines in the same plot will have the same parameter 
  values except P value. In other words, the legend of the plot in this case will be "P".

# Tools
Each tool has additional options found by running them with `-h`. Listed in order that they should be run:

(TODO) run_task.py: 
 - preconditions: 
    - task-run structure
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

plotter-offline.py:
  - preconditions:
    - in the same dir with interface_db.py
  - inputs:
    - data table with x and y axis specified, overlay axes, gmean axes
  - actions:
    - calculates the geometric mean of y axis over the gmean axes
    - generates plots with the input x, y axis. The legend is given by the input overlay axes.
    - user can choose whether to display the plot of the gmean data or the raw data.
    - the plot will ignore the data points with invalid value, and do interpolation (when calculating gmean,
      the invalid value will also be picked out)
  - outputs:
    - the resulting plot

<a name="config_file"> </a>
# Task Configuration File
The format of each line should be `<parameter_name>=<parameter_value>`.  
Lines beginning in '#' are treated as comments.

Parameters include:
 - user_script:
 - script_params
 - key_param:
 - key_param_dir:
 - key_param_add:
 - parse_file:
 
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
