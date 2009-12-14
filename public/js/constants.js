/*
TryMongo
Author: Kyle Banker (http://www.kylebanker.com)
Date: September 1, 2009
 
(c) Creative Commons 2009
http://creativecommons.org/licenses/by-sa/2.5/
*/
// TODO: Organize this a bit.

var DefaultInputHtml = function(stack) {
    var linePrompt = "";
    for(var i=0; i <= stack; i++) {
      linePrompt += "<span class='prompt'> ></span>";
    }
    return "<div class='line'>" +
           linePrompt +
           "<input type='text' class='readLine active' />" +
           "<img class='spinner' src='/img/spinner.gif' style='display:none;' /></div>";
}

var EnterKeyCode     = 13;
var UpArrowKeyCode   = 38;
var DownArrowKeyCode = 40;

var PTAG = function(str) {
  return "<pre>" + str + "</pre>";
}

var JavascriptKeywords = ['abstract', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'alert', 'date', 'eval'];

var JavascriptClassNames = ['Array', 'String', 'Object']

var MongoKeywords = ['help', 'it', 'show'];
