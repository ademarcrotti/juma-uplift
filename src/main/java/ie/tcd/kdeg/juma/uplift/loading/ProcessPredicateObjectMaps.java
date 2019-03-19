package ie.tcd.kdeg.juma.uplift.loading;

import java.util.List;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import r2rml.model.PredicateObjectMap;
import r2rml.model.SubjectMap;
import r2rml.model.TriplesMap;

public class ProcessPredicateObjectMaps {

	private Document xml;

	public ProcessPredicateObjectMaps(Document xml) {

		this.xml = xml;

	}

	@SuppressWarnings({ "null", "unused" })
	public void processPredicateObjectMaps(TriplesMap tmap, Element tripmapBlockElem, Element subjectmapStatment) {

		List<PredicateObjectMap> pomList = tmap.getPredicateObjectMaps();

		boolean multiplePom = true;

		boolean hasClasses = false;

		SubjectMap subjmap = tmap.getSubjectMap();

		if (subjmap.getClasses().size() > 0) {
			hasClasses = true;
		}

		Element predObjBlock = null;
		Element savedPredObjBlock = null;

		/*
		 * There can be multiple Predicate Object Maps, each one needs to be
		 * nested in <next> elements in the XML
		 */
		for (int i = pomList.size() - 1; i >= 0; i--) {

			PredicateObjectMap pom = pomList.get(i);

			/*
			 * Create a basic POM statement and inner block
			 */
			if (i < (pomList.size() - 1)) {
				/*
				 * There is more than one PredicateObjectMap, and the current
				 * one is any except not the last one. Therefore, <next> blocks
				 * are required.
				 */
				/*
				 * Add parts for this pom here
				 */

				ProcessPartsOfPredObjMap ppom = new ProcessPartsOfPredObjMap(xml);
				ppom.processPartsPredObjMap(pom, subjectmapStatment, hasClasses, subjmap);

				if (savedPredObjBlock != null) {
					predObjBlock.appendChild(savedPredObjBlock);
				}

				// predObjBlock = putBlockInNext(predObjBlock);

				savedPredObjBlock = predObjBlock;

			} else if (i == (pomList.size() - 1)) {
				/*
				 * This is either the only POM, or the last of many, no <next>
				 * required
				 */

				/*
				 * Add parts for this pom here
				 */
				ProcessPartsOfPredObjMap ppom = new ProcessPartsOfPredObjMap(xml);
				ppom.processPartsPredObjMap(pom, subjectmapStatment, hasClasses, subjmap);

			}

		}

		/*
		 * Append the (possible multiple/nested POM elements to the
		 * tripmapStatementElem pass in as an arg.
		 * 
		 * There should always be a POM object for each TriplesMap, if stm is
		 * used for sanity check only
		 */

		if (predObjBlock != null) {
			Element predObjStatement = putBlockInNext(predObjBlock);
			tripmapBlockElem.appendChild(predObjStatement);

		}
	}

	/*
	 * Takes any block element and puts it in a <next></next> element
	 */
	private Element putBlockInNext(Element blockElm) {

		Element nextElement = xml.createElement(CONST.NEXT);

		nextElement.appendChild(blockElm);

		return nextElement;

	}

}