package ie.tcd.kdeg.juma.uplift.loading;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.jena.rdf.model.Resource;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import r2rml.model.TriplesMap;

public class ProcessMapping {

	private Document xml;

	// Constructor
	public ProcessMapping(Document xml) {

		this.xml = xml;

	}

	public void processMapping(Map<Resource, TriplesMap> resMap, Map<String, String> pmap) {

		// declare necessary variables
		Set<Resource> set = resMap.keySet();
		List<Resource> resList = new ArrayList<Resource>(set);

		Element basicMapBlockElem = null;
		Element savedMapBlockElem = null;

		Element ns = xml.getDocumentElement();
		Element rootBlockElement = (Element) ns.getFirstChild();

		// iterate in reverse to preserve order of Mapping blocks
		for (int i = (resList.size() - 1); i >= 0; i--) {

			Resource res = resList.get(i);
			TriplesMap tmap = resMap.get(res);

			// no the last map to be processed
			if (i > 0) {

				basicMapBlockElem = createBasicMapBlock(tmap, (i + 1), pmap, rootBlockElement);

				// if not the first map to be processed
				if (savedMapBlockElem != null) {

					basicMapBlockElem.getFirstChild().appendChild(savedMapBlockElem);

				}

				// preserve map that was just processed
				savedMapBlockElem = basicMapBlockElem;

				// if (i == 0) {
				// PrettyPrintXML.printElement(basicMapBlockElem);
				// }

			}

			// only/ last map to be processed
			else if (i == 0) {

				basicMapBlockElem = createBasicMapBlock(tmap, (i + 1), pmap, rootBlockElement);

				// if there was more than one map, append to previous
				if (savedMapBlockElem != null) {

					basicMapBlockElem.appendChild(savedMapBlockElem);

				}

				// PrettyPrintXML.printElement(basicMapBlockElem);

			}
		}
	}

	private Element createBasicMapBlock(TriplesMap tmap, int ID, Map<String, String> pmap, Element rootBlockElem) {

		// not the first map
		if (ID > 1) {

			// has its own mapping block
			Element newMapBlock = xml.createElement(CONST.BLOCK);
			newMapBlock.setAttribute(CONST.TYPE, CONST.MAPPING);

			// logical table
			ProcessLogicalTable plt = new ProcessLogicalTable(xml);
			plt.processLogicalTable(tmap, newMapBlock);

			// insert prefixes
			ProcessPrefixes pp = new ProcessPrefixes(xml);
			pp.processPrefixes(pmap, newMapBlock);

			// subject map
			ProcessSubjectMap psm = new ProcessSubjectMap(xml);
			psm.processSubjectMap(tmap, newMapBlock, ID);

			// as it is not the first mapping block, it must be in next block
			newMapBlock = putBlockInNext(newMapBlock);

			return newMapBlock;

		}

		// therefore the first/ only map, can be appended directly to the root
		// block
		else {

			// logical table
			ProcessLogicalTable plt = new ProcessLogicalTable(xml);
			plt.processLogicalTable(tmap, rootBlockElem);

			// insert prefixes
			ProcessPrefixes pp = new ProcessPrefixes(xml);
			pp.processPrefixes(pmap, rootBlockElem);

			// subject map
			ProcessSubjectMap psm = new ProcessSubjectMap(xml);
			psm.processSubjectMap(tmap, rootBlockElem, ID);

			return rootBlockElem;
		}

	}

	private Element putBlockInNext(Element blockElm) {

		Element nextElement = xml.createElement(CONST.NEXT);

		nextElement.appendChild(blockElm);

		return nextElement;

	}

}
