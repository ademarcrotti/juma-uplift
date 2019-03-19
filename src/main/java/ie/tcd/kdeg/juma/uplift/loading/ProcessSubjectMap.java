package ie.tcd.kdeg.juma.uplift.loading;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import r2rml.model.SubjectMap;
import r2rml.model.TriplesMap;

public class ProcessSubjectMap {

	private Document xml;

	public ProcessSubjectMap(Document xml) {

		this.xml = xml;

	}

	public void processSubjectMap(TriplesMap tmap, Element rootBlockElem, int ID) {

		SubjectMap subjmap = tmap.getSubjectMap();

		// holds values for termMap fields
		String termMapTypeStr = "";
		String termMapVariableStr = "";

		// check whether template || constant || column
		if (subjmap.isTemplateValuedTermMap()) {

			termMapTypeStr = CONST.TEMPLATE_UC;
			termMapVariableStr = subjmap.getTemplate().toString();

		} else if (subjmap.isColumnValuedTermMap()) {

			termMapTypeStr = CONST.COLUMN_UC;
			termMapVariableStr = subjmap.getColumn();

		} else if (subjmap.isConstantValuedTermMap()) {

			termMapTypeStr = CONST.CONSTANT_UC;
			termMapVariableStr = subjmap.getConstant().toString();

		} else {
			System.out.println(
					"Something went wrong when determining TEMPLATE/COLUMN/ " + "CONSTANT type for a subject map");
		}

		String uppercase = termMapVariableStr.substring(termMapVariableStr.lastIndexOf("{") + 1).toUpperCase();
		termMapVariableStr = termMapVariableStr.replace(uppercase.toLowerCase(), uppercase);

		// insert to subject block
		createBasicSubjMap(rootBlockElem, termMapTypeStr, termMapVariableStr, ID, subjmap, tmap);

		// group statement elements
		NodeList nodeList = rootBlockElem.getElementsByTagName(CONST.STATEMENT);

		// statement Property elements which holds all subject objects
		Element subjMapBlockElm = null;
		for (int i = 0; i < nodeList.getLength(); i++) {

			Element e = (Element) nodeList.item(i);
			if (e.getAttribute(CONST.NAME).equals(CONST.PROPERTIES)) {
				subjMapBlockElm = e;
				break;
			}
		}

		// take care of subject block add-ons
		ProcessPartsOfSubjMap ppsm = new ProcessPartsOfSubjMap(xml);
		ppsm.processPartsSubjMap(subjMapBlockElm, subjmap, tmap);

	}

	private void createBasicSubjMap(Element rootBlockElem, String termMapTypeStr, String termMapVariableStr, int ID,
			SubjectMap subjmap, TriplesMap tmap) {

		// start from field and work out

		// Christophes code including some of mine

		boolean hasClasses = false;

		// TERMMAP field, <field name="TERMMAP">XXXXXXXX</field>
		Element fieldElementTermMap = xml.createElement(CONST.FIELD);
		fieldElementTermMap.setAttribute(CONST.NAME, CONST.TERMMAP_UC);
		fieldElementTermMap.appendChild(xml.createTextNode(termMapTypeStr));

		// TERMMAPVALUE field, <field
		// name="TERMMAPVALUE">http://example.com/example/{ex}</field>
		Element subjectMapFieldElementTermMapValue = xml.createElement("field");
		subjectMapFieldElementTermMapValue.setAttribute(CONST.NAME, CONST.TERMMAPVALUE_UC);

		subjectMapFieldElementTermMapValue.appendChild(xml.createTextNode(termMapVariableStr));

		/*
		 * Create a subject block element to hold the above elements as they are
		 * always present, later additions may not
		 */
		Element blockElementSubjMap = xml.createElement(CONST.BLOCK);
		blockElementSubjMap.setAttribute(CONST.TYPE, CONST.SUBJECT);
		blockElementSubjMap.appendChild(fieldElementTermMap);
		blockElementSubjMap.appendChild(subjectMapFieldElementTermMapValue);

		Element blockClassElem = xml.createElement(CONST.BLOCK);
		blockClassElem.setAttribute(CONST.TYPE, CONST.CLASSES);

		if (subjmap.getClasses().size() > 0) {
			hasClasses = true;
		}
		// add properties block
		Element statementPropElem = xml.createElement(CONST.STATEMENT);
		statementPropElem.setAttribute(CONST.NAME, CONST.PROPERTIES);

		if (hasClasses) {
			statementPropElem.appendChild(blockClassElem);
		}

		// add value block
		Element valueSubj = xml.createElement(CONST.VALUE);
		valueSubj.setAttribute(CONST.NAME, CONST.SOURCE);
		valueSubj.appendChild(blockElementSubjMap);

		// field ID block
		Element fieldElementID = xml.createElement(CONST.FIELD);
		fieldElementID.setAttribute(CONST.NAME, CONST.ID);
		fieldElementID.appendChild(xml.createTextNode(tmap.getDescription().getLocalName()));

		// add necessary children elements to the main block element
		Element blockSubDefElem = xml.createElement(CONST.BLOCK);
		blockSubDefElem.setAttribute(CONST.TYPE, CONST.SUBJECTDEF);
		blockSubDefElem.appendChild(fieldElementID);
		blockSubDefElem.appendChild(valueSubj);
		blockSubDefElem.appendChild(statementPropElem);

		// Overall statement from subject
		Element subjectMapStatementElement = xml.createElement(CONST.STATEMENT);
		subjectMapStatementElement.setAttribute(CONST.NAME, CONST.SUBJECTS);
		subjectMapStatementElement.appendChild(blockSubDefElem);

		// children of mapping block element
		rootBlockElem.appendChild(subjectMapStatementElement);

	}

}
