package ie.tcd.kdeg.juma.uplift.generatemapping;

import java.io.File;
import java.io.IOException;
import java.io.StringWriter;
import java.net.URLEncoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.vocabulary.XSD;
import org.apache.log4j.Logger;

import r2rml.engine.R2RML;

/**
 * Based on the project
 * https://opengogs.adaptcentre.ie/debruync/generate-mapping created by
 * Christophe Debruyne.
 */

public class GenerateMapping {

	private static final String CSV = "http://example.org/csv/";
	private static Logger logger = Logger.getLogger(GenerateMapping.class.getName());
	private static File csvFile = null;
	private static Resource Record = ResourceFactory.createResource(CSV + "Record");

	private Model mapping = null;

	public String fromCSVtoR2RML(List<String> filePaths) {
		try {
			mapping = ModelFactory.createDefaultModel();
			mapping.setNsPrefix("rr", R2RML.NS);
			mapping.setNsPrefix("xsd", XSD.NS);

			for (int i = 0; i < filePaths.size(); i++) {
				createMappingFromCSVFile(filePaths.get(i));
			}
			StringWriter out = new StringWriter();
			mapping.write(out, "TTL");

			// write the csv r2rml to the r2rml folder, to handle changes with
			// the csv's
			String returnThis = out.toString();

			return returnThis;
		} catch (Exception e) {
			logger.error(e.getMessage());
			return null;
		}
	}

	public void createMappingFromCSVFile(String csvPath) throws GenMapException, IOException {

		try {
			csvFile = new File(csvPath);
			String csvName = FilenameUtils.getBaseName(csvFile.getName());
			String csvPrefix = CSV;
			mapping.setNsPrefix("csv", csvPrefix);

			Resource triplesmap = mapping.createResource("#TriplesMap" + csvName);

			// create the TriplesMap with the logical table
			Resource lt = mapping.createResource();
			mapping.add(triplesmap, R2RML.logicalTable, lt);
			// String name = createTableNameForFile(csvFile);
			mapping.add(lt, R2RML.tableName, csvName);

			// create the SubjectMap
			Resource sm = mapping.createResource();
			mapping.add(triplesmap, R2RML.subjectMap, sm);
			mapping.add(sm, R2RML.template, "http://www.example.org/record/{id}");
			mapping.add(sm, R2RML.clazz, Record);

			List<String> cnames = getColumnNames();
			for (int i = 0; i < cnames.size(); i++) {
				String cname = cnames.get(i);
				// create PredicateObjectMaps
				Resource pom = mapping.createResource();
				mapping.add(triplesmap, R2RML.predicateObjectMap, pom);
				Resource predicate = mapping.createResource(csvPrefix + URLEncoder.encode(cname, "UTF-8"));
				mapping.add(pom, R2RML.predicate, predicate);

				Resource om = mapping.createResource();
				mapping.add(pom, R2RML.objectMap, om);
				mapping.add(om, R2RML.column, cname);
			}

		} catch (Exception e) {
			throw new GenMapException("Problem processing CSV file: " + e.getMessage(), e);
		}
	}

	private List<String> getColumnNames() throws GenMapException {
		List<String> columnNames = new ArrayList<String>();

		try {
			String connectionURL = "jdbc:h2:mem:" + System.currentTimeMillis();
			DriverManager.getConnection(connectionURL + ";create=true;DATABASE_TO_UPPER=false;").close();

			Connection connection = DriverManager.getConnection(connectionURL);
			java.sql.Statement statement = connection.createStatement();

			String sql = "SELECT * FROM CSVREAD('" + csvFile.getAbsolutePath() + "', NULL, NULL) LIMIT 1;";
			ResultSet rs = statement.executeQuery(sql);
			for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
				columnNames.add(rs.getMetaData().getColumnName(i).toLowerCase());
			}

			statement.close();
			connection.close();
		} catch (Exception e) {
			throw new GenMapException("Problem processing CSV file: " + e.getMessage(), e);
		}

		return columnNames;
	}

}
