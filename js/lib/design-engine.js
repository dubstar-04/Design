function sceneControl(action, data) {

	var input = data[0];
	var inputData = undefined;
	var expectedInputType = undefined;
	//Create Point to hold any new position
	//var point = new Point()

	//console.log("sceneControl - InputAction:" + action);
	//console.log("sceneControl - InputData:" + data);
	//console.log("sceneControl - Var Input:" + input);

	var isNumber = /^-?\d+\.\d+$/.test(input) || /^-?\d+$/.test(input);
	var isLetters = /^[A-Za-z]+$/.test(input);
	var isPoint = /^\d+,\d+$/.test(input) || /^@-?\d+,-?\d+$/.test(input) || /^#-?\d+,-?\d+$/.test(input);
	var isUndefined = (input === undefined)

	//console.log("sceneControl - only Numbers " + isNumber)
	//console.log("sceneControl - only Letters " + isLetters)
	//console.log("sceneControl - is Point " + isPoint)
	//console.log("sceneControl - is Undefined " + isUndefined)

	if (action === "RightClick") {
		reset()
		return
	}

	if (action === "Enter" && isUndefined) {
		if (activeCommand !== undefined && activeCommand.family === "Tools" && selectionSet.length) {
			selectionAccepted = true;
			inputData = true;
		} else if (activeCommand !== undefined) {
			reset()
			return
		} else if (activeCommand == undefined) {
			initialiseItem(lastCommand[0]);
		}
	}

	if (isPoint) {
		console.log("design engine - comma seperated point - create new point ")

		var isRelative = input.includes('@')
		var isAbsolute = input.includes('#')

		if (isAbsolute || isRelative){
			input = input.replace('@', '').replace('#', '')
		}

		var xyData = input.split(',');
		var point = new Point()
		point.x = parseFloat(xyData[0]);
		point.y = parseFloat(xyData[1]);

		if (isRelative && points.length){
			point.x = parseFloat(points[points.length - 1].x + point.x);
			point.y = parseFloat(points[points.length - 1].y + point.y);
		}

		inputData = point;
		points.push(point);
	}

	if (action === "LeftClick") {
		console.log("design engine - left click- create new point ")

		if (activeCommand === undefined) {
			selectClosestItem(data)
		} else {
			var point = new Point()
			point.x = mouse.x; //data[0];
			point.y = mouse.y; //data[1];
			inputData = point;

			if (activeCommand.family === "Geometry" || selectionAccepted) {
				points.push(inputData);
			}

			if (activeCommand.family === "Tools" && !selectionAccepted) {
				var closestItem = selectClosestItem(data);
			}
		}
	}

	if (isNumber) {
		console.log("design engine - Numbers Recieved")
		//inputData = Number(input);
		point = convertInputToPoint(Number(input))
		inputData = Number(input);
		points.push(point);
		console.log("Number Input Data: ", inputData)
	}

	if (isLetters && !isUndefined) {
		console.log("design-engine - Letters Recieved")
		inputData = String(input);
	}

	///////////////////////////////////////////////////////////////////////
	////////////////////// handle the new inputData //////////////////////
	/////////////////////////////////////////////////////////////////////

	if (activeCommand !== undefined) {
		inputArray.push(inputData)
		actionInput();
	} else if (isCommand(getCommandFromShortcut(input))) {
		initialiseItem(getCommandFromShortcut(input));
		if (activeCommand.family === "Tools" && selectionSet.length || activeCommand.selectionRequired === false) {
			if (activeCommand.selectionRequired) {

				inputArray.push(selectionSet)
				inputArray.push(true)
			}
			selectionAccepted = true;
		}
		actionInput();
	} else {
		console.log("End of design-engine")
	}

	///////////////////////////////////////////////////////////////////////
	////////////////////// handle the new inputData //////////////////////
	/////////////////////////////////////////////////////////////////////

}

function actionInput() {

	[prompt, resetBool, actionBool, validInput] = activeCommand.prompt(inputArray);
	console.log("prompt: ", prompt, " reset: ", resetBool, " action: " + actionBool)
	commandLine.setPrompt(prompt);

	if (!validInput){
		notify("Invalid Input")
	}

	if (actionBool) {
		if (activeCommand.family === "Tools") {
			activeCommand.action(points, items);
		} else {
			addToScene(null, null, resetBool)
		}
	}

	if (resetBool) {
		reset();
	}
}

function initialiseItem(item) {
	console.log(" design-engine - Item To Process: " + item)
	saveRequired();

	if (lastCommand.indexOf(item) !== -1) { // only store command once
		lastCommand.splice(lastCommand.indexOf(item), 1); // if the command is already in the array, Erase it
	}
	lastCommand.unshift(item); // add the command to the Array
	while (lastCommand.length > 10) { //check if we have more than 10 command in history
		lastCommand.pop()
	}

	if (typeof window[item] !== "function") {
		//if the string is an unknown command error gracefully
		notify("Unknown Command")
		commandLine.resetPrompt();
		return;
	}

	activeCommand = new this[item]; // Convert the 'item' string in to a new object, Line, Circle...

};

function convertInputToPoint(input) {
	var point = new Point()
	var x = input * Math.cos(degrees2radians(angle));
	var y = input * Math.sin(degrees2radians(angle));
	// generate data from the prevous point and the radius
	point.x = points[points.length - 1].x + x;
	point.y = points[points.length - 1].y + y;

	return point
}

function isCommand(command) {
	for (var i = 0; i < commands.length; i++) {
		if (commands[i].command === command) {
			return true;
		}
	}
	return false;
}

function getCommandFromShortcut(shortcut) {

	var commandFromShortcut = shortcut.toUpperCase()
	for (var i = 0; i < commands.length; i++) {
		if (commands[i].shortcut === shortcut.toUpperCase()) {
			commandFromShortcut = commands[i].command;
		}
	}
	return commandFromShortcut
}