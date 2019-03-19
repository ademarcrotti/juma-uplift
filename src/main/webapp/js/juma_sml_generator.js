'use strict';

// Code based on the JavaScript generator available at https://github.com/google/blockly

var SML = new Blockly.Generator('SML');
/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
SML.addReservedWords('');

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */

var viewCount = 0;
SML.init = function(workspace) {
  viewCount = 0;
};

var hasUnsupportedFunctions = false;

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
SML.finish = function(code) {
  var code = '// Mapping created using Juma editor. \n'
                + code + (hasUnsupportedFunctions ? '\n\n//This mapping contains functions that are not supported by SML' : '');
  hasUnsupportedFunctions = false;
  return code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
SML.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped R2RML string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} R2RML string.
 * @private
 */
SML.quote_ = function(string) {
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
SML.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    if (comment) {
      commentCode += SML.prefixLines(comment, '// ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var childComment = SML.allNestedComments(childBlock);
          if (childComment) {
            commentCode += SML.prefixLines(childComment, '// ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = SML.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

function isDisconnected(block) {
  return block.getParent() == undefined;
}

SML.base = function(block) {
  if (isDisconnected(block)) {
    return '';
  }
  
  var uri = block.getFieldValue('URI');
  return "  @base <" + uri + "> \n";
};

var withVars = '';
var subjectName = '';
var objectCount = 0;
var predicateCount = 0;
var subjectCount = 0;
var sqlfrom = '';
var linkings = '';
var graphs = [];
var graphCount = 0;

SML.mapping = function(block) {
  if (!block) {
    return '';
  }
  withVars = '';
  predicateCount = 0;
  objectCount = 0;
  subjectCount = 0;
  graphCount = 0;
  graphs = [];
  linkings = '';

  sqlfrom = SML.statementToCode(block, 'mapping');
  var subjects = SML.statementToCode(block, 'subjects');

  if(graphs.length > 0) {
    var mappingWithGraph = '';
    for (var i = 0; i < graphs.length; i++) {
      mappingWithGraph += '\nGraph '
                        + graphs[i] + '\n { \n'
                        + subjects
                        + '\n }\n';
    }
    subjects = mappingWithGraph;
  }
  
  if(subjects == '') {
    return SML.statementToCode(block, 'vocabs') + '\n' + linkings + '\n';
  }
  
  viewCount++;
  return SML.statementToCode(block, 'vocabs') + "\nCreate View view" + viewCount + " As \n Construct { " 
                        + subjects
                        + " }\n With " 
                        + withVars 
                        + '\n From ' + sqlfrom
                        + ((linkings != '') ? ('\n //Linkings \n' + linkings) : '');
};

SML.subjectdef = function(block) {

  return SML.statementToCode(block, 'source')
              + SML.statementToCode(block, 'properties') ; 
}

SML.subject = function(block) {
  if (isDisconnected(block)) {
    return '';
  }
  if(block.getParent() != undefined && block.getParent().getChildren().length > 1 && isParentTriplesMap(block.getParent().getChildren()[1])) { 
		return '';
	}
	subjectCount++;
  subjectName = '?s' + subjectCount;

  var uriOrBNode = '';
  if(block.getParent() != undefined) {
    uriOrBNode = isBlankNode(block.getParent()) ? 'bNode' : 'uri';
  } else {
    uriOrBNode = 'uri';
  }

  withVars += '\n  ' + subjectName + ' = ' + uriOrBNode + '(' + smlterms(block) + ')';
  return '';
}

function isBlankNode(block) {
  if(block.getDescendants() != undefined) {
    var descendants = block.getDescendants();

    for(var i = 0; i < descendants.length; i++) {
      var descendant = descendants[i];
      if(descendant.type == 'bnode'){
        return true;
      }
    }
    return false; 
  }
}

function parseTemplate(str) {
  var args = [];
  while (str) {
      if (str.indexOf("{") !== -1 && str.indexOf("}") !== -1) {
          var openIdx = str.indexOf('{');
          var closeIdx = str.indexOf('}');
          var strLen = str.length;

          if (openIdx > 0) {
              args.push("\'" + str.substring(0, openIdx) + "\'");
          }

          var strVar = str.substring(openIdx+1, closeIdx);
          if (strVar.indexOf(' ') !== -1) {
            args.push('?\"' + strVar + '\"');
          } else {
            args.push('?' + strVar);
          }

          str = str.substring(closeIdx+1, strLen);
      } else {
          args.push("\'" + str + "\'");
          str = "";
      }
  }

  var template = '';
  for (var i = 0; i < args.length; i++) {
    if(i != 0) {
      template += ', ';
    }
    template += args[i];
  }
  if(args.length > 1) {
    return 'concat(' + template + ')';
  }
  return template;
}

SML.prefix = function(block) {
  var prefix = block.getFieldValue('PREFIX');
  var uri = block.getFieldValue('URI');
  return "  Prefix "+ prefix +": <" + uri + "> \n";
};

SML.predefinedprefix = function(block) {
  var prefix = block.getFieldValue('PREFIX');
  return "  Prefix " + prefix +" \n";
};

SML.bnode = function(block) {
  return '';
}

SML.classes = function(block) {
  var classes = '';
  for (var i = 0; i < this.arguments_.length; i++) {
    classes += '\n';
    classes += subjectName + ' ' + " a " + this.arguments_[i] + ".";
  }
  return classes;
}

SML.tablesqlquery = function(block) {
  if (isDisconnected(block)) {
    return '';
  }

  var isTable = block.getFieldValue('TABLESQLQUERY') == 'table';
  return " \n" + (isTable ? '' : '[[ ') + block.sql + (isTable ? '' : ' ]]; ') + "\n";
};

function smlterms(block) {
  if (isDisconnected(block)) {
    return '';
  }

  var code = '';
  var termmap = block.getFieldValue('TERMMAP');
  if(termmap == 'CONSTANT'){
    code = block.getFieldValue('TERMMAPVALUE');
  } else if(termmap == 'TEMPLATE'){
    code = parseTemplate(block.getFieldValue('TERMMAPVALUE'));
  } else if (termmap == 'COLUMN'){
    code = "?" + block.getFieldValue('TERMMAPVALUE');
  } 

  return code;
}

SML.graph = function(block) {
  var termmap = block.getFieldValue('TERMMAP');
  if(termmap == 'CONSTANT'){
    graphs.push(block.getFieldValue('TERMMAPVALUE'));
  } else {
    var graphVar = '?g' + (++graphCount);
    graphs.push(graphVar);

    withVars += '\n  ' + graphVar + ' = uri(' + smlterms(block) + ')';
  }
  return '';
}

function isParentTriplesMap(block) {
	return block.getInput('object') != null && block.getInput('object').connection.targetConnection != null && block.getInput('object').connection.targetConnection.sourceBlock_.type == 'linking_mappings';
}

SML.predicate_object = function(block) {
	if(isParentTriplesMap(block)) { // Function not supported should not create triple in SPARQL
		SML.statementToCode(block, 'object');
		return '';
	}
  return '\n' + subjectName + ' ' + SML.statementToCode(block, 'predicate') + " "
                            + SML.statementToCode(block, 'object') + ".";
}

SML.predicate = function(block) {
  if (isDisconnected(block)) {
    return '';
  }
  var termmap = block.getFieldValue('TERMMAP');
  if(termmap == 'CONSTANT'){
    return block.getFieldValue('TERMMAPVALUE');
  }

  var predicateVar = '?p' + (++predicateCount);

  withVars += '\n  ' + predicateVar + ' = uri(' + smlterms(block) + ')';
  return predicateVar;
}

SML.object = function(block) {
  var objectVar = '?o' + (++objectCount);
  var objectValue = smlterms(block);

  if(block.getFieldValue('WITHTERMTYPE') == 'TRUE') {
    var option = block.getFieldValue('TERMTYPE');
    if(option == 'termtypeiri') {
      objectValue = 'uri('+ objectValue +')';
    } else if (option == 'termtypeblanknode') {
      objectValue = 'bNode('+ objectValue +')';
    } else if (option == 'termtypeliteral') {
      objectValue = 'plainLiteral('+ objectValue +')';
    } else if (option == 'datatype') {
      objectValue = 'typedLiteral('+ objectValue +', ' + block.getFieldValue('TERMTYPEVALUE') + ')';
    } else if (option == 'language') {
      objectValue = 'plainLiteral('+ objectValue +', \"' + block.getFieldValue('TERMTYPEVALUE') + '\")';
    }
  } else {
    if(block.getFieldValue('TERMMAP') == 'CONSTANT') {
      return objectValue;
    } else if(block.getFieldValue('TERMMAP') == 'TEMPLATE') {
      objectValue = 'uri('+ objectValue +')';    
    } else {
      objectValue = 'plainLiteral('+ objectValue +')';    
    }
  }
  
  withVars += '\n  ' + objectVar + ' = ' + objectValue;
  return objectVar;
}

function findSubjectOfChild(subjectId) {
  var blocks = getBlocksByType('subjectdef');
  for (var i = 0; i < blocks.length; i++) {
    if(blocks[i].getFieldValue('ID') == subjectId) {
        return blocks[i];
    }
  }
  return null;
}

function findLogicalTable(block) {
  if(block == null) {
    return null;
  }
  if(block.type == 'mapping') {
    if(block.getChildren()[0].getFieldValue('TABLESQLQUERY') == 'table') {
      return block.getChildren()[0].sql;  
    }
    return '(' + block.getChildren()[0].sql + ')';
  }
  return findLogicalTable(block.getParent());
}

function findSubject(block) {
  if(block == null) {
    return null;
  }
  if(block.type == 'subjectdef') {
    return block.getChildren()[0];
  }
  return findSubject(block.getParent());
}

SML.linking_mappings = function(block) {
  if (isDisconnected(block) || block.getParent().getParent() == undefined) {
    return '';
  }
  var subjectOfChild = findSubjectOfChild(block.getFieldValue('LINK'));
  if(subjectOfChild == null) {
  	return '';
  }

  var subjectVar = '?s1';
  var predicateVar = '?p1';
  var objectVar = '?o1';
  
  var parentLogicalTable = findLogicalTable(block); // find logical table of parent
  var childLogicalTable = findLogicalTable(subjectOfChild); // find logical table of child 

  var subjectValue = '';
  var subjectBlock = findSubject(block);

  var uriOrBNode = '';
  if(subjectBlock.getParent() != undefined) {
    uriOrBNode = isBlankNode(subjectBlock.getParent()) ? 'bNode' : 'uri';
  } else {
    uriOrBNode = 'uri';
  }
	var subjectValue = uriOrBNode + '(' + smlterms(subjectBlock) + ')';

  var predicateValue = '';
  var predicateBlock = block.getParent().getChildren()[0];
  var isPredicateConstant = predicateBlock.getFieldValue('TERMMAP') == 'CONSTANT';

  predicateValue = isPredicateConstant ? smlterms(predicateBlock) : 'uri(' + smlterms(predicateBlock) + ')';

  var objectValue = smlterms(subjectOfChild.getChildren()[0]); // the subject from child block
  objectValue = (isBlankNode(subjectOfChild) ? 'bNode' : 'uri' + '(' + objectValue + ')');

  // create sql join and change from clause
  var sql = '';
  if(this.arguments_.length == 0) {
    sql = '\n [[\n  SELECT * FROM ' + childLogicalTable + ' AS tmp \n]]';
  } else {
    sql = '\n [[\n  SELECT * FROM ' + childLogicalTable + ' AS child, ' + parentLogicalTable + ' AS parent WHERE \n'; 
    for (var i = 0; i < this.arguments_.length; i++) {
      var join = this.arguments_[i];
      if(i != 0) {
        sql += ' AND ';  
      }
      sql += " child." + join[1] + " = parent." + join[0] + "\n ";
    }
    sql += ' ]]';
  }

  linkings += "\nCreate View view" + (++viewCount) + " As \n Construct { " 
                        + subjectVar +  ' ' + (isPredicateConstant ? predicateValue : predicateVar) + ' ' + objectVar + ' .'
                        + " }\n With \n" 
                        + subjectVar + ' = ' + subjectValue 
                        + (isPredicateConstant ? '' : ('\n' + predicateVar + ' = ' + predicateValue))
                        + '\n' + objectVar + ' = ' + objectValue + '\n'
                        + 'From ' + sql + '\n';
  return '';
}

function generateFuncArgs(functionArgs){
  var args = [];
  for (var i = 0; i < functionArgs.length; i++) {
    if(functionArgs[i][0] == 'COLUMN')
      args.push('?' + functionArgs[i][1]);
    else
      args.push(functionArgs[i][1]);
  }
  return args;
}

SML.concat = function(block) {
  var objectVar = '?o' + (++objectCount);
  var objectValue = 'concat(' + generateFuncArgs(block.arguments_) + ')';

  if(block.termtype != ''){
    if(block.termtype == 'termtypeiri') {
      objectValue = 'uri('+ objectValue +')';
    } else if (block.termtype == 'termtypeblanknode') {
      objectValue = 'bNode('+ objectValue +')';
    } else if (block.termtype == 'termtypeliteral') {
      objectValue = 'plainLiteral('+ objectValue +')';
    } else if (block.termtype == 'datatype') {
      objectValue = 'typedLiteral('+ objectValue +', ' + block.termtypevalue + ')';
    } else if (block.termtype == 'language') {
      objectValue = 'plainLiteral('+ objectValue +', \"' + block.termtypevalue + '\")';
    }
  } else {
    objectValue = 'plainLiteral('+ objectValue +')';    
  }
  
  withVars += '\n  ' + objectVar + ' = ' + objectValue;
  return objectVar;
}

SML.parameters = function(block) {
  return '';
}

SML.parameter = function(block) {
  return '';
}

SML.callfunctionwithreturn = function(block) {
  hasUnsupportedFunctions = true;
  return '';
}

SML.load = function(block) {
  hasUnsupportedFunctions = true;
  return '';
}

SML.replace = function(block) {
  hasUnsupportedFunctions = true;
  return '';
}

SML.substring = function(block) {
  hasUnsupportedFunctions = true;
  return '';
}

SML.sum = function(block) {
  hasUnsupportedFunctions = true;
  return '';
}

SML.avg = function(block) {
  hasUnsupportedFunctions = true;
  return '';
}
