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
  //TODO CHECK

  // Copied from the JavaScript generator as to create functions within R2RML mappings (https://www.scss.tcd.ie/~crottija/funul/)
  // Create a dictionary of definitions to be printed before the code.
  Blockly.JavaScript.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.JavaScript.functionNames_ = Object.create(null);

  if (!Blockly.JavaScript.variableDB_) {
    Blockly.JavaScript.variableDB_ =
        new Blockly.Names(Blockly.JavaScript.RESERVED_WORDS_);
  } else {
    Blockly.JavaScript.variableDB_.reset();
  }

  var defvars = [];
  var variables = Blockly.Variables.allVariables(workspace);
  if (variables.length) {
    for (var i = 0; i < variables.length; i++) {
      defvars[i] = Blockly.JavaScript.variableDB_.getName(variables[i],
          Blockly.Variables.NAME_TYPE);
    }
    Blockly.JavaScript.definitions_['variables'] =
        'var ' + defvars.join(', ') + ';';
  }


};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
R2RML.finish = function(code) {
  return code;
};

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
      commentCode += R2RML.prefixLines(comment, '// ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var childComment = R2RML.allNestedComments(childBlock);
          if (childComment) {
            commentCode += R2RML.prefixLines(childComment, '// ');
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

R2RML.mapping = function(block) {
  if (!block) {
    return '';
  }
  var mapping = '# Mapping created using R2RML editor. '
                + '\n  @prefix rr: <http://www.w3.org/ns/r2rml#> .'
                + '\n  @prefix rrf: <http://kdeg.scss.tcd.ie/ns/rrf#> . \n'; 
  mapping +=  R2RML.statementToCode(block, 'mapping');
  mapping +=  "\n" + R2RML.statementToCode(block, 'triplesmap');
  return mapping;
};

R2RML.prefix = function(block) {
  if (isDisconnected(block)) {
    return '';
  }
  
  var prefix = block.getFieldValue('PREFIX');
  var uri = block.getFieldValue('URI');
  return "@prefix "+ prefix +": <" + uri + "> .\n";
};

R2RML.base = function(block) {
  if (isDisconnected(block)) {
    return '';
  }
  
  var uri = block.getFieldValue('URI');
  return "@base <" + uri + "> .\n";
};

R2RML.predefinedprefix = function(block) {
  if (isDisconnected(block)) {
    return '';
  }
  
  var prefix = block.getFieldValue('PREFIX');
  return "@prefix "+ prefix +" .\n";
};

R2RML.triplemap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  // countTripleMap++;
  var triplemap = block.getFieldValue('TRIPLEMAPNAME'); //"TripleMap" + countTripleMap;
  return "<#" + triplemap + ">\n" + "rr:logicalTable [ " + R2RML.statementToCode(block, 'logicaltable') + "];"  
              + "\n " + R2RML.statementToCode(block, 'subjectmap')
              + "\n " + R2RML.statementToCode(block, 'predicateobjectmap')  + " . \n\n"; 
};

R2RML.tablesqlquery = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  var isTable = block.getFieldValue('TABLESQLQUERY') == 'table';
  var separator = (isTable ? '\"' : '\n\"\"\"\n');
  var table = (isTable ? 'rr:tableName ' : 'rr:sqlQuery ');
  return "\n" + table + separator + block.sql + separator + ";\n";
};

R2RML.subjectmap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:subjectMap [ \n  " + termmap(block) + R2RML.statementToCode(block, 'termmap') + "\n]; \n";
};

R2RML.class = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "\nrr:class " + block.getFieldValue('CLASS') + ";";
};

R2RML.predicateobjectmap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:predicateObjectMap [ \n" + R2RML.statementToCode(block, 'ppredicateobjectmap') + 
                                  "\n " + R2RML.statementToCode(block, 'opredicateobjectmap') +
                                  "\n " + R2RML.statementToCode(block, 'graphmap') + "]; \n";
};

R2RML.objectmap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:objectMap [ \n  " + termmap(block) + '\n' + R2RML.statementToCode(block, 'termmap')  + "]; \n";
};

R2RML.predicatemap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:predicateMap [ \n  " + termmap(block) + R2RML.statementToCode(block, 'termmap')  + "\n]; \n";
};

R2RML.object = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:object " + block.getFieldValue('OBJECT') + ";\n";
};

R2RML.predicate = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:predicate " + block.getFieldValue('PREDICATE') + ";\n";
};

R2RML.inverseexpression = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:inverseExpression \"" + block.getFieldValue('INVERSEEXPRESSION') + "\";\n";
};

R2RML.datatype = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:datatype " + block.getFieldValue('DATATYPE') + ";\n";
};

R2RML.objectdatatype = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:datatype " + block.getFieldValue('DATATYPE') + ";\n";
};


R2RML.language = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:language \"" + block.getFieldValue('LANGUAGE') + "\";";
};

R2RML.objectlanguage = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:language \"" + block.getFieldValue('LANGUAGE') + "\";";
};

R2RML.joincondition = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "rr:joinCondition [ \n   rr:child \"" + block.getFieldValue('CHILD') + "\";\n   rr:parent \"" + block.getFieldValue('PARENT') + "\";\n];\n";
};

R2RML.parenttriplesmap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  var triplesmap = block.getFieldValue('PARENTTRIPLEMAP');
  return "rr:objectMap [\n  rr:parentTriplesMap <#" + triplesmap + ">;\n" + R2RML.statementToCode(block, 'joincondition') + "];"; 
};

function termtype(block) {
  if (isDisconnected(block)) {
    return '';
  }

  var code = "\nrr:termType ";
  var termtype = block.getFieldValue('TERMTYPE');
  if(termtype == 'termtypeiri'){
    code += 'rr:IRI;';
  } else if(termtype == 'termtypeblanknode'){
    code += 'rr:BlankNode;';
  } else {
    code += 'rr:Literal;';
    if(block.type == 'objecttermtype' || block.type == 'functiontermtype'){
      code += '\n' + R2RML.statementToCode(block, 'termtypevalue');
    }
  }
  return code;
}

R2RML.subjectgraphtermap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "\nrr:graphMap [\n\t" + termmap(block) + "\n rr:termType rr:IRI; \n];";
};

R2RML.predicategraphtermap = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  return "\nrr:graphMap [\n\t" + termmap(block) + "\n rr:termType rr:IRI;\n];";
};

R2RML.functionblock = function(block){
  var resource = block.getFieldValue('FUNCTION'); 
  return "<#" + resource + ">\n" 
              + "rrf:functionName \"" + block.getFieldValue('functionname') + "\" ;"  
              + "\nrrf:functionBody \"\"\" \n" 
              + block.functionbody
              + "\n \"\"\" \n;.\n\n" ; 
}

R2RML.functionblockly = function(block){
  var resource = block.getFieldValue('FUNCTION'); 
  var functionName = block.getFieldValue('functionname');
  return "<#" + resource + ">\n" 
              + "rrf:functionName \"" + functionName + "\" ;"  
              + "\nrrf:functionBody \"\"\" \n" 
              + 'function ' + functionName + '(' + block.getVars() + ') {\n'
              + R2RML.statementToCode(block, 'functionbody')
              + '\nreturn ' +  R2RML.valueToCode(block, 'RETURN') + ';' //+ block.getFieldValue('RETURN')
              + "\n}\n \"\"\" \n;.\n\n" ; 
}

R2RML.variables_get = Blockly.JavaScript['variables_get']

R2RML.variables_set = function(block){ //Blockly.JavaScript['variables_set'] //TODO
  var argument0 = R2RML.valueToCode(block, 'VALUE',
      Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
}

R2RML.funul_controls_if = Blockly.JavaScript['controls_if']

R2RML.text = Blockly.JavaScript['text']

R2RML.math_number = Blockly.JavaScript['math_number']

R2RML.logic_compare = Blockly.JavaScript['logic_compare']

R2RML.math_arithmetic = Blockly.JavaScript['math_arithmetic']

R2RML.text_join = Blockly.JavaScript['text_join']

R2RML.text_changeCase = Blockly.JavaScript['text_changeCase']

R2RML.logic_operation = Blockly.JavaScript['logic_operation']

R2RML.text_trim = Blockly.JavaScript['text_trim']

R2RML.text_isEmpty = Blockly.JavaScript['text_isEmpty']

R2RML.logic_null = Blockly.JavaScript['logic_null']

R2RML.text_replace = function(block) {
  var text = Blockly.JavaScript.valueToCode(block, 'TEXT',
      Blockly.JavaScript.ORDER_MEMBER) || '\'\'';
  var from = Blockly.JavaScript.valueToCode(block, 'FROM',
      Blockly.JavaScript.ORDER_NONE) || '\'\'';
  var to = Blockly.JavaScript.valueToCode(block, 'TO',
      Blockly.JavaScript.ORDER_NONE) || '\'\'';
  var code = text + '.replace(' + from + ', ' + to +');';
  return [code, Blockly.JavaScript.ORDER_MEMBER];
};

R2RML.load = function(block) {    
  return 'load(\"' + block.getFieldValue('filepath') + '\");\n';
}

R2RML.callfunction = function(block) {
  return callFunction(block);
}

R2RML.callfunctionwithreturn = function(block) {
  return callFunction(block);
}

R2RML.functioncall = function(block){
  return '\nrr:objectMap ['
          + R2RML.statementToCode(block, 'funtermtype') + '\n'
          + '  rrf:functionCall [ \n'
          + '    rrf:function <#'+ block.getFieldValue('FUNCTIONCALL') +'> ;\n'
          + '    rrf:parameterBindings ('
          + '\n      ' + R2RML.statementToCode(block, 'parameter')
          + '\n   );\n'
          + '  ];\n'
          + '];\n';
}

R2RML.parameter = function(block){
  return '[ ' + termmap(block) + ' ] '; 
}

function callFunction(block) {
  var params = new Array(block.itemCount_);
  for (var n = 0; n < block.itemCount_; n++) {
    params[n] = R2RML.valueToCode(block, 'ADD' + n,
        Blockly.JavaScript.ORDER_COMMA) || 'null';
  }
  params = '(' + params.join(', ') + ')';

  var code = String(block.getFieldValue('functionname')) + params;
  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
}

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
    code += '\n  rr:termType rr:IRI;';
  }

  return code;
}

R2RML.functiontermtype = function(block) {
  return termtype(block);
};

R2RML.subjecttermtype = function(block) {
  return termtype(block);
};

R2RML.subjecttermmap = function(block) {
  return termmap(block) + '\n' ;
};

R2RML.predicatetermtype = function(block) {
  return termtype(block)+ '\n' ;
};

R2RML.predicatetermmap = function(block) {
  return termmap(block)+ '\n' ;
};

R2RML.objecttermtype = function(block) {
  return termtype(block)+ '\n' ;
};

R2RML.objecttermmap = function(block) {
  return termmap(block)+ '\n' ;
};

