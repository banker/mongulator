/*
TryMongo
Author: Kyle Banker (http://www.kylebanker.com)
Date: September 1, 2009
 
(c) Creative Commons 2009
http://creativecommons.org/licenses/by-sa/2.5/
*/

// Readline class to handle line input.
var ReadLine = function(options) {
  this.options      = options || {};
  this.htmlForInput = this.options.htmlForInput;
  this.inputHandler = this.options.handler || this.mockHandler;
  this.scoper       = this.options.scoper;
  this.terminal     = $(this.options.terminalId || "#terminal");
  this.lineClass    = this.options.lineClass || '.readLine';
  this.history      = [];
  this.historyPtr   = 0;

  this.initialize();
}

ReadLine.prototype = {

  initialize: function() {
    this.addInputLine();
  },

  // Enter a new input line with proper behavior.
  addInputLine: function(stackLevel) {
    stackLevel = stackLevel || 0;
    this.terminal.append(this.htmlForInput(stackLevel));
    var ctx = this;
    ctx.activeLine = $(this.lineClass + '.active');

    // Bind key events for entering and navigting history.
    ctx.activeLine.bind("keydown", function(ev) {
      switch (ev.keyCode) {
        case EnterKeyCode:
          ctx.processInput(this.value); 
          break;
        case UpArrowKeyCode: 
          ctx.getCommand('previous');
          break;
        case DownArrowKeyCode: 
          ctx.getCommand('next');
          break;
      }
    });

    $(document).bind("keydown", function(ev) {
      ctx.activeLine.focus();
    });

    this.activeLine.focus();
  },

  // Returns the 'next' or 'previous' command in this history.
  getCommand: function(direction) {
    if(this.history.length == 0) {
      return;
    }
    this.adjustHistoryPointer(direction);
    this.activeLine[0].value = this.history[this.historyPtr];
    this.activeLine.focus();
    this.activeLine[0].value = this.activeLine[0].value;
  },

  // Moves the history pointer to the 'next' or 'previous' position. 
  adjustHistoryPointer: function(direction) {
    if(direction == 'previous') {
      if(this.historyPtr - 1 >= 0) {
        this.historyPtr -= 1;
      }
    }
    else {
      if(this.historyPtr + 1 < this.history.length) {
        this.historyPtr += 1;
      }
    }
  },

  // Return the handler's response.
  processInput: function(value) {
    var response = this.inputHandler.apply(this.scoper, [value]);
    this.insertResponse(response.result);
    
    // Save to the command history...
    if((lineValue = value.trim()) != "") {
      this.history.push(lineValue);
      this.historyPtr = this.history.length;
    }

    // deactivate the line...
    this.activeLine.value = "";
    this.activeLine.attr({disabled: true});
    this.activeLine.removeClass('active');

    // and add add a new command line.
    this.addInputLine(response.stack);
  },

  insertResponse: function(response) {
    if(response != "") {
      this.activeLine.parent().append("<p class='response'>" + response + "</p>");
    }
  },

  // Simply return the entered string if the user hasn't specified a smarter handler.
  mockHandler: function(inputString) {
    return inputString; 
  }
}

var MongoHandler = function() {
  this._currentCommand = "";
  this._rawCommand     = "";
  this._commandStack   = 0;
  this._currentDB      = "test";

  this._mongo          = {};
  this._mongo['test']  = [];
  this.db              = this._mongo['test'];
  this._dbPtr       = 'test';
}

MongoHandler.prototype = {

  _process: function(inputString, errorCheck) {
    this._rawCommand += ' ' + inputString;

    try {
      inputString += '  '; // fixes certain bugs with the tokenizer.
      var tokens    = inputString.tokens();
      var mongoFunc = this._getCommand(tokens);
      if(this._commandStack == 0 && mongoFunc) {
        this._resetCurrentCommand();
        return {stack: 0, result: mongoFunc.apply(this, [tokens])};
      }
      else {
        return this._evaluator(tokens);
      }
    }

    catch(err) {
      
      // Allows for dynamic creation of db collections.
      // We catch the exception, create the collection, then try the command again.
      matches = this._currentCommand.match(/db\.(\w+)/);
      if(errorCheck != true && matches.length == 2) {
        this._currentCommand = "";
        this._createCollection(matches[1]);
        return this._process(this._rawCommand, true);
      }

      // Catch js errors.
      else {
        this._resetCurrentCommand = "";
        return {stack: 0, result: "JS Error: " + err};
      }
    }
  },

  // Calls eval on the input string when ready.
  _evaluator: function(tokens) {
    this._currentCommand += " " + this._scopeVars(tokens);
    if(this._shouldEvaluateCommand(tokens))  {
      
        // So this is the heart of the REPL.
        var result = Inspect(eval(this._currentCommand.trim()));
        if(result === undefined) {
          throw('error');
        }
        this._resetCurrentCommand();
        return {stack: this._commandStack, result: result};
      }
    else {
      return {stack: this._commandStack, result: ""};
    }
  },

  _resetCurrentCommand: function() {
    this._currentCommand = '';
    this._rawCommand     = '';
  },

  // Evaluate only when we've exited any blocks.
  _shouldEvaluateCommand: function(tokens) {
    for(var i=0; i < tokens.length; i++) {
      var token = tokens[i];
      if(token.type == 'operator') {
        if(token.value == '(' || token.value == '{') {
          this._commandStack += 1;
        }
        else if(token.value == ')' || token.value == '}') {
          this._commandStack -= 1;
        }
      }
    }

    if(this._commandStack == 0) {
      return true;
    }
    else {
      return false;
    }
  },

  // Adds 'this' to scope any vars locally;
  // also removes the 'var' keywords (a tiny hack).
  _scopeVars: function(tokens) {
    for(var i=0; i < tokens.length; i++) {
      if(tokens[i].type == 'name') {
        if(tokens[i].value == 'var') {
          tokens[i].value = '';
        }
        else if(!JavascriptKeywords.include(tokens[i].value.toLowerCase()) &&
                !JavascriptClassNames.include(tokens[i].value)) {
          // And it's not a json name or an object reference...
          if(!(tokens[i+1] && tokens[i+1].type == 'operator' && tokens[i+1].value == ':') &&
              !(tokens[i-1] && tokens[i-1].type == 'operator' && tokens[i-1].value == '.')) {
            tokens[i].value = "this." + tokens[i].value;
          }
        }
      }
    }
    return this._collectTokens(tokens);
  },

  // Collects tokens into a string, placing spaces between variables.
  // This methods is called after we scope the vars.
  _collectTokens: function(tokens) {
    var result = "";
    for(var i=0; i < tokens.length; i++) {
      if(tokens[i].type == "name" && tokens[i+1] && tokens[i+1].type == 'name') {
        result += tokens[i].value + ' ';
      }
      else if (tokens[i].type == 'string') {
        result += "'" + tokens[i].value + "'";
      }
      else {
        result += tokens[i].value;
      }
    }
    return result;
  },

  // printsh output to the screen, e.g., in a loop
  // TODO: remove dependency here
  print: function() {
   $('.readline.active').parent().append('<p>' + arguments[0] + '</p>');      
   return '';
  },

  /* MongoDB     */
  /* ________________________________________ */

  // Selects a new db. 
  _selectDB: function(name) {
    this._mongo[this._dbPtr] = this.db;
    if(!this._mongo[name]) {
      this._mongo[name] = [];
    }
    this._dbPtr = name;
    this.db        = this._mongo[this._dbPtr];
    return this.db;
  },

  // create a new database collection.
  _createCollection: function(name) {
    this.db[name] = new DBCollection();
  },
 
  // use [db_name]
  use: function(tokens) {
    this._selectDB(tokens[1].value + '');
    return "switched to db " + this._dbPtr;
  },

  // help command
  help: function() {
      return PTAG('HELP') + 
            PTAG('show dbs                     show database names') + 
            PTAG('show collections             show collections in current database') + 
            PTAG('use [db_name]                set curent database to [db_name]') +
            PTAG('db.help()                    help on DB methods') +
            PTAG('db.foo.help()                help on collection methods') +
            PTAG('db.foo.find()                list objects in collection foo') +
            PTAG('db.foo.find( { a : 1 } )     list objects in foo where a == 1') +
            PTAG('it                           result of the last line evaluated; use to further iterate');
  },

  _getCommand: function(tokens) {
    if(MongoKeywords.include((tokens[0].value + '').toLowerCase())) {
      switch(tokens[0].value.toLowerCase()) {
        case 'help':
          return this.help;
        case 'use':
          return this.use;
      }
    }
  }
}

$(document).ready(function() {
  var mongo       = new MongoHandler();
  var terminal    = new ReadLine({htmlForInput: DefaultInputHtml, 
                                  handler: mongo._process, 
                                  scoper: mongo});
});
