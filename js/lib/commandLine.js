"use strict";

function CommandLine(cmd_Line) {

    this.cmdLine = cmd_Line;
    this.prompt = "Command:";
    this.command = "";
    this.update();

}

CommandLine.prototype.clearPrompt = function () {
    var currentPrompt = this.prompt;
    this.prompt = "";
    this.prompt = currentPrompt;
    this.command = "";
    this.update();
}

CommandLine.prototype.resetPrompt = function () {
    this.prompt = "";
    this.prompt = "Command:";
    this.command = "";
    this.update();
}

CommandLine.prototype.setPrompt = function (prompt) {
    this.prompt = activeCommand.type + ": " + prompt;
	this.command = "";
    this.update();
}

CommandLine.prototype.setPromptText = function (promptString) {
    this.prompt = activeCommand.type + ": " + promptString;
	this.command = "";
    this.update();
}

CommandLine.prototype.update = function () {
	//console.log("Command: ", this.command)
	//console.log("Prompt: ", this.prompt)
    this.cmdLine.value = this.prompt + this.command
}

CommandLine.prototype.handleKeys = function (e) {
    var charCode = (e.charCode) ? e.charCode : e.keyCode;
    //console.log("[CommandLine.handleKeys] - Key pressed - char:" + charCode + " String:" + String.fromCharCode(charCode) ) //+ " keyboardmap: " + this.keyboardmap(charCode))

    switch (charCode) {

        case 8: //Backspace
            this.backPressed(e);
            break;
        case 9: //Tab
            break;
        case 13: //Enter
            this.enterPressed(e);
            break;
        case 16: // Shift
            break;
        case 17: // Ctrl
            break;
        case 19: // Pause
            break;
        case 20: // Caps
            break;
        case 27: // Escape
            var data = [];
            sceneControl("RightClick", []);
            break;
        case 32: // space
            this.enterPressed(e);
            break;
        case 33: // PgUp
            break;
        case 34: // PgDn
            break;
        case 35: // End
            break;
        case 36: // Home
            break;
        case 37: // Left-Arrow
            this.leftPressed(e);
            break;
        case 38: // Up-Arrow
            this.previousCommand("up");
            break;
        case 39: // Right-Arrow
            break;
        case 40: // Down-Arrow
            this.previousCommand("down");
            break;
        case 45: // Insert
            break;
        case 46: // Delete
			this.deletePressed(e)
            break;
        case 91: // Windows / Meta
            break;
        case 112: // F1
            e.preventDefault();
            showSettings()
            changeTab(event, 'Help')
            break;
        case 113: // F2
            e.preventDefault();
            break;
        case 114: // F3
            this.disableSnaps(e);
            break;
        case 115: // F4
            e.preventDefault();
            break;
        case 116: // F5
            e.preventDefault();
            break;
        case 117: // F6
            e.preventDefault();
            break;
        case 118: // F7
            e.preventDefault();
            toggleSnap('drawGrid')
            break;
        case 119: // F8
            e.preventDefault();
            toggleSnap('ortho')
            break;
        case 120: // F9
            e.preventDefault();
            break;
        case 121: // F10
            e.preventDefault();
            toggleSnap('polar');
            break;
        case 122: // F11
            e.preventDefault();
            break;
        case 123: // F12
            e.preventDefault();
            break;
        case 145: // ScrLK
            break;
        case 173: // Mute
            break;
        case 174: // Vol+
            break;
        case 175: // Vol-
            break;

        default:
		//var keyValue = this.keyboardmap(charCode)
		//if(keyValue){
			//console.log("KeyValue: ", keyValue)
			e.preventDefault();
            this.command = this.command + e.key // keyValue; //String.fromCharCode(charCode);
            this.update();
		//}
    }
}

CommandLine.prototype.deletePressed = function (event) {
    if (this.cmdLine.value.length === this.prompt.length) {
       event.preventDefault();
    }
	sceneControl('Enter', ['E'] )
	console.log("[CommandLine.deletePressed]")
}

CommandLine.prototype.backPressed = function (event) {
   if (this.cmdLine.value.length === this.prompt.length) {
       event.preventDefault();
	   this.command = ""
    }else{
	//console.log("[CommandLine.backPressed]")
	
	this.command = this.command.substring(0, this.command.length-1)
	this.update();
	}
}

CommandLine.prototype.leftPressed = function (event) {
    if (this.cmdLine.value.slice(0, this.cmdLine.selectionStart).length === this.prompt.length) {
        event.preventDefault();
    }
}

CommandLine.prototype.previousCommand = function (direction) {

    if (direction === "up") {
        if (lastCommand.length > 0 && lastCommandPosition < (lastCommand.length - 1)) {
            lastCommandPosition++;
            this.command = lastCommand[lastCommandPosition];
            this.update();
        }
        console.log("[CommandLine.previousCommand] LastCommandPosition: " + lastCommandPosition)
    } else if (direction === "down") {
        if (lastCommandPosition > 0) {
            lastCommandPosition--;
            this.command = lastCommand[lastCommandPosition];
            this.update();
        } else if (lastCommandPosition === 0) {
            reset();
            console.log("[CommandLine.previousCommand] LastCommandPosition: " + lastCommandPosition);

        }
    }
}

CommandLine.prototype.enterPressed = function (event) {
    event.preventDefault();
    //console.log(" UI_Scene.js - Return Pressed")
    
    if (this.cmdLine.value.length > this.prompt.length) {
        //get the inputprompt and remove the prompt text
        var inputCommand = this.cmdLine.value.slice(this.prompt.length)
        console.log("[CommandLine.enterPressed] - Command:", inputCommand)
        var data = [inputCommand]
        //console.log(data[0])
        sceneControl("Enter", data);
    } else {
        var data = [];
        sceneControl("Enter", data);
    }
}

CommandLine.prototype.mouseup = function (event){
    console.log("[CommandLine.mousedown]")
    
    this.cmdLine.selectionStart = this.cmdLine.selectionEnd = this.cmdLine.value.length;  
}

CommandLine.prototype.disableSnaps = function (event) {
    event.preventDefault();

    toggleSnap('endSnap')
    toggleSnap('midSnap')
    toggleSnap('centreSnap')
    toggleSnap('nearestSnap')
}

/*
CommandLine.prototype.keyboardmap = function(keycode){
	
var keyboardMap = [
  "", // [0]
  "", // [1]
  "", // [2]
  "CANCEL", // [3]
  "", // [4]
  "", // [5]
  "HELP", // [6]
  "", // [7]
  "BACK_SPACE", // [8]
  "TAB", // [9]
  "", // [10]
  "", // [11]
  "CLEAR", // [12]
  "ENTER", // [13]
  "ENTER_SPECIAL", // [14]
  "", // [15]
  "", // [SHIFT][16]
  "", // [CONTROL][17]
  "ALT", // [18]
  "PAUSE", // [19]
  "", // [CAPS_LOCK][20]
  "KANA", // [21]
  "EISU", // [22]
  "JUNJA", // [23]
  "FINAL", // [24]
  "HANJA", // [25]
  "", // [26]
  "ESCAPE", // [27]
  "CONVERT", // [28]
  "NONCONVERT", // [29]
  "ACCEPT", // [30]
  "MODECHANGE", // [31]
  "SPACE", // [32]
  "PAGE_UP", // [33]
  "PAGE_DOWN", // [34]
  "END", // [35]
  "HOME", // [36]
  "LEFT", // [37]
  "UP", // [38]
  "RIGHT", // [39]
  "DOWN", // [40]
  "SELECT", // [41]
  "PRINT", // [42]
  "EXECUTE", // [43]
  "PRINTSCREEN", // [44]
  "INSERT", // [45]
  "DELETE", // [46]
  "", // [47]
  "0", // [48]
  "1", // [49]
  "2", // [50]
  "3", // [51]
  "4", // [52]
  "5", // [53]
  "6", // [54]
  "7", // [55]
  "8", // [56]
  "9", // [57]
  ":", // [58]
  ";", // [59]
  "<", // [60]
  "=", // [61]
  ">", // [62]
  "?", // [63]
  "AT", // [64]
  "A", // [65]
  "B", // [66]
  "C", // [67]
  "D", // [68]
  "E", // [69]
  "F", // [70]
  "G", // [71]
  "H", // [72]
  "I", // [73]
  "J", // [74]
  "K", // [75]
  "L", // [76]
  "M", // [77]
  "N", // [78]
  "O", // [79]
  "P", // [80]
  "Q", // [81]
  "R", // [82]
  "S", // [83]
  "T", // [84]
  "U", // [85]
  "V", // [86]
  "W", // [87]
  "X", // [88]
  "Y", // [89]
  "Z", // [90]
  "", // [OS_KEY][91] Windows Key (Windows) or Command Key (Mac)
  "", // [92]
  "CONTEXT_MENU", // [93]
  "", // [94]
  "SLEEP", // [95]
  "0", // [96]
  "1", // [97]
  "2", // [98]
  "3", // [99]
  "4", // [100]
  "5", // [101]
  "6", // [102]
  "7", // [103]
  "8", // [104]
  "9", // [105]
  "*", // [106]
  "+", // [107]
  "SEPARATOR", // [108]
  "-", // [109]
  ".", // [110]
  "/", // [111]
  "F1", // [112]
  "F2", // [113]
  "F3", // [114]
  "F4", // [115]
  "F5", // [116]
  "F6", // [117]
  "F7", // [118]
  "F8", // [119]
  "F9", // [120]
  "F10", // [121]
  "F11", // [122]
  "F12", // [123]
  "F13", // [124]
  "F14", // [125]
  "F15", // [126]
  "F16", // [127]
  "F17", // [128]
  "F18", // [129]
  "F19", // [130]
  "F20", // [131]
  "F21", // [132]
  "F22", // [133]
  "F23", // [134]
  "F24", // [135]
  "", // [136]
  "", // [137]
  "", // [138]
  "", // [139]
  "", // [140]
  "", // [141]
  "", // [142]
  "", // [143]
  "", // [NUM_LOCK][144]
  "SCROLL_LOCK", // [145]
  "WIN_OEM_FJ_JISHO", // [146]
  "WIN_OEM_FJ_MASSHOU", // [147]
  "WIN_OEM_FJ_TOUROKU", // [148]
  "WIN_OEM_FJ_LOYA", // [149]
  "WIN_OEM_FJ_ROYA", // [150]
  "", // [151]
  "", // [152]
  "", // [153]
  "", // [154]
  "", // [155]
  "", // [156]
  "", // [157]
  "", // [158]
  "", // [159]
  "CIRCUMFLEX", // [160]
  "EXCLAMATION", // [161]
  "DOUBLE_QUOTE", // [162]
  "#", // [163]
  "$", // [164]
  "%", // [165]
  "&", // [166]
  "_", // [167]
  "OPEN_PAREN", // [168]
  "CLOSE_PAREN", // [169]
  "ASTERISK", // [170]
  "PLUS", // [171]
  "PIPE", // [172]
  "HYPHEN_MINUS", // [173]
  "OPEN_CURLY_BRACKET", // [174]
  "CLOSE_CURLY_BRACKET", // [175]
  "TILDE", // [176]
  "", // [177]
  "", // [178]
  "", // [179]
  "", // [180]
  "VOLUME_MUTE", // [181]
  "VOLUME_DOWN", // [182]
  "VOLUME_UP", // [183]
  "", // [184]
  "", // [185]
  ";", // [186]
  "=", // [187]
  ",", // [188]
  "-", // [189]
  ".", // [190]
  "/", // [191]
  "BACK_QUOTE", // [192]
  "", // [193]
  "", // [194]
  "", // [195]
  "", // [196]
  "", // [197]
  "", // [198]
  "", // [199]
  "", // [200]
  "", // [201]
  "", // [202]
  "", // [203]
  "", // [204]
  "", // [205]
  "", // [206]
  "", // [207]
  "", // [208]
  "", // [209]
  "", // [210]
  "", // [211]
  "", // [212]
  "", // [213]
  "", // [214]
  "", // [215]
  "", // [216]
  "", // [217]
  "", // [218]
  "OPEN_BRACKET", // [219]
  "BACK_SLASH", // [220]
  "CLOSE_BRACKET", // [221]
  "QUOTE", // [222]
  "", // [223]
  "META", // [224]
  "ALTGR", // [225]
  "", // [226]
  "WIN_ICO_HELP", // [227]
  "WIN_ICO_00", // [228]
  "", // [229]
  "WIN_ICO_CLEAR", // [230]
  "", // [231]
  "", // [232]
  "WIN_OEM_RESET", // [233]
  "WIN_OEM_JUMP", // [234]
  "WIN_OEM_PA1", // [235]
  "WIN_OEM_PA2", // [236]
  "WIN_OEM_PA3", // [237]
  "WIN_OEM_WSCTRL", // [238]
  "WIN_OEM_CUSEL", // [239]
  "WIN_OEM_ATTN", // [240]
  "WIN_OEM_FINISH", // [241]
  "WIN_OEM_COPY", // [242]
  "WIN_OEM_AUTO", // [243]
  "WIN_OEM_ENLW", // [244]
  "WIN_OEM_BACKTAB", // [245]
  "ATTN", // [246]
  "CRSEL", // [247]
  "EXSEL", // [248]
  "EREOF", // [249]
  "PLAY", // [250]
  "ZOOM", // [251]
  "", // [252]
  "PA1", // [253]
  "WIN_OEM_CLEAR", // [254]
  "" // [255]
];

return keyboardMap[keycode]
}
*/