package ie.tcd.kdeg.juma.uplift.loading;

import java.io.InputStream;
import java.io.StringWriter;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.apache.jena.rdf.model.Resource;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import r2rml.model.R2RMLMapping;
import r2rml.model.R2RMLMappingFactory;
import r2rml.model.TriplesMap;

public class TransformingR2RMLtoJuma {

	public static String transform(InputStream mappingFileStream) throws ParserConfigurationException {
		// load map
		R2RMLMapping map = R2RMLMappingFactory.createR2RMLMappingFromInputStream(mappingFileStream, null);

		// get all maps in the file
		Map<Resource, TriplesMap> resMap = map.getTriplesMaps();

		// empty map which will hold prefixes
		Map<String, String> pmap = null;

		// get all prefixes
		for (Resource tm0 : resMap.keySet()) {
			pmap = tm0.getModel().getNsPrefixMap();
			break;
		}

		// create empty XML doc
		Document xml = createBlankDocument();

		// process the triple maps
		ProcessMapping ptm = new ProcessMapping(xml);
		ptm.processMapping(resMap, pmap);

		try {
			StringWriter sw = new StringWriter();
			TransformerFactory tf = TransformerFactory.newInstance();
			Transformer transformer = tf.newTransformer();
			transformer.setOutputProperty(OutputKeys.METHOD, "html");

			transformer.transform(new DOMSource(xml), new StreamResult(sw));
			// System.out.println(sw.toString());
			return sw.toString();
		} catch (Exception ex) {
			ex.printStackTrace();
			throw new RuntimeException("Error converting the R2RML mapping to Juma", ex);
		}

	}

	private static Document createBlankDocument() throws ParserConfigurationException {

		DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();
		DocumentBuilder documentBuilder = documentBuilderFactory.newDocumentBuilder();
		Document emptyXMLdoc = documentBuilder.newDocument();
		Element nsElem = emptyXMLdoc.createElementNS(CONST.W3_NS, CONST.XML);
		Element rootBlockElement = emptyXMLdoc.createElement(CONST.BLOCK);
		rootBlockElement.setAttribute(CONST.DELETABLE, CONST.FALSE);
		rootBlockElement.setAttribute(CONST.TYPE, CONST.MAPPING);
		nsElem.appendChild(rootBlockElement);
		emptyXMLdoc.appendChild(nsElem);

		return emptyXMLdoc;

	}

}
