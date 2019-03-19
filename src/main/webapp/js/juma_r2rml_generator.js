'use strict';

// Code based on the JavaScript generator available at https://github.com/google/blockly

var R2RML = new Blockly.Generator('R2RML');
/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
R2RML.addReservedWords('');

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
R2RML.init = function(workspace) {

};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
R2RML.finish = function(code) {
  return '# Mapping created using Juma editor. '
                + '\n  @prefix rr: <http://www.w3.org/ns/r2rml#> .'
                + '\n  @prefix rrf: <http://kdeg.scss.tcd.ie/ns/rrf#> . \n' 
                + code
                + generateFunctions();
};

var functions = {};
var loads = '';

function generateFunctions() {
  var code = '';
  for(var key in functions) {
   var functionName = key;
   var functionArgs = functions[key];
   code += '<#' + functionName + '>\n';
   code += '  rrf:functionName \"' + functionName + '\";';
   code += '\n  rrf:functionBody \"\"\"\n     ' + getFunctionBy(functionName, generateFuncArgsR2RML(functionArgs)) + '\n  \"\"\";\n.\n\n';
  }
  functions = {}; 
  if(loads != ''){
   code += '<#Loads>\n';
   code += '  rrf:functionName \"loads\";';
   code += '\n  rrf:functionBody \"\"\"\n  ' + loads + '  \n  \"\"\";\n.\n\n';

  }
  loads = '';
  return code;
}

function generateFuncArgsR2RML(funcArgs){
  var args = [];
  for (var i = 0; i < funcArgs.length; i++) {
    args.push('args' + i);
  }
  return args;
}

function getFunctionBy(functionName, funcArgs) {
  var func = 'function ' + functionName + '(' + funcArgs + ')';
  if(functionName.startsWith('Concat') && funcArgs.length > 1) {
    return func + '{' + generateConcat(funcArgs) + '}';
  } else if(functionName == 'Replace' && funcArgs.length == 3) {
    return func + '{ return args2.replace(args0, args1); }';
  } else if(functionName == 'Substring'&& funcArgs.length == 3) {
    return func + '{ return args0.substring(args1, args2); }';
  } else if(functionName == 'Sum' && funcArgs.length > 1) {
    return func + '{' + generateSum(funcArgs) + '}';
  } else if(functionName == 'Avg' && funcArgs.length > 1) {
    return func + '{' + generateAvg(funcArgs) + '}';
  } else {
    return 'function ' + functionName + 'XXX(' + funcArgs + ') { return ' + func + ';}';
  }
}

function generateConcat(funcArgs){
  var code = '';
  for (var i = 0; i < funcArgs.length; i++) {
    // if(i == 0) {
      // code += 'return ' + funcArgs[i] + '.concat(' + funcArgs[i + 1] + ')';  
    // } else {
      // code += '.concat(' + funcArgs[i + 1] + ')';  
    // }
    if(i == 0) {
      code += 'String(' + funcArgs[i] + ')';
    } else {
      code += ' + String(' + funcArgs[i] + ')';
    }
  }
  return 'return ' + code + ';';
}

function generateSum(funcArgs){
  var code = '';
  for (var i = 0; i < funcArgs.length - 1; i++) {
    if(i == 0) {
      code += 'return Number(' + funcArgs[i] + ') + Number(' + funcArgs[i + 1] + ')';
    } else {
      code += ' + Number(' + funcArgs[i + 1] + ')';  
    }
  }
  return code + ';';
}

function generateAvg(funcArgs){
  var code = '';
  for (var i = 0; i < funcArgs.length -1; i++) {
    if(i == 0) {
      code += 'return (' + funcArgs[i] + ' + ' + funcArgs[i + 1];  
    } else {
      code += ' + ' + funcArgs[i + 1];  
    }
  }
  return code + ') / ' + funcArgs.length + ';';
}

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
R2RML.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped R2RML string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} R2RML string.
 * @private
 */
R2RML.quote_ = function(string) {
  // TODO: This is a quick hack.  Replace with goog.string.quote
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Common tasks for generating R2RML from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The R2RML code created for this block.
 * @return {string} R2RML code with comments and subsequent blocks added.
 * @private
 */
R2RML.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    if (comment) {
      commentCode += R2RML.prefixLines(comment, '# ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var childComment = R2RML.allNestedComments(childBlock);
          if (childComment) {
            commentCode += R2RML.prefixLines(childComment, '# ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = R2RML.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

function isDisconnected(block) {
  return block.getParent() == undefined;
}

R2RML.base = function(block) {
  if (isDisconnected(block)) {
    return '';
  }
  
  var uri = block.getFieldValue('URI');
  return "@base <" + uri + "> .\n";
};

var logicalTable = '';

R2RML.mapping = function(block) {
  if (!block) {
    return '';
  }

  logicalTable =  "rr:logicalTable [ " + R2RML.statementToCode(block, 'mapping') + "];\n";
  var subject =  "\n" + R2RML.statementToCode(block, 'subjects');
  return R2RML.statementToCode(block, 'vocabs') + subject;
};

var subjectProperties = '';
var predicateObjectProperties = '';

R2RML.subjectdef = function(block) {
  var triplemapname = 'TriplesMap' + block.getFieldValue('ID'); 

  subjectProperties = '';
  predicateObjectProperties = '';
  R2RML.statementToCode(block, 'properties');

  return "<#" + triplemapname + ">\n" + logicalTable
              + "\n rr:subjectMap [ \n  " + R2RML.statementToCode(block, 'source') + subjectProperties + "\n ]; "
              + "\n " + predicateObjectProperties + " \n. \n\n"; 
}

R2RML.subject = function(block) {
  return termmap(block);
}

R2RML.prefix = function(block) {
  var prefix = block.getFieldValue('PREFIX');
  var uri = block.getFieldValue('URI');
  return "  @prefix "+ prefix +": <" + uri + "> .\n";
};

R2RML.predefinedprefix = function(block) {
  var prefix = block.getFieldValue('PREFIX');
  return "  @prefix "+ prefix +" .\n";
};

R2RML.bnode = function(block) {
  subjectProperties += "\n    rr:termType rr:BlankNode;";
  return '';
}

R2RML.classes = function(block) {
  var classes = '';
  for (var i = 0; i < this.arguments_.length; i++) {
     classes += "\n    rr:class " + this.arguments_[i] + ";";
  }
  subjectProperties += classes;
  return '';
}

R2RML.tablesqlquery = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  var isTable = block.getFieldValue('TABLESQLQUERY') == 'table';
  var separator = (isTable ? '\"' : '\"\"\"');
  var table = (isTable ? 'rr:tableName ' : 'rr:sqlQuery ');
  return "\n" + table + separator + block.sql + separator + ";\n";
};

function termmap(block) {
  if (isDisconnected(block)) {
    return '';
  }

  var code = "";
  var termmap = block.getFieldValue('TERMMAP');
  if(termmap == 'CONSTANT'){
    code += 'rr:constant';
    code += ' ' + block.getFieldValue('TERMMAPVALUE') + ";";
  } else if(termmap == 'TEMPLATE'){
    code += 'rr:template';
    code += " \"" + block.getFieldValue('TERMMAPVALUE') + "\";";
  } else if (termmap == 'COLUMN'){
    code += 'rr:column';
    code += " \"" + block.getFieldValue('TERMMAPVALUE') + "\";";
  } 

  if(block.type == 'predicatemap'){
    code += '  rr:termType rr:IRI;';
  }

  return code;
}

R2RML.graph = function(block) {
  subjectProperties += '\n    rr:graphMap [ ' + termmap(block) + ' ];';
  return '';
}

R2RML.predicate_object = function(block) {
  predicateObjectProperties += "\nrr:predicateObjectMap [ \n" 
                            + R2RML.statementToCode(block, 'predicate') + "\n "
                            + R2RML.statementToCode(block, 'object') +"];";
  return '';
}

R2RML.predicate = function(block) {
  return "rr:predicateMap [ \n  " + termmap(block) + "\n]; \n";
}

R2RML.object = function(block) {
  var options = '';
  if(block.getFieldValue('WITHTERMTYPE') == 'TRUE'){
    options += '\n  ';
    var option = block.getFieldValue('TERMTYPE');
    if(option == 'termtypeiri') {
      options += 'rr:termType rr:IRI;';
    } else if (option == 'termtypeblanknode') {
      options += 'rr:termType rr:BlankNode;';
    } else if (option == 'termtypeliteral') {
      options += 'rr:termType rr:Literal;';
    } else if (option == 'datatype') {
      options += 'rr:termType rr:Literal;';
      options += '\n  rr:datatype ' + block.getFieldValue('TERMTYPEVALUE') +';';
    } else if (option == 'language') {
      options += 'rr:termType rr:Literal;';
      options += '\n  rr:language \"' + block.getFieldValue('TERMTYPEVALUE') +'\";';
    }
  }
  return "rr:objectMap [ \n  " + termmap(block) +  options  + "\n ]; \n";
}

R2RML.linking_mappings = function(block) {
  var joins = '';
  for (var i = 0; i < this.arguments_.length; i++) {
    var join = this.arguments_[i];

    joins += "\n  rr:joinCondition [ \n   rr:child \"" + join[0] + "\";\n   rr:parent \"" + join[1] + "\";\n ];";
  }
  return "rr:objectMap [\n  rr:parentTriplesMap <#TriplesMap" + block.getFieldValue('LINK') + ">;" + joins + "\n];\n"; 
}

R2RML.concat = function(block) {
  return functioncall(block, ('Concat' + block.arguments_.length));
}

function getParameters(block) {
  if(block.arguments_.length == 0) {
    return '';
  }
  var code = '\n    rrf:parameterBindings (\n';
  for (var i = 0; i < block.arguments_.length; i++) {
    var param = block.arguments_[i];
    var termmap = param[0];
    var termmapvalue = param[1];
    code += '      [ ';
    if(termmap == 'CONSTANT'){
      code += 'rr:constant ' + termmapvalue + ';';
    } else if(termmap == 'TEMPLATE'){
      code += 'rr:template \"' + termmapvalue + '\";';
    } else if (termmap == 'COLUMN'){
      code += 'rr:column \"' + termmapvalue + '\";';
    } 
    code += ']\n';
  }
  return code + '    );\n';
}

function functioncall(block, functionName){
  if(!(functionName in functions))
    functions[functionName] = block.arguments_;

  var code = '';
  code += 'rr:objectMap [';
  if(block.termtype != ''){
    var termtype = block.termtype;
    if(termtype == 'termtypeiri') {
      code += 'rr:termType rr:IRI;';
    } else if (termtype == 'termtypeblanknode') {
      code += 'rr:termType rr:BlankNode;';
    } else if (termtype == 'termtypeliteral') {
      code += 'rr:termType rr:Literal;';
    } else if (termtype == 'datatype') {
      code += 'rr:termType rr:Literal;';
      code += '\nrr:datatype ' + block.termtypevalue +';';
    } else if (termtype == 'language') {
      code += 'rr:termType rr:Literal;';
      code += '\nrr:language \"' + block.termtypevalue +'\";';
    }
  }


  code += '\n  rrf:functionCall [ \n' 
       +  '    rrf:function <#' + functionName + '> ;'
       +  getParameters(block) 
       +  '  ];\n'
       +  '];\n';
  return code;
}

R2RML.callfunctionwithreturn = function(block) {
  return functioncall(block, block.getFieldValue('functionname'));
}

R2RML.load = function(block) {
  loads += 'load(' + block.getFieldValue('filepath')+ ');'; // A list of all load functions that are necessary?
  return '';
}

R2RML.replace = function(block) {
  return functioncall(block, 'Replace');
}

R2RML.substring = function(block) {
  return functioncall(block, 'Substring');
}

R2RML.sum = function(block) {
  return functioncall(block, 'Sum');
}

R2RML.avg = function(block) {
  return functioncall(block, 'Avg');
}

R2RML.parameters = function(block) {
  return ''; 
}

R2RML.parameter = function(block) {
  return '';
}

// R2RML.object2 = function(block) {
//   var options = '';
//   if(block.hasOptions == 'true'){
//     options += '\n';
//     var option = block.getFieldValue('TERMTYPE');
//     if(option == 'termtypeiri') {
//       options += 'rr:termType rr:IRI;';
//     } else if (option == 'termtypeblanknode') {
//       options += 'rr:termType rr:BlankNode;';
//     } else if (option == 'termtypeliteral') {
//       options += 'rr:termType rr:Literal;';
//     } else if (option == 'datatype') {
//       options += 'rr:termType rr:Literal;';
//       options += '\nrr:datatype ' + block.getFieldValue('TERMTYPEVALUE') +';';
//     } else if (option == 'language') {
//       options += 'rr:termType rr:Literal;';
//       options += '\nrr:language ' + block.getFieldValue('TERMTYPEVALUE') +';';
//     }
//   }
//   return "rr:objectMap [ \n  " + termmap(block) +  options  + "\n ]; \n";
// }

// R2RML.object_options = function(block) {
//   return '';
// }

// R2RML.object_option = function(block) {
//   return '';
// }