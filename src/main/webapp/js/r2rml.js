'use strict';

var mappingColour = 360;
var tripleMapColour = '#005580';
var mapColour = 48;
var valueColour = 62;
var parenttripleColour = 380;
var tableColour = 85;
var subjectColour = 122;
var predicateColour = 215;
var objectColour = '#0099cc';
var graphColour = 320;
var functionColour = '#0099cc';
var loadColour = '#6e8720';

var vocabs = [
        ['rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>', 'rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>'],
        ['rdfs: <http://www.w3.org/2000/01/rdf-schema#>', 'rdfs: <http://www.w3.org/2000/01/rdf-schema#>'], 
        ['xsd: <http://www.w3.org/2001/XMLSchema#>', 'xsd: <http://www.w3.org/2001/XMLSchema#>'],
        ['foaf: <http://xmlns.com/foaf/0.1/>', 'foaf: <http://xmlns.com/foaf/0.1/>']
       ];
var triplesmap = [];

// default values
// Blockly.HSV_SATURATION = 0.45;
// Blockly.HSV_VALUE = 0.65;

Blockly.HSV_SATURATION = 0.55;
Blockly.HSV_VALUE = 0.65;

var blockId;

var tripleMap = 'TM';
var logicalTable = 'LT';
var subjectMap = 'SM';
var predicateObjectMap = 'POM';
var predicateMap = 'PM';
var objectMap = 'OM';
var graphMap = 'GM';
var textClass = 'lead';

var tripleMap = 'Triples Map';
var logicalTable = 'Logical Table';
var subjectMap = 'Subject';
var predicateObjectMap = 'Predicate/Object';
var predicateMap = 'Predicate';
var objectMap = 'Object';
var graphMap = 'Graph';

// indicate what is obligatory

// colours on the conector

// border colour indicating the next block

// arity -- important to have it in the video or material

// maybe delete term type for predicate map -- toolbox too


// between the groups

Blockly.Blocks['mapping'] = {
    init: function() {
    this.appendStatementInput('mapping')
        .setCheck(['prefix'])
        .appendField(new Blockly.FieldLabel('Vocabularies', textClass));
    this.appendStatementInput('triplesmap')
        .setCheck('triplemap')
        .appendField(new Blockly.FieldLabel(tripleMap, textClass));
    this.setColour(mappingColour);
    this.setTooltip('Creates a mapping.');
    this.setHelpUrl('https://www.w3.org/TR/r2rml/');
    this.setDeletable(false);
  }
};


Blockly.Blocks['prefix'] = {
    init: function() {
    this.setColour(valueColour);
    this.appendDummyInput('prefix')
        .appendField('')
        .appendField(new Blockly.FieldTextInput('insert prefix here'), 'PREFIX');
    this.appendDummyInput('uri')
        .appendField(new Blockly.FieldLabel(': <', textClass))
        .appendField(new Blockly.FieldTextInput('insert uri here'), 'URI')
		.appendField(new Blockly.FieldLabel('>', textClass));
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['mapping','prefix']);
    this.setNextStatement(true, ['prefix', 'base']);
    this.setTooltip('Creates a prefix.');
  }
};

Blockly.Blocks['base'] = {
    init: function() {
    this.setColour(valueColour);
    this.appendDummyInput('base')
        .appendField('base <')
        .appendField(new Blockly.FieldTextInput('insert uri here'), 'URI')
        .appendField('>');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['mapping','prefix']);
    this.setNextStatement(true, 'prefix');
    this.setTooltip('Creates a base uri.');
  }, onchange: function() {
    validateFields(this);
  }
};

Blockly.Blocks['predefinedprefix'] = {
    init: function() {
    this.setColour(valueColour);
    this.appendDummyInput('prefix')
        .appendField('')
        .appendField(new Blockly.FieldDropdown(vocabs), 'PREFIX');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['mapping','prefix']);
    this.setNextStatement(true, 'prefix');
    this.setTooltip('Creates a prefix.');
  }
};


Blockly.Blocks['tablesqlquery'] = {
    init: function() {
    // if(this.sql != undefined){
    //   sqlFromDatabase = this.sql.substring(0,20) + (this.sql.length > 20 ? '...' : '')    
    // }
    this.setColour(tableColour);
    this.appendDummyInput('tablesqlquery')
        .appendField(new Blockly.FieldDropdown([['table', 'table'], ['sql query', 'sqlquery']]), 'TABLESQLQUERY')
        .appendField(new Blockly.FieldLabel('click here to insert value',''), 'sql'); 
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['logicaltable','tablesqlquery']);
    this.setTooltip('Defines a table or sql query.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#logicalTable');
    this.sql = "click here to insert";
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('sql', this.sql);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.sql = xmlElement.getAttribute('sql');
  	this.setFieldValue(this.sql.substring(0,20) + (this.sql.length > 20 ? '...' : ''), 'sql');
  },
  onchange: function(ev) {
    blockId = ev.blockId;
    var block = workspace.getBlockById(blockId);
    if(block != undefined && (block.type == 'tablesqlquery' )){
      $('#content-logical-table').val(block.sql); 
      $('#edit-logical-table').show();  
      $('#edit-logical-table div textarea').focus();  
      $('#edit-logical-table div textarea').select(); 
    } else {
      $('#edit-logical-table').hide();  
    }
  }
};

$(document).ready(function() {
  $("#saveLogicalTable").bind("click", function() {
    var block = workspace.getBlockById(blockId);
    if(block){
      var content = $('#content-logical-table').val();
      block.sql = content;
      block.setFieldValue(content.substring(0,35) + (content.length > 35 ? '...' : ''), 'sql');
      blockId = undefined;
      $('#edit-logical-table').hide();
    }
  });

  $("#saveFunctionBody").bind("click", function() {
    var block = workspace.getBlockById(blockId);
    if(block){
      var content = $('#content-function-body').val();
      block.functionbody = content;
      block.setFieldValue(content.substring(0,35) + (content.length > 35 ? '...' : ''), 'functionbody');
      blockId = undefined;
      $('#edit-function-body').hide();
      Blockly.Events.fire(new Blockly.Events.Create(block));
    }
  });

});

Blockly.Blocks['class'] = {
    init: function() {
    this.setColour(subjectColour);
    this.appendDummyInput('class')
        .appendField('Class:')
        .appendField(new Blockly.FieldTextInput('class'), 'CLASS');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['class', 'subjecttermtype']);
    this.setNextStatement(true, ['class', 'subjecttermtype']);
    this.setTooltip('Defines a class.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#class');
  }
};

function nextTripleMapName() {
  var blocks = getBlocksByType('triplemap');
  return 'TripleMap' + (blocks.length + 1);
}

Blockly.Blocks['triplemap'] = {
  init: function() {
    this.appendDummyInput('triple-map')
        .appendField('<#')
        .appendField(new Blockly.FieldTextInput(nextTripleMapName()), 'TRIPLEMAPNAME')
        .appendField('>');
    this.appendStatementInput('logicaltable')
        .setCheck(['tablesqlquery'])
        .appendField(new Blockly.FieldLabel(logicalTable, textClass));
    this.appendStatementInput('subjectmap')
        .setCheck(['subjectmap'])
        .appendField(new Blockly.FieldLabel(subjectMap, textClass));
    this.appendStatementInput('predicateobjectmap')
        .setCheck('predicateobjectmap')
        .appendField(new Blockly.FieldLabel(predicateObjectMap, textClass));
    this.setColour(tripleMapColour);
    this.setPreviousStatement(true, ['triplemap']);
    this.setNextStatement(true, 'triplemap');
    this.setTooltip('Creates a triple map.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#TriplesMap');
  }, onchange: function(ev) {
  	var MSG_UNIQUE_TRIPLE_MAP = 'Triples map names must be unique!';
  	var MSG_LOGICAL_TABLE_SUBJECT_MAP = 'A triple map must have one logical table and one subject map!';
	if(this.getInputTargetBlock('logicaltable') == null || this.getInputTargetBlock('subjectmap') == null) {
	    this.setWarningText(MSG_LOGICAL_TABLE_SUBJECT_MAP);
	} else {
	    this.setWarningText(null);
	}

    var abort = false;
    if(ev.type == Blockly.Events.CHANGE || ev.type == Blockly.Events.MOVE) {
      var blocks = getBlocksByType('triplemap');
      for(var i = 0; i < blocks.length && !abort; i++) {
        for(var j = 0; j < blocks.length && !abort; j++) {
          var oneBlock = blocks[i];
          var anotherBlock = blocks[j];
          if(oneBlock.id != anotherBlock.id && oneBlock.getFieldValue('TRIPLEMAPNAME') == anotherBlock.getFieldValue('TRIPLEMAPNAME')) {
            abort = true;
            alert(MSG_UNIQUE_TRIPLE_MAP);
            this.setFieldValue(nextTripleMapName(), 'TRIPLEMAPNAME');
          }
        }
      }

      var blocks = getBlocksByType('parenttriplesmap');
      for(var i = 0; i < blocks.length; i++) {
        if(ev.name == 'TRIPLEMAPNAME' && ev.oldValue == blocks[i].getFieldValue('PARENTTRIPLEMAP')){
          blocks[i].setFieldValue(ev.newValue, 'PARENTTRIPLEMAP');
          break;
        }
      }
    }

  }
};

Blockly.Blocks['subjectmap'] = {
    init: function() {
    this.appendStatementInput('termmap')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE')
        .setCheck(['subjecttermtype', 'subjecttermmap', 'class'])
        .appendField('');
    this.setColour(subjectColour);
    this.setPreviousStatement(true, ['subjectmap']);
    this.setTooltip('Defines the subject.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#SubjectMap');
  }, onchange: function() {
    validateFields(this);
    if(this.getFieldValue('TERMMAP') == 'EMPTY') {
      this.setFieldValue('', 'TERMMAPVALUE');
      Blockly.addClass_(this.getField('TERMMAPVALUE').fieldGroup_, 'hideInput');
    } else {
      Blockly.removeClass_(this.getField('TERMMAPVALUE').fieldGroup_, 'hideInput');
    }
  }
};

Blockly.Blocks['predicateobjectmap'] = {
    init: function() {
    this.appendStatementInput('ppredicateobjectmap')
        .setCheck(['predicatemap'])
        .appendField(new Blockly.FieldLabel(predicateMap, textClass));
    this.appendStatementInput('opredicateobjectmap')
        .setCheck(['objectmap', 'parenttriplesmap', 'predicategraphtermap'])
        .appendField(new Blockly.FieldLabel(objectMap, textClass));
    // this.appendStatementInput('graphmap')
    //     .setCheck(['predicategraphtermap'])
    //     .appendField(new Blockly.FieldLabel(graphMap, textClass));
    this.setColour(mapColour);
    this.setPreviousStatement(true, [ 'predicateobjectmap']);
    this.setNextStatement(true, ['predicateobjectmap']);
    this.setTooltip('Creates a predicate object map.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#PredicateObjectMap');
  }, onchange: function(ev){
  	if(this.getInputTargetBlock('ppredicateobjectmap') == null || this.getInputTargetBlock('opredicateobjectmap') == null) {
  		this.setWarningText('A predicate object map must have at least one predicate map and one object map!');
  	} else {
  		this.setWarningText(null);
  	}
  }
};

Blockly.Blocks['predicatemap'] = {
    init: function() {
    this.appendDummyInput('termmap')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE');
    this.setColour(predicateColour);
    this.setPreviousStatement(true, ['predicatemap']);
    this.setNextStatement(true, ['predicatemap']);
    this.setTooltip('Creates a predicate map.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#PredicateMap');
  }, onchange: function() {
    validateFields(this);
  }
};

Blockly.Blocks['objectmap'] = {
    init: function() {
    this.appendStatementInput('termmap')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE')
        .setCheck(['objecttermmap', 'language', 'datatype', 'objecttermtype'])
        .appendField('');
    this.setColour(objectColour);
    this.setPreviousStatement(true, ['objectmap', 'predicategraphtermap']);
    this.setNextStatement(true, ['objectmap', 'predicategraphtermap']);
    this.setTooltip('Creates an object map.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#ObjectMap');
  }, onchange: function() {
    validateFields(this);
  }
};

function validateFields(block) {
  if(block.getDescendants() != undefined){
       var descendants = block.getDescendants();
       var typesToValidate = {'datatype': 'datatype', 'language': 'language', 'base': 'base uri',
                              'subjecttermmap': 'term map', 'predicatetermmap': 'term map', 
                              'objecttermmap': 'term map', 'subjecttermtype': 'term map', 
                              'predicatetermtype': 'term map', 'inverseexpression': 'inverse expression'};
       var hashmap = {};
       for(var key in typesToValidate) {
          hashmap[key] = 0;
       }

       for(var i = 0; i < descendants.length; i++) {
          var descendant = descendants[i];
          var type = descendant.type;
          if(type in hashmap) {
              hashmap[type] += 1;
              if(hashmap[type] > 1) {
                alert('Only one ' + typesToValidate[type]  + ' permited!');
                if(descendant.getChildren() != undefined && descendant.getChildren().length != 0){
                  var blockChildId = descendant.getChildren()[0].id;
                  var parent = descendant.getParent();
                  descendant.getChildren()[0].unplug();
                  var blockChild = workspace.getBlockById(blockChildId);
                  parent.nextConnection.connect(blockChild.previousConnection);
                }
                descendant.dispose();
                break;
            }
          }
       }
    }
}

// subject term map
Blockly.Blocks['subjecttermtype'] = {
    init: function() {
    this.appendDummyInput('termtype')
        .appendField('Term type')
        .appendField(new Blockly.FieldDropdown([['iri', 'termtypeiri'], ['blank node', 'termtypeblanknode']]), 'TERMTYPE');
    this.setColour(subjectColour);
    this.setPreviousStatement(true, ['subjecttermtype', 'class']);
    this.setNextStatement(true, ['subjecttermtype', 'termtypesubject', 'class']);
    this.setTooltip('Defines a term type.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#termType');
  }
};

//predicate term map
Blockly.Blocks['predicatetermtype'] = {
    init: function() {
    this.appendDummyInput('termtype')
        .appendField('Term type')
        .appendField(new Blockly.FieldDropdown([['iri', 'termtypeiri']]), 'TERMTYPE');
    this.setColour(predicateColour);
    this.setPreviousStatement(true, ['predicatetermmap']);
    // this.setNextStatement(true, ['predicatetermtype', 'predicatetermmap']); // TODO review this
    this.setTooltip('Defines a term type.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#termType');
  }
};

//object term map
Blockly.Blocks['subjectgraphtermap'] = {
    init: function() {
    this.setColour(subjectColour);
    this.appendDummyInput('graphtermap')
      .appendField('subject graph map:')
      .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
      .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['class', 'subjecttermtype']);
    this.setNextStatement(true, ['class', 'subjecttermtype']);
    this.setTooltip('Defines a graph map.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#GraphMap');
  } 
};

Blockly.Blocks['predicategraphtermap'] = {
    init: function() {
    this.setColour(graphColour);
    this.appendDummyInput('graphtermap')
      .appendField('predicate object graph map:')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['predicategraphtermap']);
    this.setNextStatement(true, ['predicategraphtermap']);
    this.setTooltip('Defines a graph map.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#GraphMap');
  } 
};

Blockly.Blocks['language'] = {
    init: function() {
    this.setColour(objectColour);
    this.appendDummyInput('language')
        .appendField('Language:')
        .appendField(new Blockly.FieldTextInput('insert language here'), 'LANGUAGE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['language', 'datatype', 'language', 'objecttermtype', 'inverseexpression', 'objecttermmap']);
    this.setNextStatement(true, ['language', 'datatype', 'objecttermtype', 'inverseexpression', 'objecttermmap']); 
    this.setTooltip('Defines a language.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#language');
  }
};


Blockly.Blocks['datatype'] = {
    init: function() {
    this.setColour(objectColour);
    this.appendDummyInput('datatype')
        .appendField('Datatype')
        .appendField(new Blockly.FieldTextInput('insert datatype here'), 'DATATYPE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['datatype', 'language', 'objecttermtype', 'inverseexpression', 'objecttermmap']);
    this.setNextStatement(true, ['language', 'datatype', 'objecttermtype', 'inverseexpression', 'objecttermmap']); 
    this.setTooltip('Defines a datatype.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#datatype');
  }
};

Blockly.Blocks['inverseexpression'] = {
    init: function() {
    this.setColour(objectColour);
    this.appendDummyInput('inverseexpression')
        .appendField('Inverse Expression:')
        .appendField(new Blockly.FieldTextInput('insert inverse expression here'), 'INVERSEEXPRESSION');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['inverseexpression', 'language', 'datatype', 'objecttermtype', 'objecttermmap']);
    this.setNextStatement(true, ['language', 'datatype', 'objecttermtype', 'inverseexpression', 'objecttermmap']); 
    this.setTooltip('Defines an inverse expression.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#inverseExpression');
  }
};


function loadTripleMaps() {
  var options = [['select a triple map','']];
  var blocks = getBlocksByType('triplemap');
  for (var i = 0; i < blocks.length; i++) {
      options.push([blocks[i].getFieldValue('TRIPLEMAPNAME'), blocks[i].getFieldValue('TRIPLEMAPNAME')]);
  }
  return options;
}

Blockly.Blocks['parenttriplesmap'] = {
    init: function() {
    this.appendDummyInput('parenttriplemap')
        .appendField(new Blockly.FieldDropdown(loadTripleMaps), 'PARENTTRIPLEMAP');
    this.appendStatementInput('joincondition')
        .setCheck(['joincondition'])
        .appendField('Join Condition');
    this.setColour(parenttripleColour);
    this.setPreviousStatement(true, ['objectmap', 'parenttriplesmap']);
    this.setNextStatement(true, ['objectmap', 'parenttriplesmap']);
    this.setTooltip('Creates a parent triple map.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#parentTriplesMap');
  }
  , onchange: function(ev){
    if(this.getParent() != undefined && getTripleMap(this) != null) {
      var triplemapName = getTripleMap(this).getFieldValue('TRIPLEMAPNAME');
      var parenttriplemapName = this.getFieldValue('PARENTTRIPLEMAP');
      if(triplemapName == parenttriplemapName) {
        alert('Not possible to create a parent triple map with the same triple map!');
        this.setFieldValue(0, 'PARENTTRIPLEMAP');
      }
    }
  }
};

function getTripleMap(thisBlock){
  if(thisBlock.getParent() == null){
    return null;
  }
  if(thisBlock.type == 'triplemap') {
    return thisBlock;
  }
  return getTripleMap(thisBlock.getParent());
}

Blockly.Blocks['joincondition'] = {
    init: function() {
    this.setColour(parenttripleColour);
    this.appendDummyInput('joinconditionchild')
        .appendField('Child:')
        .appendField(new Blockly.FieldTextInput('insert value here'), 'CHILD');
    this.appendDummyInput('joinconditionparent')
        .appendField('Parent:')
        .appendField(new Blockly.FieldTextInput('insert value here'), 'PARENT');
    this.setPreviousStatement(true, ['joincondition']);
    this.setNextStatement(true, ['joincondition']);
    this.setTooltip('Defines a join condition.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#joinCondition');
  }
};

Blockly.Blocks['objecttermtype'] = {
  init: function() {
    this.setColour(objectColour);
    this.appendDummyInput("termtype")
        .appendField("Term type")
        .appendField(new Blockly.FieldDropdown([ ['iri', 'termtypeiri'], ['literal', 'termtypeliteral'], ['blank node', 'termtypeblanknode']]), 'TERMTYPE');
    this.appendValueInput("termtypevalue")
        .appendField("as/in")
        .setCheck(["objectdatatype", "objectlanguage"]);
    this.setPreviousStatement(true, ['objecttermmap']);//, ['objecttermmap', 'functioncall']);
    this.setInputsInline(true);
    this.setTooltip('Defines a term type.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#termType');
  }, onchange: function() {
    if(this.getFieldValue('TERMTYPE') == 'termtypeliteral') {
    	this.getInput('termtypevalue').setVisible(true);
    } else {
    	this.getInput('termtypevalue').setVisible(false);
  	}
  	this.render();
  }
};


Blockly.Blocks['objectdatatype'] = {
  init: function() {
    this.setColour(objectColour);
    this.appendDummyInput()
        .appendField("datatype")
        .appendField(new Blockly.FieldTextInput("insert datatype here"), "DATATYPE");
    this.setOutput(true, null);
    this.setTooltip('Defines a datatype.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#datatype');
  }
};

Blockly.Blocks['objectlanguage'] = {
  init: function() {
    this.setColour(objectColour);
    this.appendDummyInput()
        .appendField("language")
        .appendField(new Blockly.FieldTextInput("insert language here"), "LANGUAGE");
    this.setOutput(true, null);
    this.setTooltip('Defines a language.');
    this.setHelpUrl('https://www.w3.org/ns/r2rml#language');
  }
};

Blockly.Blocks['text_replace'] = {
  init: function() {
    this.setColour(Blockly.Blocks.texts.HUE);
    this.appendValueInput('FROM')
        .appendField('replace')
        .setCheck(['String']);
    this.appendValueInput('TO')
        .appendField('with')
        .setCheck(['String']);
    this.appendValueInput('TEXT')
        .appendField('in')
        .setCheck(['String']);
    this.setOutput(true, ['String']);
    this.setInputsInline(true);
    this.setTooltip('Replace all ocorrences of some text with some text');
  }
};

// Utils

//************************************
//find all blocks on workspace by type
//************************************
function getBlocksByType(type) {
  var blocks = [];
  for (var blockID in workspace.blockDB_) {
    if (type.indexOf(workspace.blockDB_[blockID].type) > -1) {
      blocks.push(workspace.blockDB_[blockID]);
    }
  }
  return(blocks);
}

function isAnyDisconnected() {
  for (var blockID in workspace.blockDB_) {
    if (workspace.blockDB_[blockID].type != 'mapping' && workspace.blockDB_[blockID].getParent() == undefined) {
      return true;
    }
  }
  return false;
}

Blockly.Blocks['functionblock'] = {
  init: function() {
    if(this.functionbody != undefined){
        this.functionbody = this.functionbody.substring(0,35) + (this.functionbody.length > 35 ? '...' : '')    
    }
   this.functionbody = "click here to insert function";
   this.appendDummyInput('function')
        .appendField('<#')
        .appendField(new Blockly.FieldTextInput(nextFuntionName()), 'FUNCTION')
        .appendField('>');
    this.appendDummyInput("functionname")
        .appendField("Function")
        .appendField(new Blockly.FieldTextInput('name'), 'functionname');
    this.appendDummyInput("functionbody")
        .appendField(new Blockly.FieldLabel(this.functionbody), 'functionbody');
    this.setPreviousStatement(true, ['triplemap', 'functionblock', 'functionblockly']);
    this.setNextStatement(true, ['triplemap', 'functionblock', 'functionblockly']);
    this.setColour(functionColour);
    this.setTooltip('Creates a function.');
    this.setHelpUrl('https://www.scss.tcd.ie/~crottija/funul/');
 },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('functionbody', this.functionbody);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.functionbody = xmlElement.getAttribute('functionbody');
    this.setFieldValue(this.functionbody.substring(0,35) + (this.functionbody.length > 35 ? '...' : ''), 'functionbody');
  },
  onchange: function(ev) {
    blockId = ev.blockId;
    var block = workspace.getBlockById(blockId);
    if(block != undefined && (block.type == 'functionblock')){
      $('#content-function-body').val(block.functionbody); 
      $('#edit-function-body').show();  
    } else {
      $('#edit-function-body').hide();  
    }
  }
};

Blockly.Blocks['fun_mutatorcontainer'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('parameters');
    this.appendStatementInput('STACK');
    this.setColour(Blockly.Blocks.procedures.HUE);
    this.setTooltip(Blockly.Msg.PROCEDURES_MUTATORCONTAINER_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.Blocks['functionblockly'] = {
  init: function() {
    this.appendDummyInput('function')
        .appendField('<#')
        .appendField(new Blockly.FieldTextInput(nextFuntionName()), 'FUNCTION')
        .appendField('>');
    this.appendDummyInput()
        .appendField('Function')
        .appendField(new Blockly.FieldTextInput('name'), 'functionname')
        .appendField('', 'PARAMS');
    this.appendStatementInput('functionbody')
        .setCheck(['load', 'callfunction', 'variables_set', 'funul_controls_if']);
    this.appendValueInput('RETURN')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg.PROCEDURES_DEFRETURN_RETURN);
    this.setMutator(new Blockly.Mutator(['fun_mutatorarg']));
    this.setPreviousStatement(true, ['triplemap', 'functionblock', 'functionblockly']);
    this.setNextStatement(true, ['triplemap', 'functionblock', 'functionblockly']);
    this.setColour(functionColour);
    this.setTooltip('Creates a function.');
    this.setHelpUrl('https://www.scss.tcd.ie/~crottija/funul/');
    this.arguments_ = [];
  },
  setStatements_: function() {}, 
  updateParams_: Blockly.Blocks['procedures_defnoreturn'].updateParams_,
  mutationToDom: Blockly.Blocks['procedures_defnoreturn'].mutationToDom,
  domToMutation: Blockly.Blocks['procedures_defnoreturn'].domToMutation,
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('fun_mutatorcontainer');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.arguments_.length; i++) {
      var paramBlock = workspace.newBlock('fun_mutatorarg');
      paramBlock.initSvg();
      paramBlock.setFieldValue(this.arguments_[i], 'NAME');
      paramBlock.oldLocation = i;
      connection.connect(paramBlock.previousConnection);
      connection = paramBlock.nextConnection;
    }
    Blockly.Procedures.mutateCallers(this);
    return containerBlock;
  },
  compose: Blockly.Blocks['procedures_defnoreturn'].compose,
  getProcedureDef: function() {
    return [this.getFieldValue('NAME'), this.arguments_, true];
  },
  getVars: Blockly.Blocks['procedures_defnoreturn'].getVars,
  renameVar: Blockly.Blocks['procedures_defnoreturn'].renameVar,
  customContextMenu: Blockly.Blocks['procedures_defnoreturn'].customContextMenu
};

Blockly.Blocks['fun_mutatorarg'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('parameter')
        .appendField(new Blockly.FieldTextInput('param', this.validator_), 'NAME');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(Blockly.Blocks.procedures.HUE);
    this.setTooltip(Blockly.Msg.PROCEDURES_MUTATORARG_TOOLTIP);
    this.contextMenu = false;
  },
  validator_: Blockly.Blocks['procedures_mutatorarg'].validator_ 
};


function getFunctionNames() {
  var options = [['select a function','']];
  var blocks = getBlocksByType(['functionblockly','functionblock']);
  for (var i = 0; i < blocks.length; i++) {
      options.push([blocks[i].getFieldValue('FUNCTION'), blocks[i].getFieldValue('FUNCTION')]);
  }
  return options;
}

function nextFuntionName() {
  var blocks = getBlocksByType(['functionblockly','functionblock']);
  return 'Function' + (blocks.length + 1);
}

Blockly.Blocks['functioncall'] = {
    init: function() {
    this.appendDummyInput('function')
        .appendField(new Blockly.FieldDropdown(getFunctionNames), 'FUNCTIONCALL');
    this.appendStatementInput('parameter')
        .setCheck(['parameter'])
        .appendField('Parameter(s)');
    this.appendStatementInput('funtermtype')
        .setCheck(['functiontermtype'])
        .appendField('Optional');
    this.setColour(functionColour);
    this.setPreviousStatement(true, ['objectmap', 'predicategraphtermap', 'parenttriplesmap']); //'predicatemap', 'subjectmap',
    this.setNextStatement(true, ['objectmap', 'predicategraphtermap', 'parenttriplesmap']); //'predicatemap', 'subjectmap',
    this.setTooltip('Creates a function call.');
    this.setHelpUrl('https://www.scss.tcd.ie/~crottija/funul/');
  }
};

Blockly.Blocks['functiontermtype'] = {
  init: function() {
    this.setColour(objectColour);
    this.appendDummyInput("termtype")
        .appendField("Term type")
        .appendField(new Blockly.FieldDropdown([['iri', 'termtypeiri'], ['literal', 'termtypeliteral']]), 'TERMTYPE');
    this.appendValueInput("termtypevalue")
        .appendField("as/in")
        .setCheck(["objectdatatype", "objectlanguage"]);
    this.setPreviousStatement(true, ['functiontermtype']);
    this.setInputsInline(true);
    this.setTooltip('Defines a term type.');
    this.setHelpUrl('http://www.w3.org/ns/r2rml#termType');
  }, onchange: function() {
    if(this.getFieldValue('TERMTYPE') == 'termtypeliteral') {
      this.getInput('termtypevalue').setVisible(true);
    } else {
      this.getInput('termtypevalue').setVisible(false);
    }
    this.render();
  }
};


Blockly.Blocks['parameter'] = {
    init: function() {
    this.appendDummyInput('parameter')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE')
        .appendField('');
    this.setColour(functionColour);
    this.setPreviousStatement(true, ['parameter']);
    this.setNextStatement(true, ['parameter']);
    this.setTooltip('Creates a parameter.');
    this.setHelpUrl('https://www.scss.tcd.ie/~crottija/funul/');
  }
};

Blockly.Blocks['funul_controls_if'] = {
  init: function() {
    this.setHelpUrl(Blockly.Msg.CONTROLS_IF_HELPURL);
    this.setColour(Blockly.Blocks.logic.HUE);
    this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_IF);
    this.appendStatementInput('DO0')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
    this.setPreviousStatement(true, ['functionblockly', 'funul_controls_if', 'load', 'callfunction']);
    this.setNextStatement(true, ['functionblockly', 'funul_controls_if', 'load', 'callfunction']);
    this.setMutator(new Blockly.Mutator(['controls_if_elseif',
                                         'controls_if_else']));
    var thisBlock = this;
    this.setTooltip(function() {
      if (!thisBlock.elseifCount_ && !thisBlock.elseCount_) {
        return Blockly.Msg.CONTROLS_IF_TOOLTIP_1;
      } else if (!thisBlock.elseifCount_ && thisBlock.elseCount_) {
        return Blockly.Msg.CONTROLS_IF_TOOLTIP_2;
      } else if (thisBlock.elseifCount_ && !thisBlock.elseCount_) {
        return Blockly.Msg.CONTROLS_IF_TOOLTIP_3;
      } else if (thisBlock.elseifCount_ && thisBlock.elseCount_) {
        return Blockly.Msg.CONTROLS_IF_TOOLTIP_4;
      }
      return '';
    });
    this.elseifCount_ = 0;
    this.elseCount_ = 0;
  },
  mutationToDom: Blockly.Blocks['controls_if'].mutationToDom,
  domToMutation: Blockly.Blocks['controls_if'].domToMutation,
  decompose: Blockly.Blocks['controls_if'].decompose,
  compose: Blockly.Blocks['controls_if'].compose,
  saveConnections: Blockly.Blocks['controls_if'].saveConnections,
  updateShape_: Blockly.Blocks['controls_if'].updateShape_
};

Blockly.Blocks['load'] = {
    init: function() {
    this.appendDummyInput('load')
        .appendField(new Blockly.FieldLabel('load ', textClass))
        .appendField(new Blockly.FieldTextInput('insert file path here'), 'filepath')
        .appendField('');
    this.setColour(loadColour);
    this.setPreviousStatement(true, ['funul_controls_if', 'load', 'callfunction']);
    this.setNextStatement(true, ['funul_controls_if', 'load', 'callfunction']);
    this.setTooltip('Creates a parameter.');
    this.setHelpUrl('https://www.scss.tcd.ie/~crottija/funul/');
  }
};


Blockly.Blocks['callfunction'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('call ')
        .appendField(new Blockly.FieldTextInput('function name'), 'functionname');
    this.itemCount_ = 0;
    this.updateShape_();
    this.setMutator(new Blockly.Mutator(['funcparameters']));
    this.setPreviousStatement(true, ['funul_controls_if', 'load', 'callfunction']);
    this.setNextStatement(true, ['funul_controls_if', 'load', 'callfunction']);
    this.setColour(functionColour); //TODO
    this.setTooltip('Calls a function.');
  },
  mutationToDom: Blockly.Blocks['lists_create_with'].mutationToDom,
  domToMutation: Blockly.Blocks['lists_create_with'].domToMutation,
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('funcparameterscontainer');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.itemCount_; i++) {
      var itemBlock = workspace.newBlock('funcparameters');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: Blockly.Blocks['lists_create_with'].compose,
  saveConnections: Blockly.Blocks['lists_create_with'].saveConnections,
  updateShape_: function() {
    for (var i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('ADD' + i)) {
        var input = this.appendValueInput('ADD' + i);
      }
    }
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
  }
};

Blockly.Blocks['callfunctionwithreturn'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('call ')
        .appendField(new Blockly.FieldTextInput('function name'), 'functionname');
    this.itemCount_ = 0;
    this.updateShape_();
    this.setOutput(true, ['return', 'variables_set']);
    this.setColour(loadColour);
    this.setMutator(new Blockly.Mutator(['funcparameters']));
  },
  mutationToDom: Blockly.Blocks['lists_create_with'].mutationToDom,
  domToMutation: Blockly.Blocks['lists_create_with'].domToMutation,
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('funcparameterscontainer');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.itemCount_; i++) {
      var itemBlock = workspace.newBlock('funcparameters');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: Blockly.Blocks['lists_create_with'].compose,
  saveConnections: Blockly.Blocks['lists_create_with'].saveConnections,
  updateShape_: function() {
    for (var i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('ADD' + i)) {
        var input = this.appendValueInput('ADD' + i);
      }
    }
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
  }
};

Blockly.Blocks['funcparameters'] = {
  init: function() {
    this.setColour(Blockly.Blocks.lists.HUE); // TODO check colour
    this.appendDummyInput()
        .appendField('parameter');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};

Blockly.Blocks['funcparameterscontainer'] = {
  init: function() {
    this.setColour(Blockly.Blocks.lists.HUE);
    this.appendDummyInput()
        .appendField('Parameters');
    this.appendStatementInput('STACK');
    this.setTooltip(Blockly.Msg.LISTS_CREATE_WITH_CONTAINER_TOOLTIP);
    this.contextMenu = false;
  }
};

/*
export
var xml = Blockly.Xml.workspaceToDom(workspace);
var xml_text = Blockly.Xml.domToText(xml);


import
var xml = Blockly.Xml.textToDom(xml_text);
Blockly.Xml.domToWorkspace(xml, workspace);

*/
