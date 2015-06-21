# Benchtracker
Track benchmarks locally and interactively display the results.  
A collection of chained tools are provided to create multiple entry points for different projects.
Your project can enter and exit at any point!


# Definitions
**Task**: A collection of benchmarks that are run together. Is defined by a `config.txt` file inside `<task_dir>/config/`.

**Run**: One sweep through the benchmarks defined in a task. 

**Key parameters**: A set of parameters that in combination define a particular benchmark. 
  They are usually the "input" parameters and not measured "output" parameters. For example,
  architecture and circuit define a [VTR benchmark](https://code.google.com/p/vtr-verilog-to-routing/), so
  each benchmark is one particular combination of an architecture and a circuit.

# Tools
Listed in order that they should be run:

(TODO) run_task.py: 
 - preconditions: 
    - a task-run directory set up like sample_task and shown below.
 - inputs: 
    - task directory (relative or absolute path to it)
 - actions:
    - runs the user script specified in the configuration file and creates the next run directory
    - create subdirectories for all key parameters, with each level being one key parameter
 - outputs:
    - raw output files in the deepest subdirectories.
  
(TODO) parse_task.py:
 - preconditions:
    - output files under each run
 - inputs:
    - task directory
    - a [**user specified parse file**](parse_file) which can be optionally defined in the configuration file. 
 - actions:
    - tries to match regex corresponding to parameters in the parse file in the relevant output file
    - creates a parsed_results.txt file in the run's root directory. 
 - outputs:
  
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
