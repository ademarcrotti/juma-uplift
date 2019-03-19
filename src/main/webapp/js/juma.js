 'use strict';

var vocabColour = 62;
var tableColour = 85;
var subjectColour = '#5fb3ce';
var predicateColour = '#8FBC8F';
var predicateObjectColour = '#5FBEE1';
var linkingColour = '#009999';
var objectColour = '#7eaabc';
var graphColour = 320;
var functionColour = '#DEB887';
var parametersColour = '#CC6600';

var vocabs = [
        ['rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>', 'rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>'],
        ['rdfs: <http://www.w3.org/2000/01/rdf-schema#>', 'rdfs: <http://www.w3.org/2000/01/rdf-schema#>'], 
        ['xsd: <http://www.w3.org/2001/XMLSchema#>', 'xsd: <http://www.w3.org/2001/XMLSchema#>'],
        ['foaf: <http://xmlns.com/foaf/0.1/>', 'foaf: <http://xmlns.com/foaf/0.1/>']
       ];

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

function nextSubjectDef() {
  var blocks = getBlocksByType('subjectdef');
  return (blocks.length + 1);
}


Blockly.Blocks['mapping'] = {
    init: function() {
    this.appendStatementInput('mapping')
        .appendField('Mapping')
        .setCheck('tablesqlquery')
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendStatementInput('vocabs')
        .appendField('to')
        .setCheck(['prefix', 'predefinedprefix'])
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendStatementInput('subjects')
        .appendField('')
        .setCheck('subjectdef')
        .setAlign(Blockly.ALIGN_RIGHT);
    this.setColour('#005580');
    this.setPreviousStatement(true, ['mapping']);
    this.setNextStatement(true, ['mapping']);
    this.setTooltip('Creates a mapping.');
  }
};

Blockly.Blocks['tablesqlquery'] = {
    init: function() {
    if(this.sql != undefined){
      sqlFromDatabase = this.sql.substring(0,20) + (this.sql.length > 20 ? '...' : '')    
    }
    this.setColour(tableColour);
    this.appendDummyInput('tablesqlquery')
        .appendField(new Blockly.FieldDropdown([['table', 'table'], ['sql query', 'sqlquery']]), 'TABLESQLQUERY')
        .appendField(new Blockly.FieldLabel('click here to insert',''), 'sql'); 
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['mapping', 'tablesqlquery']);
    this.setTooltip('Defines a table or sql query.');
    this.sql = "click here to insert";
    // this.setMovable(false);
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

Blockly.Blocks['subjectdef'] = {
    init: function() {
    this.appendDummyInput('id')
        .appendField('Id: ')
        .appendField(new Blockly.FieldTextInput(nextSubjectDef()), 'ID');
    this.appendValueInput("source")
        .appendField("subject")
        .setCheck(['subject', 'subjectdef']);
    this.appendStatementInput("properties")
        .setCheck(['bnode', 'classes', 'predicate_object']);
    this.setColour('#1a7fa8');
    this.setPreviousStatement(true, ['subjectdef']);
    this.setNextStatement(true, 'subjectdef');
    this.setTooltip('Defines a subject definition.');
    this.setInputsInline(true);
  }, onchange: function(event) {
    if(event.type == Blockly.Events.CREATE) {
      var newBlock = workspace.getBlockById(event.blockId);
      if(newBlock == null) {
        return;
      }

      if(newBlock.type == 'subjectdef') {
        newBlock.setFieldValue((nextSubjectDef() - 1), 'ID');
      }
    }
  }
};

Blockly.Blocks['subject'] = {
    init: function() {
    this.appendDummyInput('termmap')
        .appendField('using')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE');
    this.setColour(subjectColour);
    this.setTooltip('Defines a subject.');
    this.setOutput(true, 'subjectdef');
  }
};

Blockly.Blocks['class'] = {
    init: function() {
    this.setColour(subjectColour);
    this.appendDummyInput('class')
        .appendField('with class: ')
        .appendField(new Blockly.FieldTextInput('insert value'), 'CLASS');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setNextStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setTooltip('Defines a class.');
  }
};

Blockly.Blocks['classes'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('with classes')
        .appendField('', 'PARAMS');
    this.setMutator(new Blockly.Mutator(['class_each']));
    this.setPreviousStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setNextStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setColour(subjectColour);
    this.setTooltip('Defines classes.');
    this.arguments_ = [];
  },
  setStatements_: function() {}, 
  updateParams_: function() {
    var badArg = false;
    var hash = {};
    for (var i = 0; i < this.arguments_.length; i++) {
      if (hash['arg_' + this.arguments_[i].toLowerCase()]) {
        badArg = true;
        break;
      }
      hash['arg_' + this.arguments_[i].toLowerCase()] = true;
    }
    if (badArg) {
      this.setWarningText('This construct has duplicate classes.');
    } else {
      this.setWarningText(null);
    }
    var paramString = '';
    if (this.arguments_.length) {
      paramString = this.arguments_.join(', ');
    }
    Blockly.Events.disable();
    try {
      this.setFieldValue(paramString, 'PARAMS');
    } finally {
      Blockly.Events.enable();
    }
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    for (var i = 0; i < this.arguments_.length; i++) {
      var parameter = document.createElement('arg');
      parameter.setAttribute('name', this.arguments_[i]);
      container.appendChild(parameter);
    }
    return container;
  },
  domToMutation: function(xmlElement) {
    this.arguments_ = [];
    for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        this.arguments_.push(childNode.getAttribute('name'));
      }
    }
    this.updateParams_();
  },
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('classes_list');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.arguments_.length; i++) {
      var paramBlock = workspace.newBlock('class_each');
      paramBlock.initSvg();
      paramBlock.setFieldValue(this.arguments_[i], 'NAME');
      paramBlock.oldLocation = i;
      connection.connect(paramBlock.previousConnection);
      connection = paramBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: function(containerBlock) {
    this.arguments_ = [];
    var paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock) {
      this.arguments_.push(paramBlock.getFieldValue('NAME'));
      paramBlock = paramBlock.nextConnection &&
          paramBlock.nextConnection.targetBlock();
    }
    this.updateParams_();
  },
  onchange: function() {
     validateFields(this);
  }
};

Blockly.Blocks['classes_list'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('classes');
    this.appendStatementInput('STACK');
    this.setColour(subjectColour);
    this.setTooltip('');
    this.contextMenu = false;
  }
};

Blockly.Blocks['class_each'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('class')
        .appendField(new Blockly.FieldTextInput('class'), 'NAME');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(subjectColour);
    this.setTooltip('');
    this.contextMenu = false;
  }
};

Blockly.Blocks['bnode'] = {
    init: function() {
    this.setColour(subjectColour);
    this.appendDummyInput('blank_node')
        .appendField('with subject as blank node');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setNextStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setTooltip('Defines the subject as a blank node.');
  }, onchange: function() {
     validateFields(this);
  }
};

Blockly.Blocks['predicate_object'] = {
  init: function() {
    this.setColour(predicateObjectColour);
    this.appendValueInput("predicate")
        .appendField("predicate")
        .setCheck(['predicate']);
    this.appendValueInput("object")
        .appendField("and object")
        .setCheck(['object', 'linking_mappings']);
    this.setPreviousStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setNextStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setInputsInline(true);
    this.setTooltip('Structure to define predicates and objects.');
  }
};

Blockly.Blocks['predicate'] = {
    init: function() {
    this.setColour(predicateColour);
    this.appendDummyInput('predicate')
        .appendField('using')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE');
    this.setInputsInline(true);
    this.setOutput(true, ['predicate']);
    this.setTooltip('Defines a predicate.');
    // this.setMovable(false);
  }
};

Blockly.Blocks['object'] = {
    init: function() {
    this.setColour(objectColour);
    this.appendDummyInput('object')
        .appendField('using')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE')
        .appendField('as/with:')
        .appendField(new Blockly.FieldCheckbox('FALSE'), 'WITHTERMTYPE');
    this.appendDummyInput('termtype')
        // .appendField('as/with')
        .appendField(' ')
        .appendField(new Blockly.FieldDropdown([ ['iri', 'termtypeiri'], ['blank node', 'termtypeblanknode'], ['literal', 'termtypeliteral'], ['datatype', 'datatype'], ['language', 'language']]), 'TERMTYPE');
    this.appendDummyInput('termtypevalue')
        .appendField(' ')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMTYPEVALUE');
    this.setOutput(true, ['object']);
    this.setTooltip('Defines an object.');
    this.setInputsInline(true);
  }, onchange: function() {
    if(this.getFieldValue('WITHTERMTYPE') == 'TRUE') {
      this.getInput('termtype').setVisible(true);
      if(this.getFieldValue('TERMTYPE') == 'datatype' || this.getFieldValue('TERMTYPE') == 'language') {
          this.getInput('termtypevalue').setVisible(true);
      } else {
        this.getInput('termtypevalue').setVisible(false);
      }
    } else {
      this.getInput('termtype').setVisible(false);
      this.getInput('termtypevalue').setVisible(false);
    }
    this.render();
  }
};

Blockly.Blocks['linking_mappings'] = {
    init: function() {
    this.setColour(linkingColour);
    this.appendDummyInput('parenttriplemap')
        .appendField('using')
        .appendField(new Blockly.FieldDropdown(loadMappings), 'LINK')
        .appendField('', 'JOINS');
    this.setTooltip('Defines a link between mappings.');
    this.setMutator(new Blockly.Mutator(['join_each']));
    this.arguments_ = [];
    this.setOutput(true, ['object']);
  },
  updateParams_: function() {
    var joins = '';
    if (this.arguments_.length) {
      for (var i = 0; i < this.arguments_.length; i++) {
      	var join = this.arguments_[i];
      	if(joins != '') {
      		joins += '; ';
      	}
      	joins += join[0] + ' and ' + join[1];
      }
    }
    Blockly.Events.disable();
    try {
      if(joins != '') {
        joins = 'matching columns: ' + joins;
      }
      this.setFieldValue(joins, 'JOINS');
    } finally {
      Blockly.Events.enable();
    }
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    for (var i = 0; i < this.arguments_.length; i++) {
      var parameter = document.createElement('arg');
      parameter.setAttribute('child', this.arguments_[i][0]);
      parameter.setAttribute('parent', this.arguments_[i][1]);
      container.appendChild(parameter);
    }
    return container;
  },
  domToMutation: function(xmlElement) {
    this.arguments_ = [];
    for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        this.arguments_.push([childNode.getAttribute('child'), childNode.getAttribute('parent')]);
      }
    }
    this.updateParams_();
  },
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('join_list');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.arguments_.length; i++) {
      var paramBlock = workspace.newBlock('join_each');
      paramBlock.initSvg();
      paramBlock.setFieldValue(this.arguments_[i][0], 'CHILD');
      paramBlock.setFieldValue(this.arguments_[i][1], 'PARENT');
      paramBlock.oldLocation = i;
      connection.connect(paramBlock.previousConnection);
      connection = paramBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: function(containerBlock) {
    this.arguments_ = [];
    var paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock) {
      this.arguments_.push([paramBlock.getFieldValue('CHILD'), paramBlock.getFieldValue('PARENT')]);
      paramBlock = paramBlock.nextConnection &&
          paramBlock.nextConnection.targetBlock();
    }
    this.updateParams_();
  }, 
  onchange: function(ev) {
    var block = workspace.getBlockById(this.id);
    if(block != null){
      var subject = findSubjectIdBlock(block);
      if(subject != null && this.getFieldValue('LINK') == subject.getFieldValue('ID')){
        alert('A link should be between different subject definitions.');
        this.setFieldValue(0, 'LINK');
      }  
    }
  }
};

function findSubjectIdBlock(block) {
  if(block == null) {
    return null;
  }
  if(block.type == 'subjectdef') {
    return block;
  }
  return findSubjectIdBlock(block.getParent());
}

Blockly.Blocks['join_list'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('joins');
    this.appendStatementInput('STACK');
    this.setColour(subjectColour);
    this.setTooltip('');
    this.contextMenu = false;
  }
};

Blockly.Blocks['join_each'] = {
  init: function() {
    this.setColour(subjectColour);
    this.appendDummyInput('joinconditionchild')
        .appendField('column:')
        .appendField(new Blockly.FieldTextInput('from this table'), 'CHILD');
    this.appendDummyInput('joinconditionparent')
        .appendField('column:')
        .appendField(new Blockly.FieldTextInput('from selected table'), 'PARENT');
    this.setPreviousStatement(true, ['joincondition']);
    this.setNextStatement(true, ['joincondition']);
    this.setTooltip('Defines a join condition.');
    this.contextMenu = false;
  }
};

function loadMappings() {
  var options = [['select a mapping','']];
  var blocks = getBlocksByType('subjectdef');
  for (var i = 0; i < blocks.length; i++) {
      options.push([blocks[i].getFieldValue('ID'), blocks[i].getFieldValue('ID')]);
  }
  return options;
}

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
});



Blockly.Blocks['prefix'] = {
    init: function() {
    this.setColour(vocabColour);
    this.appendDummyInput('prefix')
        .appendField('')
        .appendField(new Blockly.FieldTextInput('insert prefix here'), 'PREFIX');
    this.appendDummyInput('uri')
        .appendField(new Blockly.FieldLabel(': <', textClass))
        .appendField(new Blockly.FieldTextInput('insert uri here'), 'URI')
    .appendField(new Blockly.FieldLabel('>', textClass));
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['prefix', 'predefinedprefix']);
    this.setNextStatement(true, ['prefix', 'predefinedprefix']);
    this.setTooltip('Defines a prefix.');
  }
};

Blockly.Blocks['base'] = {
    init: function() {
    this.setColour(vocabColour);
    this.appendDummyInput('base')
        .appendField('base <')
        .appendField(new Blockly.FieldTextInput('insert uri here'), 'URI')
        .appendField('>');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['prefix', 'predefinedprefix']);
    this.setNextStatement(true, ['prefix', 'predefinedprefix']);
    this.setTooltip('Defines a base uri.');
  }
};

Blockly.Blocks['predefinedprefix'] = {
    init: function() {
    this.setColour(vocabColour);
    this.appendDummyInput('prefix')
        .appendField('')
        .appendField(new Blockly.FieldDropdown(vocabs), 'PREFIX');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['prefix', 'predefinedprefix']);
    this.setNextStatement(true, ['prefix', 'predefinedprefix']);
    this.setTooltip('Defines a prefix.');
  }
};

Blockly.Blocks['graph'] = {
    init: function() {
    this.setColour(graphColour);
    this.appendDummyInput('graphtermap')
      .appendField('in graph')
      .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
      .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setNextStatement(true, ['bnode', 'predicate_object', 'subject', 'graph']);
    this.setTooltip('Defines a graph.');
  } 
};

// Utils

//************************************
//find all blocks on workspace by type
//************************************
function getBlocksByType(type) {
  var blocks = [];
  for (var blockID in workspace.blockDB_) {
    if (type == workspace.blockDB_[blockID].type) {
      blocks.push(workspace.blockDB_[blockID]);
    }
  }
  return(blocks);
}

function validateFields(block) {
  if(block.getDescendants() != undefined){
       var descendants = block.getDescendants();
       var typesToValidate = {'bnode': 'blank node', 'classes': 'classes'};
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
                alert('Only one ' + typesToValidate[type]  + ' block permited!');
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

// FUNCTIONS

Blockly.Blocks['load'] = {
    init: function() {
    this.appendDummyInput('load')
        .appendField(new Blockly.FieldLabel('load file'))
        .appendField(new Blockly.FieldTextInput('insert file path here'), 'filepath')
        .appendField('');
    this.setColour(functionColour);
    this.setPreviousStatement(true, ['mapping', 'prefix', 'predefinedprefix', 'load']);
    this.setNextStatement(true, ['mapping', 'prefix', 'predefinedprefix', 'load']);
    this.setTooltip('Loads a file.');
  }
};

// TODO if function is being used for subjects/predicates then hide as/with (term types and values)

Blockly.Blocks['concat'] = {
  init: function() {
    this.appendDummyInput('function')      
        .appendField('concatenating')
        .appendField('', 'PARAMS');
    this.setMutator(new Blockly.Mutator(['parameter']));
    this.setColour(functionColour);
    this.setTooltip('Concatenation function.');
    this.arguments_ = [];
    this.termtype = '';
    this.termtypevalue = '';
    this.setOutput(true, ['object']);//['predicate','subject','object']
  }, 
  updateParams_: function() {
    var params = '';
    if(this.arguments_.length < 2) {
      params = 'This function must have at least 2 parameters.';
    } else {
      for (var i = 0; i < this.arguments_.length; i++) {
        var param = this.arguments_[i];
        if(params != '') {
            params += ', ';
        }
        params += param[1];
      }
    }
    Blockly.Events.disable();
    try {
      if(params != '') {
        params = params;
      }
      this.setFieldValue(params, 'PARAMS');
    } finally {
      Blockly.Events.enable();
    }
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    for (var i = 0; i < this.arguments_.length; i++) {
      var parameter = document.createElement('arg');
      parameter.setAttribute('paramtype', this.arguments_[i][0]);
      parameter.setAttribute('paramvalue', this.arguments_[i][1]);

      container.appendChild(parameter);
    }

    container.setAttribute('termtype', this.termtype);
    container.setAttribute('termtypevalue', this.termtypevalue);

    return container;
  },
  domToMutation: function(xmlElement) {
    this.arguments_ = [];
    for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        this.arguments_.push([childNode.getAttribute('paramtype'), childNode.getAttribute('paramvalue')]);
      }
    }
    this.updateParams_();

    this.termtype = xmlElement.getAttribute('termtype');
    this.termtypevalue = xmlElement.getAttribute('termtypevalue');
  },
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('parameters');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.arguments_.length; i++) {
      var paramBlock = workspace.newBlock('parameter');
      paramBlock.initSvg();
      paramBlock.setFieldValue(this.arguments_[i][0], 'paramtype');
      paramBlock.setFieldValue(this.arguments_[i][1], 'paramvalue');
      paramBlock.oldLocation = i;
      connection.connect(paramBlock.previousConnection);
      connection = paramBlock.nextConnection;
    }
    
    containerBlock.setFieldValue(this.termtype, 'TERMTYPE');
    if(this.termtype == 'language' || this.termtype == 'datatype'){
      containerBlock.setFieldValue(this.termtypevalue, 'TERMTYPEVALUE');
    }

    if(this.outputConnection != null && this.outputConnection.targetConnection != null && this.outputConnection.targetConnection.check_[0] != 'object'){
        containerBlock.getInput('termtype').setVisible(false);
        containerBlock.setFieldValue('', 'TERMTYPE');
    } else {
        containerBlock.getInput('termtype').setVisible(true);
        containerBlock.onchange();
    }

    containerBlock.render();

    return containerBlock;
  },
  compose: function(containerBlock) {
    this.arguments_ = [];
    var paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock) {
      this.arguments_.push([paramBlock.getFieldValue('paramtype'), paramBlock.getFieldValue('paramvalue')]);
      paramBlock = paramBlock.nextConnection &&
          paramBlock.nextConnection.targetBlock();
    }
    this.updateParams_();

    this.termtype = containerBlock.getFieldValue('TERMTYPE');
    this.termtypevalue = containerBlock.getFieldValue('TERMTYPEVALUE');
  }
};


Blockly.Blocks['replace'] = {
  init: function() {
    this.appendDummyInput('function')      
        .appendField('replacing')
        .appendField('', 'PARAMS');
    this.setMutator(new Blockly.Mutator(['parameter']));
    this.setColour(functionColour);
    this.setTooltip('String replace function.');
    this.arguments_ = [];
    this.termtype = '';
    this.termtypevalue = '';
    this.setOutput(true, ['object']);//['predicate','subject','object']
  }, 
  updateParams_: function() {
    var params = '';
    if(this.arguments_.length != 3) {
      params = 'This function must have 3 parameters.';
    } else {
      params = this.arguments_[0][1] + ' with ' + this.arguments_[1][1] + ' in ' + this.arguments_[2][1];
    }
    Blockly.Events.disable();
    try {
      this.setFieldValue(params, 'PARAMS');
    } finally {
      Blockly.Events.enable();
    }
  },
  mutationToDom: Blockly.Blocks['concat'].mutationToDom,
  domToMutation: Blockly.Blocks['concat'].domToMutation,
  decompose: Blockly.Blocks['concat'].decompose,
  compose: Blockly.Blocks['concat'].compose
};

Blockly.Blocks['substring'] = {
  init: function() {
    this.appendDummyInput('function')      
        .appendField('substring')
        .appendField('', 'PARAMS');
        // .appendField('from')
        // .appendField(new Blockly.FieldTextInput('', this.validator_), 'from')
        // .appendField('to')
        // .appendField(new Blockly.FieldTextInput('', this.validator_), 'to');
    this.setMutator(new Blockly.Mutator(['parameter']));
    this.setColour(functionColour);
    this.setTooltip('Sum function.');
    this.arguments_ = [];
    this.termtype = '';
    this.termtypevalue = '';
    this.setOutput(true, ['object']);//['predicate','subject','object']
  },
  validator_: function(newVar) {
    return /^\+?\d+$/.test(newVar) ? newVar : null;
  }, 
  updateParams_: function() {
    var params = '';
    if(this.arguments_.length != 3) {
      params = 'This function must have 3 parameter.';
    } else {
      params = this.arguments_[0][1] + ' from ' + this.arguments_[1][1] + ' to ' + this.arguments_[2][1];
    }

    Blockly.Events.disable();
    try {
      this.setFieldValue(params, 'PARAMS');
    } finally {
      Blockly.Events.enable();
    }
  },
  mutationToDom: Blockly.Blocks['concat'].mutationToDom,
  domToMutation: Blockly.Blocks['concat'].domToMutation,
  decompose: Blockly.Blocks['concat'].decompose,
  compose: Blockly.Blocks['concat'].compose
};


Blockly.Blocks['sum'] = {
  init: function() {
    this.appendDummyInput('function')      
        .appendField('summing')
        .appendField('', 'PARAMS');
    this.setMutator(new Blockly.Mutator(['parameter']));
    this.setColour(functionColour);
    this.setTooltip('Sum function.');
    this.arguments_ = [];
    this.termtype = '';
    this.termtypevalue = '';
    this.setOutput(true, ['object']);//['predicate','subject','object']
  }, 
  updateParams_: Blockly.Blocks['concat'].updateParams_,
  mutationToDom: Blockly.Blocks['concat'].mutationToDom,
  domToMutation: Blockly.Blocks['concat'].domToMutation,
  decompose: Blockly.Blocks['concat'].decompose,
  compose: Blockly.Blocks['concat'].compose
};

Blockly.Blocks['avg'] = {
  init: function() {
    this.appendDummyInput('function')      
        .appendField('averaging')
        .appendField('', 'PARAMS');
    this.setMutator(new Blockly.Mutator(['parameter']));
    this.setColour(functionColour);
    this.setTooltip('Sum function.');
    this.arguments_ = [];
    this.termtype = '';
    this.termtypevalue = '';
    this.setOutput(true, ['object']);//['predicate','subject','object']
  }, 
  updateParams_: Blockly.Blocks['concat'].updateParams_,
  mutationToDom: Blockly.Blocks['concat'].mutationToDom,
  domToMutation: Blockly.Blocks['concat'].domToMutation,
  decompose: Blockly.Blocks['concat'].decompose,
  compose: Blockly.Blocks['concat'].compose
};


Blockly.Blocks['parameters'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('parameters');
    this.appendStatementInput('STACK');
    this.appendDummyInput('termtype')
        .appendField('as/with')
        .appendField(new Blockly.FieldDropdown([ ['optional', ''], ['iri', 'termtypeiri'], ['blank node', 'termtypeblanknode'], ['literal', 'termtypeliteral'], ['datatype', 'datatype'], ['language', 'language']]), 'TERMTYPE')
        .appendField(' ');
    this.appendDummyInput('termtypevalue')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMTYPEVALUE');;
    this.setColour(parametersColour);
    this.setTooltip('');
    this.contextMenu = false;
    this.setInputsInline(true);
  }, onchange: function() {
    if(this.getFieldValue('TERMTYPE') == 'datatype' || this.getFieldValue('TERMTYPE') == 'language') {
      this.getInput('termtypevalue').setVisible(true);
    } else {
      this.getInput('termtypevalue').setVisible(false);
    }
    this.render();
  }
};

Blockly.Blocks['parameter'] = {
  init: function() {
    this.setColour(parametersColour);
    this.appendDummyInput('param')
                .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'paramtype')
                .appendField(new Blockly.FieldTextInput('insert value'), 'paramvalue');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Defines a parameter.');
    this.contextMenu = false;
  }
};


Blockly.Blocks['callfunctionwithreturn'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('call ')
        .appendField(new Blockly.FieldTextInput('function name'), 'functionname')
        .appendField('', 'PARAMS');
    this.arguments_ = [];
    this.termtype = '';
    this.termtypevalue = '';
    this.setOutput(true, ['predicate','subject','object']);
    this.setColour(functionColour);
    this.setMutator(new Blockly.Mutator(['parameter']));
  },
  updateParams_: function() {
    var params = '';
    if (this.arguments_.length) {
      for (var i = 0; i < this.arguments_.length; i++) {
        var param = this.arguments_[i];
        if(params != '') {
            params += ', ';
        }
        params += param[1];
      }
    }
    Blockly.Events.disable();
    try {
      if(params != '') {
        params = 'with: ' + params;
      }
      this.setFieldValue(params, 'PARAMS');
    } finally {
      Blockly.Events.enable();
    }
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    for (var i = 0; i < this.arguments_.length; i++) {
      var parameter = document.createElement('arg');
      parameter.setAttribute('paramtype', this.arguments_[i][0]);
      parameter.setAttribute('paramvalue', this.arguments_[i][1]);

      container.appendChild(parameter);
    }

    container.setAttribute('termtype', this.termtype);
    container.setAttribute('termtypevalue', this.termtypevalue);

    return container;
  },
  domToMutation: function(xmlElement) {
    this.arguments_ = [];
    for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        this.arguments_.push([childNode.getAttribute('paramtype'), childNode.getAttribute('paramvalue')]);
      }
    }
    this.updateParams_();

    this.termtype = xmlElement.getAttribute('termtype');
    this.termtypevalue = xmlElement.getAttribute('termtypevalue');
  },
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('parameters');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.arguments_.length; i++) {
      var paramBlock = workspace.newBlock('parameter');
      paramBlock.initSvg();
      paramBlock.setFieldValue(this.arguments_[i][0], 'paramtype');
      paramBlock.setFieldValue(this.arguments_[i][1], 'paramvalue');
      paramBlock.oldLocation = i;
      connection.connect(paramBlock.previousConnection);
      connection = paramBlock.nextConnection;
    }

    containerBlock.setFieldValue(this.termtype, 'TERMTYPE');
    if(this.termtype == 'language' || this.termtype == 'datatype'){
      containerBlock.setFieldValue(this.termtypevalue, 'TERMTYPEVALUE');
    }

    if(this.outputConnection != null && this.outputConnection.targetConnection != null && this.outputConnection.targetConnection.check_[0] != 'object'){
        containerBlock.getInput('termtype').setVisible(false);
        containerBlock.setFieldValue('', 'TERMTYPE');
    } else {
        containerBlock.getInput('termtype').setVisible(true);
        containerBlock.onchange();
    }

    containerBlock.render();
    return containerBlock;
  },
  compose: function(containerBlock) {
    this.arguments_ = [];
    var paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock) {
      this.arguments_.push([paramBlock.getFieldValue('paramtype'), paramBlock.getFieldValue('paramvalue')]);
      paramBlock = paramBlock.nextConnection &&
          paramBlock.nextConnection.targetBlock();
    }
    this.updateParams_();

    this.termtype = containerBlock.getFieldValue('TERMTYPE');
    this.termtypevalue = containerBlock.getFieldValue('TERMTYPEVALUE');
  }
};
  

/*
export
var xml = Blockly.Xml.workspaceToDom(workspace);
var xml_text = Blockly.Xml.domToText(xml);


import
var xml = Blockly.Xml.textToDom(xml_text);
Blockly.Xml.domToWorkspace(xml, workspace);

Blockly.Blocks['object2'] = {
    init: function() {
    this.setColour('#61b5b2');
    this.appendDummyInput('object')
        .appendField('from')
        .appendField(new Blockly.FieldDropdown([['constant', 'CONSTANT'], ['column', 'COLUMN'], ['template', 'TEMPLATE']]), 'TERMMAP')
        .appendField(new Blockly.FieldTextInput('insert value'), 'TERMMAPVALUE');
    this.setOutput(true, ['object']);
    this.setTooltip('Defines an object.');
    this.setMutator(new Blockly.Mutator(['object_option']));
    this.hasOptions = 'false';
    this.setInputsInline(true);
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('hasOptions', this.hasOptions);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.hasOptions = xmlElement.getAttribute('hasOptions');
  },
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('object_options');
    containerBlock.initSvg();
    if(this.hasOptions == 'true') {
      var connection = containerBlock.getInput('STACK').connection;
      var paramBlock = workspace.newBlock('object_option');
      paramBlock.initSvg();
      connection.connect(paramBlock.previousConnection);
      connection = paramBlock.nextConnection;
    }
    
    return containerBlock;
  },
  compose: function(containerBlock) {
    var paramBlock = containerBlock.getInputTargetBlock('STACK');
    if(paramBlock != null ) {
      if(this.getInput('options') == null) {
        this.hasOptions = 'true';
        this.appendDummyInput('options')
            .appendField(' as/with')
            .appendField(new Blockly.FieldDropdown([ ['iri', 'termtypeiri'], ['blank node', 'termtypeblanknode'], ['literal', 'termtypeliteral'], ['datatype', 'datatype'], ['language', 'language']]), 'TERMTYPE');
      }
    } else {
      this.hasOptions = 'false';
      this.removeInput('options');
    }
}, onchange: function() {
    if(this.getInput('options') != null) {
      if(this.getFieldValue('TERMTYPE') == 'datatype' || this.getFieldValue('TERMTYPE') == 'language') {
          if(this.getFieldValue('TERMTYPEVALUE') == null) { this.getInput('options').appendField(new Blockly.FieldTextInput('insert value'), 'TERMTYPEVALUE'); }
      } else {
          this.getInput('options').removeField('TERMTYPEVALUE');
      }
    }
    this.render();
  }
};

Blockly.Blocks['object_options'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('with');
    this.appendStatementInput('STACK');
    this.setColour(subjectColour);
    this.setTooltip('');
    this.contextMenu = false;
  }
};

Blockly.Blocks['object_option'] = {
  init: function() {
    this.setColour(subjectColour);
    this.appendDummyInput('option')
        .appendField('with options');
    this.setTooltip('Defines a option for objects.');
    this.setPreviousStatement(true);
    this.contextMenu = false;
  }
};

*/
