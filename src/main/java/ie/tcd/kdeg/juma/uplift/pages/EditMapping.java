package ie.tcd.kdeg.juma.uplift.pages;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.lang.StringEscapeUtils;
import org.apache.jena.query.Dataset;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.tapestry5.StreamResponse;
import org.apache.tapestry5.alerts.AlertManager;
import org.apache.tapestry5.annotations.Component;
import org.apache.tapestry5.annotations.Environmental;
import org.apache.tapestry5.annotations.OnEvent;
import org.apache.tapestry5.annotations.Persist;
import org.apache.tapestry5.annotations.Property;
import org.apache.tapestry5.annotations.SessionAttribute;
import org.apache.tapestry5.beaneditor.Validate;
import org.apache.tapestry5.corelib.components.ActionLink;
import org.apache.tapestry5.corelib.components.Zone;
import org.apache.tapestry5.hibernate.annotations.CommitAfter;
import org.apache.tapestry5.ioc.annotations.Inject;
import org.apache.tapestry5.services.Response;
import org.apache.tapestry5.services.javascript.JavaScriptSupport;
import org.apache.tapestry5.upload.services.UploadedFile;
import org.got5.tapestry5.jquery.JQueryEventConstants;
import org.hibernate.Session;

import ie.tcd.kdeg.juma.uplift.entities.InputFormat;
import ie.tcd.kdeg.juma.uplift.entities.Mapping;
import ie.tcd.kdeg.juma.uplift.generatemapping.FileManager;
import r2rml.engine.Configuration;
import r2rml.engine.R2RMLProcessor;

public class EditMapping extends BasePage {

	@Property
	private Mapping mapping;

	@Inject
	private Session session;

	@Inject
	private AlertManager alertManager;

	// fields for changing the information
	@Component
	private Zone informationZone;

	// fields for changing the configuration
	@Component
	private Zone configurationZone;

	// fields for changing the mapping
	@Component
	private Zone editorZone;

	@Persist
	@Property
	private List<File> files;

	@Property
	private File file;

	@Persist
	@Property
	private List<UploadedFile> upFiles;

	@Property
	private String URL;

	@Environmental
	private JavaScriptSupport javaScriptSupport;

	@SessionAttribute
	private Dataset dataset;

	private boolean preview;
	private boolean download;

	@Property
	@Persist
	@Validate("required")
	private InputFormat inputFormat; // InputFormat

	@Property
	private boolean isCSV;

	@Component(id = "downloadLink")
	private ActionLink downloadLink;

	@Property
	@Persist
	private List<InputFormat> availableInputs;

	@Property
	private boolean fromCSV;

	public String onActivate(long id) throws IOException {
		if (!securityService.isAuthenticated()) {
			return "login";
		}
		// Get the mapping when page loads...
		mapping = (Mapping) session.get(Mapping.class, id);
		// check for csv's files
		refreshDiretory();
		// new list waiting for csv files to be added
		if (upFiles == null) {
			upFiles = new ArrayList<UploadedFile>();
		}
		// check the input format
		isCSV = !InputFormat.RDB.equals(mapping.getInputFormat());
		availableInputs = Arrays.asList(InputFormat.values());
		return null;
	}

	// refresh csvDB directory
	private void refreshDiretory() throws IOException {
		if (URL != null)
			FileManager.urlToFile(URL, mapping.getId());
		List<String> filePaths = FileManager.getCsvFilePaths(FileManager.CSV_FOLDER_PATH(mapping.getId()));
		mapping.setCSVFiles(filePaths);
		files = new ArrayList<File>();
		for (String fp : filePaths) {
			files.add(new File(fp));
		}
	}

	@CommitAfter
	public Object onValueChanged(InputFormat inputFormat) throws IOException {
		// this.isCSV = inputFormat.equals(InputFormat.CSV);
		//
		// if (isCSV) {
		// mapping.setConnectionURL(null);
		// mapping.setPassword(null);
		// mapping.setUser(null);
		// } else {
		// FileUtils.cleanDirectory(new
		// File(FileManager.CSV_FOLDER_PATH(mapping.getId())));
		// }

		session.update(mapping);
		return configurationZone.getBody();
	}

	public Object[] onPassivate() {
		return new Object[] { mapping.getId() };
	}

	@CommitAfter
	public Object onSuccessFromEditInformation(long id) {
		session.update(mapping);
		return informationZone.getBody();
	}

	@CommitAfter
	public Object onSuccessFromEditConfiguration(long id) throws IOException {
		if (fromCSV) {
			refreshDiretory();
			FileManager.saveCSVFile(upFiles, FileManager.CSV_FOLDER_PATH(mapping.getId()));
			URL = null;
			upFiles.clear();
			refreshDiretory();
		}
		session.update(mapping);
		return configurationZone.getBody();
	}

	@CommitAfter
	public Object onSuccessFromSaveMapping(long id) throws FileNotFoundException {
		session.update(mapping);
		try {

			if (preview || download) {
				if ((mapping.getConnectionURL() == null || mapping.getConnectionURL().isEmpty()
						|| mapping.getUser() == null || mapping.getUser().isEmpty() || mapping.getPassword() == null
						|| mapping.getPassword().isEmpty()) && mapping.getCSVFiles().isEmpty()) {
					alertManager.error(mapping.getInputFormat().toString() + " fields cannot be null.");
					preview = download = false;
				} else {
					if (preview) {
						Dataset datasetPreview = executeMapping(mapping);
						StringWriter writer = new StringWriter();
						String format = mapping.getFormat();
						if (format.equals("NQUADS") || format.equals("TRIG")) {
							Lang lang = format.equals("NQUADS") ? Lang.NQ : Lang.TRIG;
							RDFDataMgr.write(writer, datasetPreview, lang);
						} else {
							datasetPreview.getDefaultModel().write(writer, format);
						}
						mapping.setOutput(StringEscapeUtils.escapeHtml(writer.toString()));
					} else if (download) {
						if (mapping.getOutputFile() == null) {
							mapping.setOutputFile("output.ttl");
						}
						this.dataset = executeMapping(mapping);
					}

				}
			}
		} catch (Exception e) {
			// this.alertManager.alert(Duration.TRANSIENT, Severity.ERROR,
			// "The mapping could not be executed. Please check errors.");
			// e.printStackTrace();
			if (InputFormat.CSV.equals(mapping.getInputFormat()))
				mapping.setOutput(
						"Check your CSV file. File and column names should not contain special characters or spaces.\n"
								+ e.toString());
			else
				mapping.setOutput(e.toString());
		}
		return editorZone.getBody();
	}

	private Dataset executeMapping(Mapping mapping) throws Exception {
		Configuration configuration = new Configuration();
		try {
			List<String> csvFiles = null;
			String username = null;
			String password = null;
			String connectionURL = null;
			if (!mapping.getCSVFiles().isEmpty()) {
				csvFiles = (mapping.getCSVFiles());
				configuration.setCSVFiles(csvFiles);
			} else {
				username = (mapping.getUser());
				password = (mapping.getPassword());
				connectionURL = (mapping.getConnectionURL());
				configuration.setUser(username);
				configuration.setPassword(password);
				configuration.setConnectionURL(connectionURL);
			}
			// if preview always shows in turtle
			if (preview) {
				configuration.setPreview(preview);
				configuration.setFormat(mapping.getFormat());
			} else {
				configuration.setFormat(mapping.getFormat());
			}
			configuration.setMapping(mapping.getR2rmlMapping());

			R2RMLProcessor engine = new R2RMLProcessor(configuration);
			engine.execute();

			return engine.getDataset();
		} catch (Exception e) {
			// e.printStackTrace();
			throw e;
		}
	}

	public void onSelectedFromPreview() {
		preview = true;
		download = false;
	}

	public void onSelectedFromCsv() {
		fromCSV = true;
	}

	public void onSelectedFromDownload() {
		download = true;
		preview = false;
	}

	// activates preview panel
	public void onShowModal() {
		if (preview)
			javaScriptSupport.addScript("$('#showModal')[0].click();");
	}

	// activates download file response
	public void onDownloadTrigger() throws IOException {
		if (download) {
			javaScriptSupport.addScript("$('#downloadlink')[0].click();");
		}
	}

	// trigger buttons to show/hide div containing form fields
	public void onChangeInputFormat() {
		isCSV = InputFormat.CSV.equals(mapping.getInputFormat());
		if (isCSV) {
			javaScriptSupport.addScript("$('#switchToCSV')[0].click();");
		} else {
			javaScriptSupport.addScript("$('#switchToRDB')[0].click();");
		}
	}

	public Object onActionFromDelete(String fileName) throws IOException {
		if (FileManager.deleteCSVFile(fileName, mapping.getId())) {
			refreshDiretory();
		} else {
			alertManager.error("File could not be deleted");
		}
		return configurationZone.getBody();
	}

	// Upload of multiple files
	@OnEvent(component = "uploadCSV", value = JQueryEventConstants.AJAX_UPLOAD)
	public void onUploadCSV(UploadedFile file) {
		if (file != null) {
			this.upFiles.add(file);
		}
	}

	public void onUploadException(FileUploadException ex) {
		System.out.println(ex.getLocalizedMessage());
	}

	// downlood file method
	@OnEvent(component = "downloadLink")
	public Object downloadMapping() throws IOException {
		final ByteArrayOutputStream os = new ByteArrayOutputStream();
		String format = mapping.getFormat();

		if (format.equals("NQUADS") || format.equals("TRIG")) {
			Lang lang = format.equals("NQUADS") ? Lang.NQ : Lang.TRIG;
			RDFDataMgr.write(os, dataset, lang);
		} else {
			dataset.getDefaultModel().write(os, "TTL");
		}

		StreamResponse response = new StreamResponse() {
			public void prepareResponse(Response response) {
				response.setHeader("Content-Disposition", "attachment; filename=\"" + mapping.getOutputFile() + "\"");
			}

			public InputStream getStream() throws IOException {
				InputStream in = new ByteArrayInputStream(os.toByteArray());
				return in;
			}

			public String getContentType() {
				return "application/rdf";
			}
		};
		return response;
	}
}