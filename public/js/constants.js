// TryMongo
//
// Copyright (c) 2009 Kyle Banker
// Licensed under the MIT Licence.
// http://www.opensource.org/licenses/mit-license.php

var DefaultInputHtml = function(stack) {
    var linePrompt = "";
    if(stack == 0) {
      linePrompt += "<span class='prompt'> ></span>";
    }
    else {
      for(var i=0; i <= stack; i++) {
        linePrompt += "<span class='prompt'>.</span>";
      }
    }
    return "<div class='line'>" +
           linePrompt +
           "<input type='text' class='readLine active' />" +
           "</div>";
}

var EnterKeyCode     = 13;
var UpArrowKeyCode   = 38;
var DownArrowKeyCode = 40;

var PTAG = function(str) {
  return "<pre>" + str + "</pre>";
}

var BR = function() {
  return "<br/>";
}

var JavascriptKeywords = ['abstract', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'alert', 'date', 'eval'];

var JavascriptClassNames = ['Array', 'String', 'Object']

var MongoKeywords = ['use', 'help', 'it', 'show', 'tutorial', 'next', 'back', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10'];
