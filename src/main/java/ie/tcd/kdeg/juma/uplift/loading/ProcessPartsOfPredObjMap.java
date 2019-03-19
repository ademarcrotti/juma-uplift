package ie.tcd.kdeg.juma.uplift.loading;

import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.jena.rdf.model.Resource;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import r2rml.model.GraphMap;
import r2rml.model.Join;
import r2rml.model.ObjectMap;
import r2rml.model.PredicateMap;
import r2rml.model.PredicateObjectMap;
import r2rml.model.RefObjectMap;
import r2rml.model.SubjectMap;

public class ProcessPartsOfPredObjMap {

	private Document xml;

	public ProcessPartsOfPredObjMap(Document xml) {

		// Constructor
		this.xml = xml;

	}

	public void processPartsPredObjMap(PredicateObjectMap pom, Element subjectMapStatement, boolean hasClasses,
			SubjectMap subjmap) {

		boolean multiplePom = true;

		int numPredObjMap = pom.getGraphMaps().size() + pom.getPredicateMaps().size();

		if (numPredObjMap < 2) {
			multiplePom = false;
		}
		// group statement elements
		NodeList nodeList = null;

		if (hasClasses) {
			nodeList = subjectMapStatement.getElementsByTagName(CONST.BLOCK);
		}

		// statement Property elements which holds all subject objects
		Element classesBlockElem = null;

		if (hasClasses) {
			for (int i = 0; i < nodeList.getLength(); i++) {
				Element e = (Element) nodeList.item(i);
				if (e.getAttribute(CONST.TYPE).equals(CONST.CLASSES)) {
					classesBlockElem = e;
					break;
				}
			}
		} else {
			classesBlockElem = subjectMapStatement;

		}

		/*
		 * A PredicateObjectMap must contain at least one Predicate Map and at
		 * least one Object Map. Graphs are not always present.
		 */

		if (!pom.getObjectMaps().isEmpty() && pom.getRefObjectMaps().isEmpty()) {

			// Has Object Maps but no RefObjectMaps (Joins)
			for (int i = 0; i < pom.getObjectMaps().size(); i++) {

				Element predMapStatement = createPredicateBlock(pom.getPredicateMaps(), pom.getObjectMaps(), i);

				if (multiplePom || hasClasses)
					predMapStatement = putInNextElement(predMapStatement);

				NodeList nextTagList = classesBlockElem.getElementsByTagName(CONST.NEXT);

				if (nextTagList.getLength() == 0) {
					classesBlockElem.appendChild(predMapStatement);
				} else {
					Element nextTagElem = (Element) nextTagList.item(nextTagList.getLength() - 1);
					nextTagElem.getFirstChild().appendChild(predMapStatement);
				}

			}

		} else if (!pom.getRefObjectMaps().isEmpty() && pom.getObjectMaps().isEmpty()) {

			// Has RefObjectMaps (joins) but no Object Maps
			for (int i = 0; i < pom.getRefObjectMaps().size(); i++) {
				Element predMapStatement = createPredicateRefObject(pom.getPredicateMaps(), pom.getRefObjectMaps(), i);

				if (multiplePom || hasClasses)
					predMapStatement = putInNextElement(predMapStatement);

				NodeList nextTagList = classesBlockElem.getElementsByTagName(CONST.NEXT);

				if (nextTagList.getLength() == 0) {
					classesBlockElem.appendChild(predMapStatement);
				} else {
					Element nextTagElem = (Element) nextTagList.item(nextTagList.getLength() - 1);
					nextTagElem.getFirstChild().appendChild(predMapStatement);
				}

			}

		} else if (!pom.getObjectMaps().isEmpty() && !pom.getRefObjectMaps().isEmpty()) {

			for (int i = 0; i < pom.getPredicateMaps().size(); i++) {
				// Has both Object Maps and RefObjectMaps (joins)
				Element joinsAndObjJoinMapStatement = createJoinsAndObjMap(pom.getPredicateMaps(),
						pom.getRefObjectMaps(), pom.getObjectMaps(), i);

				if (multiplePom || hasClasses)
					joinsAndObjJoinMapStatement = putInNextElement(joinsAndObjJoinMapStatement);

				NodeList nextTagList = classesBlockElem.getElementsByTagName(CONST.NEXT);

				if (nextTagList.getLength() == 0) {
					classesBlockElem.appendChild(joinsAndObjJoinMapStatement);
				} else {
					Element nextTagElem = (Element) nextTagList.item(nextTagList.getLength() - 1);
					nextTagElem.getFirstChild().appendChild(joinsAndObjJoinMapStatement);
				}

			}
		}

		if (!subjmap.getGraphMaps().isEmpty() || !pom.getGraphMaps().isEmpty()) {

			Element graphMapsStatement = null;

			if (!subjmap.getGraphMaps().isEmpty()) {
				graphMapsStatement = createGraphMap(subjmap.getGraphMaps());
				subjmap.getGraphMaps().remove(0);
			} else {
				graphMapsStatement = createGraphMap(pom.getGraphMaps());
				pom.getGraphMaps().remove(0);
			}

			if (multiplePom || hasClasses)
				graphMapsStatement = putInNextElement(graphMapsStatement);

			NodeList nextTagList = classesBlockElem.getElementsByTagName(CONST.NEXT);

			if (nextTagList.getLength() == 0) {
				classesBlockElem.appendChild(graphMapsStatement);
			} else {
				Element nextTagElem = (Element) nextTagList.item(nextTagList.getLength() - 1);
				nextTagElem.getFirstChild().appendChild(graphMapsStatement);
			}

		}

	}

	/*
	 * HELPER METHODS TO CREATE THE ELEMENTS
	 */

	/**
	 * Creates a Predicate Map element which can contain one or more (nested)
	 * Predicate Map elements
	 * 
	 * @param predMapsList
	 * @return
	 */

	private Element createPredicateBlock(List<PredicateMap> predMapsList, List<ObjectMap> objectMaps, int index) {

		Element tempBlock = xml.createElement(CONST.BLOCK);
		tempBlock.setAttribute(CONST.TYPE, CONST.PREDICATEOBJECT);

		// define elements
		Element basicPredMapBlock = null;
		Element basicObjectMapBlock = null;

		PredicateMap pm = null;

		if (index > predMapsList.size() - 1) {
			pm = predMapsList.get(predMapsList.size() - 1);
		}

		else {
			pm = predMapsList.get(index);
		}

		// get the desired maps

		ObjectMap om = objectMaps.get(index);

		// these will hold the predicate map strings
		String termMapTypeStr = "";
		String prefixAndName = "";

		// Check if constant || column || template
		if (pm.isConstantValuedTermMap()) {

			termMapTypeStr = CONST.CONSTANT_UC;
			/*
			 * Prefix:name set need for constant only
			 */
			prefixAndName = getResourcePrefix(pm.getConstant().asResource());

		} else if (pm.isColumnValuedTermMap()) {

			termMapTypeStr = CONST.COLUMN_UC;
			prefixAndName = pm.getColumn().toString();

		} else {

			termMapTypeStr = CONST.TEMPLATE_UC;
			prefixAndName = pm.getTemplate().toString();

		}

		// create the predicate block
		basicPredMapBlock = createBasicPmBlock(termMapTypeStr, prefixAndName);

		// put in value element
		basicPredMapBlock = putInValueElement(basicPredMapBlock);

		// create object block
		basicObjectMapBlock = createBasicObjectBlock(om);

		// put in value element
		Element objectValue = xml.createElement(CONST.VALUE);
		objectValue.setAttribute(CONST.NAME, CONST.OBJECT);
		objectValue.appendChild(basicObjectMapBlock);

		// add as children to the predObjBlock
		tempBlock.appendChild(basicPredMapBlock);
		tempBlock.appendChild(objectValue);

		return tempBlock;
	}

	private Element createPredicateRefObject(List<PredicateMap> predMapsList, List<RefObjectMap> refObjectList,
			int index) {

		Element tempBlock = xml.createElement(CONST.BLOCK);
		tempBlock.setAttribute(CONST.TYPE, CONST.PREDICATEOBJECT);

		// define elements
		Element basicPredMapBlock = null;
		Element basicRefObjMapBlock = null;

		// get the desired maps
		PredicateMap pm = null;

		if (index > predMapsList.size() - 1) {
			pm = predMapsList.get(predMapsList.size() - 1);
		}

		else {
			pm = predMapsList.get(index);
		}

		// these will hold the predicate map strings
		String termMapTypeStr = "";
		String prefixAndName = "";

		// Check if constant || column || template
		if (pm.isConstantValuedTermMap()) {

			termMapTypeStr = CONST.CONSTANT_UC;
			/*
			 * Prefix:name set need for constant only
			 */
			prefixAndName = getResourcePrefix(pm.getConstant().asResource());

		} else if (pm.isColumnValuedTermMap()) {

			termMapTypeStr = CONST.COLUMN_UC;
			prefixAndName = pm.getColumn().toString();

		} else {

			termMapTypeStr = CONST.TEMPLATE_UC;
			prefixAndName = pm.getTemplate().toString();

		}

		// create the predicate block
		basicPredMapBlock = createBasicPmBlock(termMapTypeStr, prefixAndName);

		// put in value element
		basicPredMapBlock = putInValueElement(basicPredMapBlock);

		// create object block
		basicRefObjMapBlock = createBasicRefObjBlock(refObjectList.get(index));
		// put in value element
		Element objectValue = xml.createElement(CONST.VALUE);
		objectValue.setAttribute(CONST.NAME, CONST.OBJECT);
		objectValue.appendChild(basicRefObjMapBlock);

		// add as children to the predObjBlock
		tempBlock.appendChild(basicPredMapBlock);
		tempBlock.appendChild(objectValue);

		return tempBlock;
	}

	/**
	 * Creates an Object Map element with one or more (nested) Object Maps.
	 * 
	 * @param objectMaps
	 * @return
	 */
	private Element createObjMap(List<ObjectMap> objectMaps) {

		Element savedObjectMapBlock = null;
		Element basicObjectMapBlock = null;

		for (int i = 0; i < objectMaps.size(); i++) {

			ObjectMap om = objectMaps.get(i);

			if (i < (objectMaps.size() - 1)) {
				// More than one map, but this is not the last one

				basicObjectMapBlock = createBasicObjectBlock(om);

				/*
				 * If this is the first graph, there will be no saved graph
				 */
				if (savedObjectMapBlock != null) {
					basicObjectMapBlock.appendChild(savedObjectMapBlock);
				}

				/*
				 * This is not the last graph, so use a <next> block
				 */
				basicObjectMapBlock = putInNextElement(basicObjectMapBlock);

				/*
				 * Save this for the next iteration
				 */
				savedObjectMapBlock = basicObjectMapBlock;

			} else if (i == (objectMaps.size() - 1)) {
				// Only one map, or this is he last of many

				basicObjectMapBlock = createBasicObjectBlock(om);

				/*
				 * If this is the only graph, then defend against
				 * savedGraphBlock being null (as initialised).
				 */
				if (savedObjectMapBlock != null) {

					/*
					 * Recall, any savedGraphBlock will already be surrounded by
					 * a <next> block
					 */
					basicObjectMapBlock.appendChild(savedObjectMapBlock);

				}

			}

		}

		return basicObjectMapBlock;

	}

	/**
	 * Creates an element which contains a mix of RefObject (joins) and Object
	 * Maps.
	 * 
	 * @param refObjectMaps
	 * @param objectMaps
	 * @return
	 */
	private Element createJoinsAndObjMap(List<PredicateMap> predMapsList, List<RefObjectMap> refObjMaps,
			List<ObjectMap> objectMaps, int index) {

		/*
		 * First, Create the block for the Object Map(s), this is placed in a
		 * <next> and added after the first RefObject Map (join) is processed.
		 */

		/*
		 * This returns a <statement> element, so need to get the <block> within
		 * it.
		 * 
		 */

		Element tempBlock = xml.createElement(CONST.BLOCK);
		tempBlock.setAttribute(CONST.TYPE, CONST.PREDICATEOBJECT);

		PredicateMap pm = null;

		if (index > predMapsList.size()) {
			pm = predMapsList.get(predMapsList.size());
		}

		else {
			pm = predMapsList.get(index);
		}

		ObjectMap om = objectMaps.get(index);

		Element objectMapStatement = createObjMap(objectMaps);
		Element objectMapBlock = (Element) objectMapStatement.getFirstChild();

		Element basicJoinAndObjBlock = null;
		Element savedJoinAndObjBlock = null;

		// define elements
		Element basicPredMapBlock = null;
		Element basicRefObjectMapBlock = null;

		// these will hold the predicate map strings
		String termMapTypeStr = "";
		String prefixAndName = "";

		// Check if constant || column || template
		if (pm.isConstantValuedTermMap()) {

			termMapTypeStr = CONST.CONSTANT_UC;
			/*
			 * Prefix:name set need for constant only
			 */
			prefixAndName = getResourcePrefix(pm.getConstant().asResource());

		} else if (pm.isColumnValuedTermMap()) {

			termMapTypeStr = CONST.COLUMN_UC;
			prefixAndName = pm.getColumn().toString();

		} else {

			termMapTypeStr = CONST.TEMPLATE_UC;
			prefixAndName = pm.getTemplate().toString();

		}

		// create the predicate block
		basicPredMapBlock = createBasicPmBlock(termMapTypeStr, prefixAndName);

		// put in value element
		basicPredMapBlock = putInValueElement(basicPredMapBlock);

		// create object block
		basicRefObjectMapBlock = createBasicRefObjBlock(refObjMaps.get(index));

		// put in value element
		Element objectValue = xml.createElement(CONST.VALUE);
		objectValue.setAttribute(CONST.NAME, CONST.OBJECT);
		objectValue.appendChild(basicRefObjectMapBlock);

		// add as children to the predObjBlock
		tempBlock.appendChild(basicPredMapBlock);
		tempBlock.appendChild(objectValue);

		return tempBlock;

	}

	/**
	 * Creates a Graph Map element for one or more (nested) Graph Maps.
	 * 
	 * @param graphMaps
	 * @return
	 */
	private Element createGraphMap(List<GraphMap> graphList) {

		Element savedGraphBlock = null;
		Element basicGraphBlock = null;

		for (int i = 0; i < graphList.size(); i++) {

			GraphMap gm = graphList.get(i);

			String termMapTypeStr = "";
			String prefixAndName = "";

			/*
			 * Prepare these variables for graph block creation
			 */
			if (gm.isConstantValuedTermMap()) {

				termMapTypeStr = CONST.CONSTANT_UC;
				/*
				 * Prefix:name set need for constant only
				 */
				prefixAndName = getResourcePrefix(gm.getConstant().asResource());

			} else if (gm.isColumnValuedTermMap()) {

				termMapTypeStr = CONST.COLUMN_UC;
				prefixAndName = gm.getColumn().toString();

			} else {

				termMapTypeStr = CONST.TEMPLATE_UC;
				prefixAndName = gm.getTemplate().toString();

			}

			/*
			 * 
			 */
			if (i < (graphList.size() - 1)) {
				/*
				 * There is more than one graph, and the current graph is a 1st,
				 * 2nd, etc of many, but not the last one. Therefore, <next>
				 * blocks are required
				 */

				basicGraphBlock = createPomGraphBlock(termMapTypeStr, prefixAndName);

				/*
				 * If this is the first graph, there will be no saved graph
				 */
				if (savedGraphBlock != null) {
					basicGraphBlock.appendChild(savedGraphBlock);
				}

				/*
				 * This is not the last graph, so use a <next> block
				 */
				basicGraphBlock = putInNextElement(basicGraphBlock);

				/*
				 * Save this for the next iteration
				 */
				savedGraphBlock = basicGraphBlock;

			} else if (i == (graphList.size() - 1)) {
				/*
				 * There is only one graph or the current graph is the last one.
				 * It should be returned but not surrounded by a <next>
				 */

				basicGraphBlock = createPomGraphBlock(termMapTypeStr, prefixAndName);

				/*
				 * If this is the only graph, then defend against
				 * savedGraphBlock being null (as initialised).
				 */
				if (savedGraphBlock != null) {

					/*
					 * Recall, any savedGraphBlock will already be surrounded by
					 * a <next> block
					 */
					basicGraphBlock.appendChild(savedGraphBlock);

				}

			}

		}

		/*
		 * This needs to be in a <statement> element
		 */
		return basicGraphBlock;

	}

	/*
	 * Helper method to get the prefix and its local name of a TermType class.
	 * These make up the name of the subject map class.
	 */
	private String getResourcePrefix(Resource resource) {

		String prefixAndName = "";

		Map<String, String> pmap = (Map<String, String>) resource.getModel().getNsPrefixMap();

		for (Entry<String, String> value : pmap.entrySet()) {

			// System.out.println(value.getValue() + "\n" +
			// resource.getNameSpace() + "\n");

			if (value.getValue().equals(resource.getNameSpace())) {

				prefixAndName = value.getKey() + ":" + resource.getLocalName();
				return prefixAndName;

			} else {
				prefixAndName = "<" + resource.toString() + ">";
			}
		}

		return prefixAndName;

	}

	/*
	 * Takes any block element and puts it in a <next></next> element
	 */
	private Element putInNextElement(Element blockElm) {

		Element nextElement = xml.createElement(CONST.NEXT);

		nextElement.appendChild(blockElm);

		return nextElement;

	}

	/**
	 * Creates a basic block for a Graph Map, as part of a Subject Map
	 */
	private Element createBasicPmBlock(String termMapTypeStr, String prefixAndName) {

		/*
		 * Create the inner field elements
		 */
		Element fieldTermMap = xml.createElement(CONST.FIELD);
		fieldTermMap.setAttribute(CONST.NAME, CONST.TERMMAP_UC);
		fieldTermMap.appendChild(xml.createTextNode(termMapTypeStr));

		Element fieldTermMapValue = xml.createElement(CONST.FIELD);
		fieldTermMapValue.setAttribute(CONST.NAME, CONST.TERMMAPVALUE_UC);
		fieldTermMapValue.appendChild(xml.createTextNode(prefixAndName));

		/*
		 * Append these both to a <block type="subjectgraphtermap">
		 */
		Element pmGraphBlock = xml.createElement(CONST.BLOCK);

		pmGraphBlock.setAttribute(CONST.TYPE, CONST.PREDICATE);
		pmGraphBlock.appendChild(fieldTermMap);
		pmGraphBlock.appendChild(fieldTermMapValue);

		return pmGraphBlock;
	}

	/**
	 * Creates a basic block for a Graph Map, as part of a Predicate Object Map
	 */
	private Element createPomGraphBlock(String termMapTypeStr, String prefixAndName) {

		/*
		 * Create the inner field elements
		 */
		Element fieldTermMap = xml.createElement(CONST.FIELD);
		fieldTermMap.setAttribute(CONST.NAME, CONST.TERMMAP_UC);
		fieldTermMap.appendChild(xml.createTextNode(termMapTypeStr));

		Element fieldTermMapValue = xml.createElement(CONST.FIELD);
		fieldTermMapValue.setAttribute(CONST.NAME, CONST.TERMMAPVALUE_UC);
		fieldTermMapValue.appendChild(xml.createTextNode(prefixAndName));

		/*
		 * Append these both to a <block type="subjectgraphtermap">
		 */
		Element pomGraphBlock = xml.createElement(CONST.BLOCK);

		pomGraphBlock.setAttribute(CONST.TYPE, CONST.GRAPH);
		pomGraphBlock.appendChild(fieldTermMap);
		pomGraphBlock.appendChild(fieldTermMapValue);

		return pomGraphBlock;
	}

	/**
	 * Creates a basic block for an Object Map, which is a sub-part of a
	 * Predicate Object Map
	 * 
	 * @param termMapTypeStr
	 * @param prefixAndName
	 * @return
	 */
	private Element createBasicObjectBlock(ObjectMap om) {

		// hold the values for the first two fields
		String termMapTypeStr = "";
		String prefixAndName = "";

		// check whether CONSTANT || COLUMN || TEMPLATE
		if (om.isConstantValuedTermMap()) {

			termMapTypeStr = CONST.CONSTANT_UC;
			/*
			 * Prefix:name set needed for constant only
			 */
			prefixAndName = getResourcePrefix(om.getConstant().asResource());

		} else if (om.isColumnValuedTermMap()) {

			termMapTypeStr = CONST.COLUMN_UC;
			prefixAndName = om.getColumn().toString().toUpperCase();

		} else if (om.isTemplateValuedTermMap()) {

			termMapTypeStr = CONST.TEMPLATE_UC;
			prefixAndName = om.getTemplate().toString();

		}

		// create the 5 object field elements
		Element fieldTermMap = xml.createElement(CONST.FIELD);
		fieldTermMap.setAttribute(CONST.NAME, CONST.TERMMAP_UC);
		fieldTermMap.appendChild(xml.createTextNode(termMapTypeStr));

		Element fieldTermMapValue = xml.createElement(CONST.FIELD);
		fieldTermMapValue.setAttribute(CONST.NAME, CONST.TERMMAPVALUE_UC);
		fieldTermMapValue.appendChild(xml.createTextNode(prefixAndName));

		Element fieldWithTermType = xml.createElement(CONST.FIELD);
		fieldWithTermType.setAttribute(CONST.NAME, CONST.WITHTERMTYPE);

		Element fieldTermType = xml.createElement(CONST.FIELD);
		fieldTermType.setAttribute(CONST.NAME, CONST.TERMTYPE_UC);

		Element fieldTermTypeValue = xml.createElement(CONST.FIELD);
		fieldTermTypeValue.setAttribute(CONST.NAME, CONST.TERMTYPEVALUE);

		/*
		 * Check for literal types, if just a literal, set WITHTERMTYPE as FALSE
		 * 
		 * if a literal and has language *OR* datatype is set, make...
		 * 
		 * <statement name="termmap"> <block type="objecttermtype"> <field
		 * name="TERMTYPE">termtypeliteral</field> <value name="termtypevalue">
		 * <block type="objectdatatype"> <field name="DATATYPE">????????</field>
		 * </block> </value> </block> </statement>
		 */

		if (om.isTermTypeLiteral()) {

			/*
			 * Create this inner block, needed by every 'literal' termtype
			 * 
			 * <block type="objecttermtype"> <field
			 * name="TERMTYPE">termtypeliteral</field> </block>
			 */

			/*
			 * If there is a datatype or language set, add a <value> element for
			 * this, append to block also.
			 * 
			 * The model dictates that there cannot be a language AND a datatype
			 * set
			 */
			if (!om.getLanguages().isEmpty()) {

				// TRUE as not literal
				fieldWithTermType.appendChild(xml.createTextNode("TRUE"));

				// set type to language
				fieldTermType.appendChild(xml.createTextNode(CONST.LANGUAGE_UC));

				// get language value
				String languageValue = om.getLanguages().get(0).getObject().toString();

				// insert language value
				fieldTermTypeValue.appendChild(xml.createTextNode(languageValue));

			} else if (!om.getDatatypes().isEmpty()) {

				// TRUE as not literal
				fieldWithTermType.appendChild(xml.createTextNode("TRUE"));

				// set type to datatype
				fieldTermType.appendChild(xml.createTextNode(CONST.DATATYPE_UC));

				// get value
				// String dataTypeValue =
				// om.getDatatypes().get(0).getObject().toString();

				String dataTypeValue = getResourcePrefix(om.getDatatypes().get(0).getObject().asResource());

				// insert value
				fieldTermTypeValue.appendChild(xml.createTextNode(dataTypeValue));

			}

			else {
				// False as is literal
				fieldWithTermType.appendChild(xml.createTextNode("FALSE"));

				// set type to language
				fieldTermType.appendChild(xml.createTextNode(CONST.TERMTYPELITERAL));

				// default value
				fieldTermTypeValue.appendChild(xml.createTextNode("insert value"));

			}

		} else if (om.isTermTypeBlankNode()) {

			// TRUE as not literal
			fieldWithTermType.appendChild(xml.createTextNode("TRUE"));

			// set type to blank node
			fieldTermType.appendChild(xml.createTextNode(CONST.TERMTYPEBLANKNODE));

			// default value
			fieldTermTypeValue.appendChild(xml.createTextNode("insert value"));

		} else if (om.isTermTypeIRI()) {

			// TRUE as not literal
			fieldWithTermType.appendChild(xml.createTextNode("TRUE"));

			// set type to termtypeiri
			fieldTermType.appendChild(xml.createTextNode(CONST.TERMTYPEIRI));

			// default value
			fieldTermTypeValue.appendChild(xml.createTextNode("insert value"));

		}

		// add to object block

		Element pomObjectMapBlock = xml.createElement(CONST.BLOCK);

		pomObjectMapBlock.setAttribute(CONST.TYPE, CONST.OBJECT);
		pomObjectMapBlock.appendChild(fieldTermMap);
		pomObjectMapBlock.appendChild(fieldTermMapValue);
		pomObjectMapBlock.appendChild(fieldWithTermType);
		pomObjectMapBlock.appendChild(fieldTermType);
		pomObjectMapBlock.appendChild(fieldTermTypeValue);

		return pomObjectMapBlock;

	}

	/**
	 * Creates a basic reference object block, may be called multiple times
	 * where more that one is present.
	 * 
	 * @param rom
	 * @return
	 */
	private Element createBasicRefObjBlock(RefObjectMap rom) {

		/*
		 * Create a basic Reference Object Block to go into a <statement
		 * name="opredicateobjectmap">, the same place as an ObjectMap goes.
		 */

		String parentTripMap = rom.getParentTriplesMap().getLocalName();

		Element fieldLink = xml.createElement(CONST.FIELD);
		fieldLink.setAttribute(CONST.NAME, "LINK");
		// TODO set it from generated it
		fieldLink.appendChild(xml.createTextNode(parentTripMap));

		Element mutationLinkedMappings = xml.createElement(CONST.MUTATION);

		Element linkMappingsBlock = xml.createElement(CONST.BLOCK);
		linkMappingsBlock.setAttribute(CONST.TYPE, "linking_mappings");

		/*
		 * if-stm is for fail safety
		 */
		if (!rom.getJoins().isEmpty()) {

			List<Join> joinList = rom.getJoins();
			Element joinStatementElement = createJoinCondStatement(joinList);
			mutationLinkedMappings.appendChild(joinStatementElement);
			linkMappingsBlock.appendChild(mutationLinkedMappings);
			linkMappingsBlock.appendChild(fieldLink);
		}

		return linkMappingsBlock;
	}

	private Element putInValueElement(Element innerElem) {

		Element valueElm = xml.createElement(CONST.VALUE);
		valueElm.setAttribute(CONST.NAME, CONST.PREDICATE);
		valueElm.appendChild(innerElem);

		return valueElm;

	}

	/**
	 * Creates a join condition statement element and nests each one in a <next>
	 * element if necessary
	 * 
	 * @param joinList
	 * @return
	 */
	private Element createJoinCondStatement(List<Join> joinList) {

		Element savedJoinCondBlock = null;
		Element basicJoinCondBlock = null;

		for (int i = 0; i < joinList.size(); i++) {

			if (i < (joinList.size() - 1)) {
				// More than one map, but this is not the last one

				basicJoinCondBlock = createJoinCondArg(joinList.get(i));

				/*
				 * If this is the first graph, there will be no saved graph
				 */
				if (savedJoinCondBlock != null) {
					basicJoinCondBlock.appendChild(savedJoinCondBlock);
				}

				/*
				 * This is not the last graph, so use a <next> block
				 */
				basicJoinCondBlock = putInNextElement(basicJoinCondBlock);

				/*
				 * Save this for the next iteration
				 */
				savedJoinCondBlock = basicJoinCondBlock;

			} else if (i == (joinList.size() - 1)) {
				// Only one map, or this is the last one

				basicJoinCondBlock = createJoinCondArg(joinList.get(i));

				/*
				 * If this is the only map, then defend against
				 * savedPredMapBlock being null (as initialised).
				 */
				if (savedJoinCondBlock != null) {

					/*
					 * Recall, any savedGraphBlock will already be surrounded by
					 * a <next> block
					 */
					basicJoinCondBlock.appendChild(savedJoinCondBlock);

				}

			}

		}

		return basicJoinCondBlock;

	}

	/**
	 * Used for Join conditions in ReferenceObjects
	 * 
	 * 
	 * <block type="joincondition"> <field name="CHILD">join_2</field>
	 * <field name="PARENT">join_2</field> </block>
	 * 
	 * @return
	 */
	private Element createJoinCondArg(Join jn) {

		String childStr = jn.getChild();
		String parentStr = jn.getParent();

		Element parChildArg = xml.createElement("arg");
		parChildArg.setAttribute(CONST.PARENT_LC, parentStr.toUpperCase());
		parChildArg.setAttribute(CONST.CHILD_LC, childStr.toUpperCase());

		return parChildArg;
	}

}