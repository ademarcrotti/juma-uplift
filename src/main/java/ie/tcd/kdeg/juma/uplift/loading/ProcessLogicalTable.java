package ie.tcd.kdeg.juma.uplift.loading;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import r2rml.model.LogicalTable;
import r2rml.model.TriplesMap;

public class ProcessLogicalTable {

	Document xml;

	public ProcessLogicalTable(Document xml) {

		this.xml = xml;

	}

	public Document processLogicalTable(TriplesMap tmap, Element rootBlockElement) {

		LogicalTable logTable = tmap.getLogicalTable();

		//SQL Query || Table
		String mutationVariable = "";
		String tableSqlQueryVariable = "";

		if (logTable.getTableName() != null) {
			mutationVariable = logTable.getTableName().toString();
			tableSqlQueryVariable = CONST.TABLE;
		} else if (logTable.getSqlQuery() != null) {
			mutationVariable = logTable.getSqlQuery().toString();
			tableSqlQueryVariable = "sql query";
		} else {
			System.out.println("Something is gone wrong, no table nor sql query found");
		}
			
		Element logicalTableStatementElem = xml.createElement(CONST.STATEMENT);
		logicalTableStatementElem.setAttribute(CONST.NAME, CONST.MAPPING);
	
		//create the block element
		Element logicalTableBlockElement = xml.createElement(CONST.BLOCK);
		logicalTableBlockElement.setAttribute(CONST.TYPE, "tablesqlquery");
			
		// Append the block element to the statement element
		logicalTableStatementElem.appendChild(logicalTableBlockElement);
	
			
		//add mutation element as child to block
		Element logicalTableMutationElem = xml.createElement("mutation");
		logicalTableMutationElem.setAttribute(CONST.SQL, mutationVariable);
	
		/*
		 * Append it to its parent
		 */
		logicalTableBlockElement.appendChild(logicalTableMutationElem);
	
		//add field elements
		Element logicalTableFieldElem = xml.createElement(CONST.FIELD);
		logicalTableFieldElem.setAttribute(CONST.NAME, CONST.TABLESQLQUERY_UC);
		logicalTableFieldElem.appendChild(xml.createTextNode(tableSqlQueryVariable));
	
		logicalTableBlockElement.appendChild(logicalTableFieldElem);
			
		//add as child to rootBlockElem
		rootBlockElement.appendChild(logicalTableStatementElem);

		return xml;

	}

}
