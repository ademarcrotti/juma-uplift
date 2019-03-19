package ie.tcd.kdeg.juma.uplift.loading;

import java.util.Map;
import java.util.Map.Entry;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

public class ProcessPrefixes {

	Document xml;

	public ProcessPrefixes(Document xml) {

		this.xml = xml;

	}

	public Document processPrefixes(Map<String, String> pmap, Element mapBlockElement) {

		Element ns = xml.getDocumentElement();
		Element rootBlockElement = (Element) ns.getFirstChild();

		// if the root block is there, add the VOCAB statement as a child to the
		// rootBlockElem
		if (rootBlockElement.hasAttribute(CONST.DELETABLE) && rootBlockElement.hasAttribute(CONST.TYPE)) {

			// vocab statement
			Element prefixStatementElm = xml.createElement(CONST.STATEMENT);
			prefixStatementElm.setAttribute(CONST.NAME, CONST.VOCAB);

			// add as child
			mapBlockElement.appendChild(prefixStatementElm);

			int numPrefixes = 0;

			// loop and find all prefix statements, while
			// http://www.w3.org/ns/r2rml
			for (Entry<String, String> value : pmap.entrySet()) {

				String prefix = value.getKey().toString();
				String prefixURI = value.getValue().toString();

				if (!prefixURI.contains(CONST.R2RML_NS)) {
					insertPrefix(prefix, prefixURI, prefixStatementElm, numPrefixes);
					numPrefixes++;
				}
			}

		} else {

			System.out.println("Something wrong, appending prefixes to root block element went wrong");

		}

		return xml;
	}

	/*
	 * Helper methods to insert prefixes to XML
	 */
	public Document insertPrefix(String prefix, String prefixURI, Element prefixStatementElm, int numPrefixes) {

		// make the predefined prefix block
		Element prefixBlockElem = makePrefixElement(prefix, prefixURI);

		if (numPrefixes == 0) {
			prefixStatementElm.appendChild(prefixBlockElem);
		} else {
			prefixBlockElem = putBlockInNext(prefixBlockElem);

			NodeList nextTagList = prefixStatementElm.getElementsByTagName(CONST.NEXT);

			if (nextTagList.getLength() == 0) {
				prefixStatementElm.getFirstChild().appendChild(prefixBlockElem);
			} else {
				Element nextTagElem = (Element) nextTagList.item(nextTagList.getLength() - 1);
				nextTagElem.getFirstChild().appendChild(prefixBlockElem);
			}
		}

		return xml;

	}

	// returns prefix block and fields cluster
	private Element makePrefixElement(String prefix, String prefixURI) {

		Element prefixBlockElem = xml.createElement(CONST.BLOCK);

		// not predefined prefix block
		prefixBlockElem.setAttribute(CONST.TYPE, CONST.PREFIX_LC);

		// Prefix field element
		Element prefixBlockFieldElm = xml.createElement("field");
		prefixBlockFieldElm.setAttribute(CONST.NAME, CONST.PREFIX_UC);
		prefixBlockFieldElm.appendChild(xml.createTextNode(prefix));

		// Prefix URI field element
		Element prefixBlockFieldUriElm = xml.createElement(CONST.FIELD);
		prefixBlockFieldUriElm.setAttribute(CONST.NAME, CONST.URI);
		prefixBlockFieldUriElm.appendChild(xml.createTextNode(prefixURI));

		// add to the prefix block
		prefixBlockElem.appendChild(prefixBlockFieldElm);
		prefixBlockElem.appendChild(prefixBlockFieldUriElm);

		return prefixBlockElem;

	}

	private Element putBlockInNext(Element blockElm) {

		Element nextElement = xml.createElement(CONST.NEXT);

		nextElement.appendChild(blockElm);

		return nextElement;

	}

}
