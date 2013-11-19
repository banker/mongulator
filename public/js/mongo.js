// TryMongo
//
// Copyright (c) 2009 Kyle Banker
// Licensed under the MIT Licence.
// http://www.opensource.org/licenses/mit-license.php

// Readline class to handle line input.
var ReadLine = function(options) {
  this.options      = options || {};
  this.htmlForInput = this.options.htmlForInput;
  this.inputHandler = this.options.handler || this.mockHandler;
  this.scoper       = this.options.scoper;
  this.connection   = new Connection();
  this.terminal     = $(this.options.terminalId || "#terminal");
  this.lineClass    = this.options.lineClass || '.readLine';
  this.history      = [];
  this.historyPtr   = 0;

  this.initialize();
};

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

    this.activeLine.focus();
  },

  // Returns the 'next' or 'previous' command in this history.
  getCommand: function(direction) {
    if(this.history.length === 0) {
      return;
    }
    this.adjustHistoryPointer(direction);
    this.activeLine[0].value = this.history[this.historyPtr];
    $(this.activeLine[0]).focus();
    //this.activeLine[0].value = this.activeLine[0].value;
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
    if((lineValue = value.trim()) !== "") {
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
    if(response.length < 3) {
      this.activeLine.parent().append("<p class='response'></p>");
    }
    else {
      this.activeLine.parent().append("<p class='response'>" + response + "</p>");
    }
  },

  // Simply return the entered string if the user hasn't specified a smarter handler.
  mockHandler: function(inputString) {
    return function() {
      this._process = function() { return inputString; };
    };
  }
};

var MongoHandler = function() {
  this._connection     = new Connection();
  this._currentCommand = "";
  this._rawCommand     = "";
  this._commandStack   = 0;
  this._currentDB      = "test";
  this._tutorialPtr    = 0;
  this._tutorialMax    = 10;

  this._mongo          = {};
  this._mongo.test     = [];
  this.db              = this._mongo.test;
  this._dbPtr          = 'test';
  this.collections     = [];
};

MongoHandler.prototype = {

  _process: function(inputString, errorCheck) {
    this._rawCommand += ' ' + inputString;

    try {
      inputString += '  '; // fixes certain bugs with the tokenizer.
      var tokens    = inputString.tokens();
      var mongoFunc = this._getCommand(tokens);
      if(this._commandStack === 0 && inputString.match(/^\s*$/)) {
        return {stack: 0, result: ''};
      }
      else if(this._commandStack === 0 && mongoFunc) {
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
      if(matches && matches.length == 2 && 
          errorCheck !== true && !this.collections.include(matches[1])) {
        this._currentCommand = "";
        this._createCollection(matches[1]);
        return this._process(this._rawCommand, true);
      }

      // Catch js errors.
      else {
        this._resetCurrentCommand();
        return {stack: 0, result: "JS Error: " + err};
      }
    }
  },

  // Calls eval on the input string when ready.
  _evaluator: function(tokens) {
    this._currentCommand += " " + this._massageTokens(tokens);
    if(this._shouldEvaluateCommand(tokens))  {
        db    = this.db;
        print = this.print;

        // So this eval statement is the heart of the REPL.
        var result = eval(this._currentCommand.trim());
        if(result === undefined) {
          throw('result is undefined');
        }
        else if(result.toString().match(/DBCursor/)) {
          if(this._currentCommand.match(/=/)) {
            result = "Cursor";
          }
          else {
            result = $htmlFormat(result.iterate());
          }
        }
        else {
          result = $htmlFormat(result);
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

    if(this._commandStack === 0) {
      return true;
    }
    else {
      return false;
    }
  },

  _massageTokens: function(tokens) {
    for(var i=0; i < tokens.length; i++) {
      if(tokens[i].type == 'name') {
        if(tokens[i].value == 'var') {
          tokens[i].value = '';
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

  // print output to the screen, e.g., in a loop
  // TODO: remove dependency here
  print: function() {
   $('.readLine.active').parent().append('<p>' + arguments[0] + '</p>');
   return "";
  },

  /* MongoDB     */
  /* ________________________________________ */

  // create a new database collection.
  _createCollection: function(name) {
    this.collections.push(name);
    this.db[name] = new DBCollection(this._connection, this._dbPtr, 'short', name);
  },
 
  // help command
  _help: function() {
      return PTAG('HELP') + 
             PTAG('Note: Only a subset of MongoDB\'s features are provided here.') +
             PTAG('For everything else, download and install at mongodb.org.') +
             PTAG('db.foo.help()                 help on collection methods') +
             PTAG('db.foo.find()                 list objects in collection foo') +
             PTAG('db.foo.save({a: 1})           save a document to collection foo') +
             PTAG('db.foo.update({a: 1}, {a: 2}) update document where a == 1') +
             PTAG('db.foo.find({a: 1})           list objects in foo where a == 1') +
             PTAG('it                            use to further iterate over a cursor');

  },

  _use: function() {
    return "Sorry, you can't change the database you're using."
  },

  _tutorial: function() {
    this._tutorialPtr = 0;
    return PTAG("This is a self-guided tutorial on MongoDB and the MongoDB shell.") +
           PTAG("The tutorial is simple, more or less a few basic commands to try.") +
           PTAG("To go directly to any part tutorial, enter one of the commands t0, t1, t2...t10") +
           PTAG("Otherwise, use 'next' and 'back'. Start by typing 'next' and pressing enter.");
  },

  // go to the next step in the tutorial.
  _next: function() {
    if(this._tutorialPtr < this._tutorialMax) {
      return this['_t' + (this._tutorialPtr + 1)]();
    }
    else {
      return "You've reached the end of the tutorial. To go to the beginning, type 'tutorial'";
    }
  },

  // go to the previous step in the tutorial.
  _back: function() {
    if(this._tutorialPtr > 1) {
      return this['_t' + (this._tutorialPtr - 1)]();
    }
    else {
      return this._tutorial();
    }
  },

  _t1: function() {
    this._tutorialPtr = 1;
    return PTAG('1. JavaScript Shell') +
           PTAG('The first thing to notice is that the MongoDB shell is JavaScript-based.') +
           PTAG('So you can do things like:') +
           PTAG('  a = 5; ') +
           PTAG('  a * 10; ') +
           PTAG("  for(i=0; i<10; i++) { print('hello'); }; ") +
           PTAG("Try a few JS commands; when you're ready to move on, enter 'next'");

  },

  _t2: function() {
    this._tutorialPtr = 2;
    return PTAG("2. Documents") +
           PTAG("MongoDB is a document database. This means that we store data as documents,") +
           PTAG("which are similar to JavaScript objects. Here below are a few sample JS objects:") +
           PTAG('  var a = {age: 25}; ') +
           PTAG("  var n = {name: 'Ed', languages: ['c', 'ruby', 'js']}; ") +
           PTAG("  var student = {name: 'Jim', scores: [75, 99, 87.2]}; ") +
           PTAG("Create some documents, then enter 'next'");
  },


  _t3: function() {
    this._tutorialPtr = 3;
    return PTAG('3. Saving') +
           PTAG("Here's how you save a document to MongoDB:") +
           PTAG("  db.scores.save({a: 99}); ") +
           BR() +
           PTAG("This says, \"save the document '{a: 99}' to the 'scores' collection.\"") +
           PTAG("Go ahead and try it. Then, to see if the document was saved, try") +
           PTAG("  db.scores.find(); ") +
           PTAG("Once you've tried this, type 'next'.") +
           BR();
  },

  _t4: function() {
    this._tutorialPtr = 4;
    return PTAG('4. Saving and Querying') +
           PTAG("Try adding some documents to the scores collection:") +
           PTAG("  for(i=0; i<10; i++) { db.scores.save({a: i, exam: 5}) }; ") +
           BR() +
           PTAG("Try that, then enter") +
           PTAG("  db.scores.find(); ") +
           PTAG("to see if the save succeeded. Since the shell only displays 10 results at time,") +
           PTAG("you'll need to enter the 'it' command to iterate over the rest.") +
           BR() +
           PTAG("(enter 'next' when you're ready)");
  },

  _t5: function() {
    this._tutorialPtr = 5;
    return PTAG('5. Basic Queries') +
           PTAG("You've already tried a few queries, but let's make them more specific.") +
           PTAG("How about finding all documents where a == 2:") +
           PTAG("  db.scores.find({a: 2}); ") +
           BR() +
           PTAG("Or what about documents where a > 15?") +
           PTAG("  db.scores.find({a: {'$gt': 15}}); ") +
           BR();
  },

   _t6: function() {
    this._tutorialPtr = 6;
    return PTAG('6. Query Operators') +
           PTAG("Query Operators:") +
           PTAG("$gt is one of many special query operators. Here are few others:") +
           PTAG("  $lt  - '<',   $lte - '<=', ") +
           PTAG("  $gte - '>=',  $ne  - '!='") +
           PTAG("  $in - 'is in array',  $nin - '! in array'") +
           BR() +
           PTAG("db.scores.find({a: {'$in': [2, 3, 4]}}); ") +
           PTAG("db.scores.find({a: {'$gte': 2, '$lte': 4}}); ") +
           PTAG("Try creating some queries, then type 'next.'") +
           BR();
  },

  _t7: function() {
    this._tutorialPtr = 7;
    return PTAG('7. Updates') +
           PTAG("Now create a couple documents like these for updating:") +
           PTAG("  db.users.save({name: 'Johnny', languages: ['ruby', 'c']}); ") +
           PTAG("  db.users.save({name: 'Sue', languages: ['scala', 'lisp']}); ") +
           PTAG("Make sure they were saved by calling db.users.find()") +
           PTAG("Update the first document like so:") +
           PTAG("  db.users.update({name: 'Johnny'}, {name: 'Cash', languages: ['english']}); ");
  },

  _t8: function() {
    this._tutorialPtr = 8;
    return PTAG('8. Update Operators') +
           PTAG("The previous update replaced the entire document, but MongoDB also") +
           PTAG("supports partial updates to documents. For example, you can set a value:") +
           PTAG("  db.users.update({name: 'Cash'}, {'$set': {'age': 50} }); ") +
           PTAG("You can also push and pull items from arrays:") +
           PTAG("  db.users.update({name: 'Sue'}, {'$pull': {'languages': 'scala'} }); ") +
           PTAG("  db.users.update({name: 'Sue'}, {'$push': {'languages': 'ruby'} }); ") +
           PTAG("Give these a try, check the results, and then enter 'next'.");
  },

  _t9: function() {
    this._tutorialPtr = 9;
    return PTAG('9. Deleting data') +
           PTAG("To delete matching documents only, add a query selector to the remove method:") +
           PTAG("  db.users.remove({name: 'Sue'});") +
           PTAG("To delete everything from a collection:") +
           PTAG("  db.scores.remove();");
  },

  _t10: function() {
    this._tutorialPtr = 10;
    return PTAG('10. Now go download it!') +
           PTAG("There's a lot more to MongoDB than what's presented in this tutorial.") +
           PTAG("Best thing is to go to the <a target='_blank' href='http://www.mongodb.org/display/DOCS/Downloads'>downloads page</a> or to <a target='_blank' href='http://mongodb.org'>mongodb.org</a> to check out the docs.") +
           PTAG("(You can also keep fiddling around here, but you'll be a bit limited.)") +
           BR() +
           PTAG("You can also sign up for a chance to win a MongoDB t-shirt or mug. But first") +
           PTAG("a little challenge: enter your e-mail address, first, and last name into the") +
           PTAG("'email' collection, using fields 'email', 'first_name', and 'last_name'.");
  },

  _iterate: function() {
    return $htmlFormat($lastCursor.iterate());
  },

  _showCollections: function() {
    var cursor  = new DBCursor('system.namespaces', {}, {});
    var results = cursor.iterate(); 
    var collections = [];
    results.forEach(function(col) {
      if(!col.name.match(/\$/)) {
        name = col.name.match(/(\w+\.)(.*)/)[2];
        collections.push(name);
      }
    });
    return $htmlFormat(collections);
  },

  _getCommand: function(tokens) {
    if(tokens[0] && MongoKeywords.include((tokens[0].value + '').toLowerCase())) {
      switch(tokens[0].value.toLowerCase()) {
        case 'help':
          return this._help;
        case 'use':
          return this._use;
        case 'tutorial':
          return this._tutorial;
        case 'next':
          return this._next;
        case 'back':
          return this._back;
        case 't0':
          return this._tutorial;
        case 't1':
          return this._t1;
        case 't2':
          return this._t2;
        case 't3':
          return this._t3;
        case 't4':
          return this._t4;
        case 't5':
          return this._t5;
        case 't6':
          return this._t6;
        case 't7':
          return this._t7;
        case 't8':
          return this._t8;
        case 't9':
          return this._t9;
        case 't10':
          return this._t10;
        case 'show':
          if(tokens[1].value.toLowerCase() == 'collections') {
            return this._showCollections;
          }
          else {
            return null;
          }
        case 'it':
          return this._iterate;
      }
    }
  }
};

$htmlFormat = function(obj) {
  return tojson(obj, ' ', ' ', true);
}

$(document).ready(function() {
  var mongo       = new MongoHandler();
  var terminal    = new ReadLine({htmlForInput: DefaultInputHtml,
                                  handler: mongo._process,
                                  scoper: mongo});
});
