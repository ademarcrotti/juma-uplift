package ie.tcd.kdeg.juma.uplift.loading;

import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.jena.rdf.model.Resource;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import r2rml.model.GraphMap;
import r2rml.model.SubjectMap;
import r2rml.model.TriplesMap;

/**
 * Processes TermMaps associated with SubjectMaps and creates an XML element
 * which is used (in part) to recreate a mapping visual in the r2rml-editor UI.
 * 
 * @author lavinpe
 *
 */

public class ProcessPartsOfSubjMap {

	private Document xml;

	public ProcessPartsOfSubjMap(Document xml) {

		this.xml = xml;

	}

	/**
	 * Receives a previously created XML element and a SubjectMap object.
	 * Extracts the details of the SubjectMap object and addes them to the XML
	 * element. The element is part of the XML Document which is a type of this
	 * class.
	 * 
	 * @param subjectMapStatement
	 * @param subjmap
	 */
	public void processPartsSubjMap(Element subjectMapStatement, SubjectMap subjmap, TriplesMap tmap) {

		/*
		 * Three entities relating to SubjectMaps are converted to XML in this
		 * class. If there is a declared TermType other than IRI, that is
		 * processed first, and nested within <next> blocks below all other
		 * entities.
		 * 
		 * Subject Graph Maps are next, followed by classes.
		 * 
		 * All of these are nested in the SubjectMap statement/block element.
		 * 
		 */

		// XML element to be added to Subject block later
		Element cgtBlock = null;

		Element classMutation = xml.createElement(CONST.MUTATION);

		// Cannot use binary strings as Apache Jena is limited to Java 1.5
		// int a = 0b000;
		// int b = 0b010;

		/*
		 * There are 8 different perumtations of combinations of Classes, Graphs
		 * and Term Types. Each different one requires a different sequence of
		 * adding the various XML elements to the element added to the subject
		 * map.
		 * 
		 * The presence of each one is represented in a number. For clarity, the
		 * binary format of that number is used.
		 */

		final int ttValue = 1; // 001
		final int graphValue = 2; // 010
		final int classValue = 4; // 100

		/*
		 * First, determine if an Element for TermType is needed, i.e. if the
		 * TermType is other than IRI. There can only be one Term Type
		 */
		int comboValue = 0; // 000

		if (!subjmap.isTermTypeIRI()) {
			comboValue = comboValue + ttValue;
		}
		if (subjmap.getGraphMaps().size() > 0) {
			comboValue = comboValue + graphValue;
		}
		if (subjmap.getClasses().size() > 0) {
			comboValue = comboValue + classValue;
		}

		// String comboValueBinStr = String.format("%3s",
		// Integer.toBinaryString(comboValue)).replace(' ', '0');

		// System.out.println("Binary representation for Class-Graph-TT is
		// (C.G.T)... " + comboValue + " or "
		// + comboValueBinStr + "\n");

		/*
		 * Now that the presence or absence of sub-parts of a Subject Map are
		 * know, proceed to chose the correct combination
		 */

		if (comboValue == 0) { // 000 Do nothing

		} else if (comboValue == 1) { // C.G.T 001

			/*
			 * Only a TermType is declared, no classes or graphs
			 */

			cgtBlock = createTermTypeOnlyBlock(subjmap);

		} else if (comboValue == 2) { // C.G.T 010

			/*
			 * One or more Graphs present only
			 */
			cgtBlock = createGraphOnlyBlock(subjmap);

		} else if (comboValue == 3) { // C.G.T 011

			cgtBlock = createTTAndGraphBlock(subjmap);

		} else if (comboValue == 4) { // C.G.T 100

			/*
			 * One or more Classes present only
			 */

			cgtBlock = createClassOnlyBlock(subjmap, classMutation);

		} else if (comboValue == 5) { // C.G.T 101

			cgtBlock = createTTAndClassBlock(subjmap, classMutation);
			;

		} else if (comboValue == 6) { // C.G.T 110

			/*
			 * Graph(s) and Class(s) present
			 */
			cgtBlock = createGraphAndClassBlock(subjmap);

		} else if (comboValue == 7) { // C.G.T 111

			cgtBlock = createTTGraphClassBlock(subjmap);

		}

		/*
		 * Only add this block if it has changed from being null (as
		 * initialised)
		 */
		if (cgtBlock == null) {

			// The first child of a statement is always a <block>

			/*
			 * Append all this to the subjectMapBlock
			 */

			ProcessPredicateObjectMaps ppom = new ProcessPredicateObjectMaps(xml);
			ppom.processPredicateObjectMaps(tmap, subjectMapStatement, subjectMapStatement);

		} else {
			Element subjectMapBlock = (Element) subjectMapStatement.getFirstChild();
			classMutation.appendChild(cgtBlock);
			subjectMapBlock.appendChild(classMutation);

			ProcessPredicateObjectMaps ppom = new ProcessPredicateObjectMaps(xml);
			ppom.processPredicateObjectMaps(tmap, subjectMapBlock, subjectMapStatement);
		}

	}

	/*
	 * METHODS TO CREATE THE BLOCKS WHICH ARE RETURNED. SOME OF THESE ARE USED
	 * AND REUSED BY OTHERS
	 */

	/**
	 * Creates a block element which contains only a term type
	 * 
	 * @param subjmap
	 * @return
	 */

	private Element createTermTypeOnlyBlock(SubjectMap subjmap) {

		/*
		 * First create the term type field elements
		 */
		Element TermTypeField = xml.createElement(CONST.FIELD);
		TermTypeField.setAttribute(CONST.NAME, CONST.TERMTYPE_UC);

		String termTypeVar = subjmap.isTermTypeIRI() ? CONST.TERMTYPE_IRI : CONST.TERMTYPE_BN;

		TermTypeField.appendChild(xml.createTextNode(termTypeVar));

		/*
		 * Create a block to surround this and append
		 */
		Element termTypeBlock = xml.createElement(CONST.BLOCK);
		termTypeBlock.setAttribute(CONST.TYPE, CONST.SUBJECTTERMTYPE);

		termTypeBlock.appendChild(TermTypeField);

		return termTypeBlock;
	}

	/**
	 * Helper method to create a 'graph only' block
	 * 
	 * @param subjmap
	 * @return
	 */
	private Element createGraphOnlyBlock(SubjectMap subjmap) {

		List<GraphMap> graphList = subjmap.getGraphMaps();

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

			if (i < (graphList.size() - 1)) {
				/*
				 * There is more than one graph, and the current graph is a 1st,
				 * 2nd, etc of many, but not the last one. Therefore, <next>
				 * blocks are required
				 */

				basicGraphBlock = createSubjGraphBlock(termMapTypeStr, prefixAndName);

				/*
				 * If this is the first graph, there will be no saved graph
				 */
				if (savedGraphBlock != null) {
					basicGraphBlock.appendChild(savedGraphBlock);
				}

				/*
				 * This is not the last graph, so use a <next> block
				 */

				/*
				 * Save this for the next iteration
				 */
				savedGraphBlock = basicGraphBlock;

			} else if (i == (graphList.size() - 1)) {
				/*
				 * There is only one graph or the current graph is the last one.
				 * It should be returned but not surrounded by a <next>
				 */

				basicGraphBlock = createSubjGraphBlock(termMapTypeStr, prefixAndName);

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
				// System.out.println("subjGraphBlock for LAST GRAPH...\n");
				// PrettyPrintXML.printElement(basicGraphBlock);

			}

		}

		return basicGraphBlock;

	}

	/**
	 * Creates a Class only block
	 * 
	 * @param subjmap
	 * @return
	 */
	private Element createClassOnlyBlock(SubjectMap subjmap, Element classMutation) {

		List<Resource> classList = subjmap.getClasses();

		Element basicClassBlock = null;
		Element savedClassBlock = null;

		/*
		 * Iterate over all classes found
		 */
		for (int i = 0; i < classList.size(); i++) {

			if (i < (classList.size() - 1)) {
				/*
				 * There is more than one class, and the current class is the
				 * 1st, 2nd, etc of many, but not the last one. Therefore,
				 * <next> blocks are required
				 */
				basicClassBlock = createClassBlock((Resource) classList.get(i));

				/*
				 * If this is the first of many classes, then there will be no
				 * saved class
				 */
				if (savedClassBlock != null) {
					classMutation.appendChild(savedClassBlock);
				}

				/*
				 * Save this for the next iteration
				 */
				savedClassBlock = basicClassBlock;

			} else if (i == (classList.size() - 1)) {
				/*
				 * There is only one class or the current class is the last one.
				 * It should be returned but not surrounded by a <next>
				 */

				basicClassBlock = createClassBlock((Resource) classList.get(i));

				if (savedClassBlock != null) {

					/*
					 * Recall, any savedGraphBlock will already be surrounded by
					 * a <next> block
					 */
					classMutation.appendChild(savedClassBlock);

				}

			}

		}

		return basicClassBlock;

	}

	/**
	 * Creates a Graph Map Block and nests it within a Class Map block.
	 */
	private Element createGraphAndClassBlock(SubjectMap subjmap) {
		/*
		 * The graph block is nested within the class block, with the first
		 * class processed
		 */
		Element allGraphsBlock = createGraphOnlyBlock(subjmap);

		Element graphAndClassBlock = null;
		Element savedGraphAndClassBlock = null;

		List<Resource> classList = subjmap.getClasses();

		for (int i = 0; i < classList.size(); i++) {

			/*
			 * There is more than one class, and this is not the last
			 */
			if (i < (classList.size() - 1)) {

				graphAndClassBlock = createClassBlock(classList.get(i));

				/*
				 * If this is the first class, append allGraphsBlock
				 */
				if (i == 0) {
					graphAndClassBlock.appendChild(allGraphsBlock);
				}

				/*
				 * If savedGraphAndClassBlock is not null, add it
				 */
				if (savedGraphAndClassBlock != null) {
					graphAndClassBlock.appendChild(savedGraphAndClassBlock);
				}

				/*
				 * As this is NOT the last class, put graphAndClassBlock in a
				 * <next> block
				 */

				savedGraphAndClassBlock = graphAndClassBlock;

			} else if (i == (classList.size() - 1)) {
				/*
				 * This is only class, or the last one, no <needed>
				 */
				graphAndClassBlock = createClassBlock(classList.get(i));

				/*
				 * If this is the first and only, append the graph element
				 */
				if (i == 0) {
					graphAndClassBlock.appendChild(allGraphsBlock);
				}

				/*
				 * If this is the last of many classes, append previously saved
				 * elements
				 */
				if (savedGraphAndClassBlock != null) {
					graphAndClassBlock.appendChild(savedGraphAndClassBlock);
				}

			}

		}

		return graphAndClassBlock;
	}

	/**
	 * Create a TermType, then nest it in a Class Block, used when there is no
	 * Graph present
	 */
	private Element createTTAndClassBlock(SubjectMap subjmap, Element classMutation) {

		/*
		 * The TermType block is nested within the class block, with the first
		 * class processed
		 */
		Element termTypeBlock = createTermTypeOnlyBlock(subjmap);

		Element ttAndClassBlock = null;
		Element savedTtAndClassBlock = null;

		List<Resource> classList = subjmap.getClasses();

		for (int i = 0; i < classList.size(); i++) {

			/*
			 * There is more than one class, and this is not the last
			 */
			if (i < (classList.size() - 1)) {

				ttAndClassBlock = createClassBlock(classList.get(i));

				/*
				 * If this is the first class, append allGraphsBlock
				 */
				if (i == 0) {
					ttAndClassBlock.appendChild(termTypeBlock);
				}

				/*
				 * If savedGraphAndClassBlock is not null, add it
				 */
				if (savedTtAndClassBlock != null) {
					classMutation.appendChild(savedTtAndClassBlock);
				}

				/*
				 * As this is NOT the last class, put graphAndClassBlock in a
				 * <next> block
				 */

				savedTtAndClassBlock = ttAndClassBlock;

			} else if (i == (classList.size() - 1)) {
				/*
				 * This is only class, or the last one, no <needed>
				 */
				ttAndClassBlock = createClassBlock(classList.get(i));

				/*
				 * If this is the first and only, append the graph element
				 */
				if (i == 0) {
					ttAndClassBlock.appendChild(termTypeBlock);
				}

				/*
				 * If this is the last of many classes, append previously saved
				 * elements
				 */
				if (savedTtAndClassBlock != null) {
					classMutation.appendChild(savedTtAndClassBlock);
				}

			}

		}

		return ttAndClassBlock;
	}

	/**
	 * Creates a Graph and TermType block
	 */
	private Element createTTAndGraphBlock(SubjectMap subjmap) {

		/*
		 * The graph block is nested within the class block, with the first
		 * class processed
		 */
		Element termTypeBlock = createTermTypeOnlyBlock(subjmap);

		Element ttAndGraphBlock = null;
		Element savedTtAndGraphBlock = null;

		List<GraphMap> graphList = subjmap.getGraphMaps();

		for (int i = 0; i < graphList.size(); i++) {

			/*
			 * There is more than one class, and this is not the last
			 */
			if (i < (graphList.size() - 1)) {

				ttAndGraphBlock = createGraphBlock(graphList.get(i));

				/*
				 * If this is the first class, append allGraphsBlock
				 */
				if (i == 0) {
					ttAndGraphBlock.appendChild(termTypeBlock);
				}

				/*
				 * If savedTtAndGraphBlock is not null, add it
				 */
				if (savedTtAndGraphBlock != null) {
					ttAndGraphBlock.appendChild(savedTtAndGraphBlock);
				}

				savedTtAndGraphBlock = ttAndGraphBlock;

			} else if (i == (graphList.size() - 1)) {
				/*
				 * This is only class, or the last one, no <needed>
				 */
				ttAndGraphBlock = createGraphBlock(graphList.get(i));

				/*
				 * If this is the first and only, append the graph element
				 */
				if (i == 0) {
					ttAndGraphBlock.appendChild(termTypeBlock);
				}

				/*
				 * If this is the last of many classes, append previously saved
				 * elements
				 */
				if (savedTtAndGraphBlock != null) {
					ttAndGraphBlock.appendChild(savedTtAndGraphBlock);
				}

			}

		}

		return ttAndGraphBlock;
	}

	/**
	 * Create a block for a Termtype, graph(s) and class(es)
	 */
	private Element createTTGraphClassBlock(SubjectMap subjmap) {

		/*
		 * By convention, Termtype blocks are put in graphs, then both put in a
		 * class
		 */
		Element ttAndGraphBlock = createTTAndGraphBlock(subjmap);

		Element ttGraphClassBlock = null;
		Element savedTtGraphClassBlock = null;

		List<Resource> classList = subjmap.getClasses();

		for (int i = 0; i < classList.size(); i++) {

			/*
			 * There is more than one class, and this is not the last
			 */
			if (i < (classList.size() - 1)) {

				ttGraphClassBlock = createClassBlock(classList.get(i));

				/*
				 * If this is the first class, append allGraphsBlock
				 */
				if (i == 0) {
					ttGraphClassBlock.appendChild(ttAndGraphBlock);
				}

				/*
				 * If savedGraphAndClassBlock is not null, add it
				 */
				if (savedTtGraphClassBlock != null) {
					ttGraphClassBlock.appendChild(savedTtGraphClassBlock);
				}

				savedTtGraphClassBlock = ttGraphClassBlock;

			} else if (i == (classList.size() - 1)) {
				/*
				 * This is only class, or the last one, no <needed>
				 */
				ttGraphClassBlock = createClassBlock(classList.get(i));

				/*
				 * If this is the first and only, append the graph element
				 */
				if (i == 0) {
					ttGraphClassBlock.appendChild(ttAndGraphBlock);
				}

				/*
				 * If this is the last of many classes, append previously saved
				 * elements
				 */
				if (savedTtGraphClassBlock != null) {
					ttGraphClassBlock.appendChild(savedTtGraphClassBlock);
				}

			}

		}

		return ttGraphClassBlock;

	}

	/**
	 * HELPER METHODS ARE BELOW HERE...
	 * 
	 * Takes any block element and puts it in a <next></next> element
	 */

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
	 * Creates a single class block
	 */
	private Element createClassBlock(Resource subjmapClass) {

		String classPrefixName = getResourcePrefix(subjmapClass);

		Element argPrefix = xml.createElement("arg");
		argPrefix.setAttribute(CONST.NAME, classPrefixName);

		return argPrefix;
	}

	/**
	 * Create a block for a single graph map
	 */
	private Element createGraphBlock(GraphMap graphMap) {

		/*
		 * Determine if the graph map is a constant, column or template
		 */

		String termMapTypeStr = "";
		String prefixAndName = "";

		/*
		 * Prepare these variables for graph block creation, this depends on if
		 * it is a constant, column or template
		 */
		if (graphMap.isConstantValuedTermMap()) {

			termMapTypeStr = CONST.CONSTANT_UC;
			/*
			 * Prefix:name set need for constant only
			 */
			prefixAndName = getResourcePrefix(graphMap.getConstant().asResource());

		} else if (graphMap.isColumnValuedTermMap()) {
			termMapTypeStr = CONST.COLUMN_UC;
			prefixAndName = graphMap.getColumn().toString();
		} else {
			termMapTypeStr = CONST.TEMPLATE_UC;
			prefixAndName = graphMap.getTemplate().toString();
		}

		/*
		 * Create the inner field elements first
		 */
		Element fieldTermMap = xml.createElement(CONST.FIELD);
		fieldTermMap.setAttribute(CONST.NAME, CONST.TERMMAP_UC);
		fieldTermMap.appendChild(xml.createTextNode(termMapTypeStr));

		Element fieldTermMapValue = xml.createElement(CONST.FIELD);
		fieldTermMapValue.setAttribute(CONST.NAME, CONST.TERMMAPVALUE_UC);
		fieldTermMapValue.appendChild(xml.createTextNode(prefixAndName));

		/*
		 * Then append these both to a <block type="subjectgraphtermap">
		 */
		Element subjGraphBlock = xml.createElement(CONST.BLOCK);
		subjGraphBlock.setAttribute(CONST.TYPE, CONST.SUBJECTGRAPHTERMAP);
		subjGraphBlock.appendChild(fieldTermMap);
		subjGraphBlock.appendChild(fieldTermMapValue);

		return subjGraphBlock;

	}

	/**
	 * Creates a basic block for a Graph Map, as part of a Subject Map
	 */
	private Element createSubjGraphBlock(String termMapTypeStr, String prefixAndName) {

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
		Element subjGraphBlock = xml.createElement(CONST.BLOCK);

		subjGraphBlock.setAttribute(CONST.TYPE, CONST.SUBJECTGRAPHTERMAP);
		subjGraphBlock.appendChild(fieldTermMap);
		subjGraphBlock.appendChild(fieldTermMapValue);

		return subjGraphBlock;
	}

}
