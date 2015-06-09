$(document).ready(function() {

var tasks = new Set();
// update all other selection boxes if necessary when tasks are changed
$("#task_select").on('change', ':checkbox', function() {
	if (this.checked) tasks.add(this.value);
	else tasks.delete(this.value);
	console.log(tasks);
});



});