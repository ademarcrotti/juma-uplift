package ie.tcd.kdeg.juma.uplift.entities;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Transient;

import org.apache.tapestry5.annotations.Persist;
import org.apache.tapestry5.beaneditor.Validate;
import org.hibernate.annotations.Type;

@Entity
public class Mapping extends BaseEntity {

	@Validate("required")
	@Type(type = "text")
	private String description;

	@Validate("required")
	private String title;

	private String connectionURL = null;
	private String user = null;
	private String password = null;
	private String mappingFile = null;
	private String outputFile = null;
	private String format = null;
	private String baseIRI = null;
	private boolean filePerGraph = false;
	@Validate("required")
	private InputFormat inputFormat = null;

	public InputFormat getInputFormat() {
		return inputFormat;
	}

	public void setInputFormat(InputFormat inputFormat) {
		this.inputFormat = inputFormat;
	}

	@Column(columnDefinition = "text")
	@Type(type = "text")
	private String XML = null;

	@Persist
	@Transient
	private List<String> CSVFiles = new ArrayList<String>();

	@Transient
	private String r2rmlMapping = null;

	@Transient
	private String output = null;

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getConnectionURL() {
		return connectionURL;
	}

	public void setConnectionURL(String connectionURL) {
		this.connectionURL = connectionURL;
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getMappingFile() {
		return mappingFile;
	}

	public void setMappingFile(String mappingFile) {
		this.mappingFile = mappingFile;
	}

	public String getOutputFile() {
		return outputFile;
	}

	public void setOutputFile(String outputFile) {
		this.outputFile = outputFile;
	}

	public String getFormat() {
		return format;
	}

	public void setFormat(String format) {
		this.format = format;
	}

	public String getBaseIRI() {
		return baseIRI;
	}

	public void setBaseIRI(String baseIRI) {
		this.baseIRI = baseIRI;
	}

	public boolean isFilePerGraph() {
		return filePerGraph;
	}

	public void setFilePerGraph(boolean filePerGraph) {
		this.filePerGraph = filePerGraph;
	}

	public String getXML() {
		return XML;
	}

	public void setXML(String xML) {
		XML = xML;
	}

	public String getR2rmlMapping() {
		return r2rmlMapping;
	}

	public void setR2rmlMapping(String r2rmlMapping) {
		this.r2rmlMapping = r2rmlMapping;
	}

	public String getOutput() {
		return output;
	}

	public void setOutput(String output) {
		this.output = output;
	}

	public List<String> getCSVFiles() {
		return CSVFiles;
	}

	public void setCSVFiles(List<String> CSVFiles) {
		this.CSVFiles = CSVFiles;
	}

}
