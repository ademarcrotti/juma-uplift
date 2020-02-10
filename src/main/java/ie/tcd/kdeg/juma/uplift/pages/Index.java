package ie.tcd.kdeg.juma.uplift.pages;

import java.io.*;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.AbstractList;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.tapestry5.alerts.AlertManager;
import org.apache.tapestry5.annotations.OnEvent;
import org.apache.tapestry5.annotations.Persist;
import org.apache.tapestry5.annotations.Property;
import org.apache.tapestry5.beaneditor.Validate;
import org.apache.tapestry5.hibernate.annotations.CommitAfter;
import org.apache.tapestry5.ioc.annotations.Inject;
import org.apache.tapestry5.upload.services.UploadedFile;
import org.got5.tapestry5.jquery.JQueryEventConstants;
import org.hibernate.ReplicationMode;
import org.hibernate.Session;
import org.hibernate.criterion.Restrictions;

import ie.tcd.kdeg.juma.uplift.entities.InputFormat;
import ie.tcd.kdeg.juma.uplift.entities.Mapping;
import ie.tcd.kdeg.juma.uplift.generatemapping.FileManager;
import ie.tcd.kdeg.juma.uplift.generatemapping.GenerateMapping;
import ie.tcd.kdeg.juma.uplift.loading.TransformingR2RMLtoJuma;
import org.hibernate.util.SerializationHelper;
import sun.awt.geom.AreaOp;

import javax.persistence.EntityManager;

public class Index extends BasePage {

	@Property
	private Mapping newMapping;

	@Property
	private Mapping mapping;

	@Property
	private String title;

	@Property
	private String description;

	@Persist
	@Property
	private UploadedFile file;

	@Property
	private String xmlContent = "";

	@Inject
	private Session session;

	@Inject
	private AlertManager alertManager;

	@Property
	@Persist
	@Validate("required")
	private InputFormat inputFormat;

	@Persist
	@Property
	private List<UploadedFile> files;

	@Property
	@Persist
	private List<InputFormat> availableInputs;

	@CommitAfter//Execute this part after upload file
	public String onActivate() {
		if (!securityService.isAuthenticated()) {
			return "login";
		}
		if (files == null) {
			files = new ArrayList<UploadedFile>();
		}
		availableInputs = Arrays.asList(InputFormat.values());
		return null;
	}

	@CommitAfter //Execute this part after clicking createMapping
	public void onSuccess() throws Exception {
		// newMapping.setInputFormat(inputFormat.toString());
		newMapping.setCreator(getUsername());
		newMapping.setFormat("TTL");
		session.persist(newMapping);
		session.flush();

		// create directory for new mapping
		new File(FileManager.CSV_FOLDER_PATH(newMapping.getId())).mkdirs();

		// create directory for r2rml files of that mapping
		new File(FileManager.R2RML_FOLDER_PATH(newMapping.getId())).mkdirs();
		// if csv's have been uploaded
		if (!files.isEmpty()) {
			// save csvs
			FileManager.saveCSVFile(files, FileManager.CSV_FOLDER_PATH(newMapping.getId()));
		}

		// r2rml file but no csv's
		if (file != null) {
			try {
				// save the r2rml files to directory & generate mapping
				FileManager.saveR2RMlFile(file, FileManager.R2RML_FOLDER_PATH(newMapping.getId()));
				newMapping.setXML(TransformingR2RMLtoJuma.transform(file.getStream()));

			} catch (Exception e) {
				alertManager
						.error("There was an error loading the R2RML mapping. Please make sure the mapping is valid.");
			}
		} else if (!files.isEmpty()) {
			try {
				// generate mapping from csvs
				String mapping = new GenerateMapping()
						.fromCSVtoR2RML(FileManager.getCsvFilePaths(FileManager.CSV_FOLDER_PATH(newMapping.getId())));

				// if r2rml mapping has been uploaded aswell add it to the r2rml
				// string
				if (file != null) {
					FileManager.saveR2RMlFile(file, FileManager.R2RML_FOLDER_PATH(newMapping.getId()));
					mapping = mapping + streamToString(file.getStream());
				}
				InputStream targetStream = new ByteArrayInputStream(mapping.getBytes(StandardCharsets.UTF_8));
				newMapping.setXML(TransformingR2RMLtoJuma.transform(targetStream));// .replaceAll(html,
																					// ""));
			} catch (Exception e) {
				alertManager
						.error("There was an error loading the R2RML mapping. Please make sure the mapping is valid.");
			}
		}
		alertManager.success("Mapping created successfully!");
		files.clear();
		file = null;
	}

	String html = "<block type=\"predicate_object\"><value name=\"predicate\"><block type=\"predicate\"><field name=\"TERMMAP\">CONSTANT</field><field name=\"TERMMAPVALUE\">csv:ROW_NUM</field></block></value><value name=\"object\"><block type=\"object\"><field name=\"TERMMAP\">COLUMN</field><field name=\"TERMMAPVALUE\">ROW_NUM</field><field name=\"WITHTERMTYPE\">FALSE</field><field name=\"TERMTYPE\">termtypeliteral</field><field name=\"TERMTYPEVALUE\">insert value</field></block></value></block>";

	@SuppressWarnings("unchecked")
	public List<Mapping> getMappings() {
		return session.createCriteria(Mapping.class).add(Restrictions.eq("creator", getUsername())).list();
	}

	@CommitAfter
	public void onActionFromDelete(Mapping mapping) {
		session.delete(mapping);
		//Local file should also be deleted -- Bowen Zhang
		try{
			FileManager.deleteAll(FileManager.CSV_FOLDER_PATH(mapping.getId()));
		}catch(IOException e){
			e.printStackTrace();
		}

		alertManager.success("Mapping deleted successfully!");
	}


	//add duplicate function
	@CommitAfter
	public void onActionFromDuplicate(Mapping mapping) {

		Mapping mappingCopy = null;
		try {
			mappingCopy = null;
			Class<?> classType = mapping.getClass();
			Field fields[] = classType.getDeclaredFields();
			mappingCopy = (Mapping) classType.getConstructor(new Class[]{}).newInstance(new Object[]{});
			Field field = null;
			String suffixMethodName;
			Method getMethod, setMethod;
			Object value = null;

			for (int i = 0; i < fields.length; i++) {
				field = fields[i];
				suffixMethodName = field.getName().substring(0, 1).toUpperCase() + (field.getName().length() > 1 ? field.getName().substring(1) : "");

				getMethod = classType.getMethod("get" + suffixMethodName, new Class[]{});
				setMethod = classType.getMethod("set" + suffixMethodName, new Class[]{field.getType()});

				value = getMethod.invoke(mapping, new Object[]{});
				if (null == value) {
					if (field.getType().getName().equalsIgnoreCase("java.lang.String")) {
						setMethod.invoke(mappingCopy, new Object[]{""});
					}
				} else {
					setMethod.invoke(mappingCopy, new Object[]{value});
				}

			}
			}catch (NoSuchMethodException e) {
				e.printStackTrace();
			} catch (Exception e) {
				e.printStackTrace();
			}finally {
				mappingCopy.setCreator(mapping.getCreator());
				session.persist(mappingCopy);
				session.flush();

				String src = FileManager.CSV_FOLDER_PATH(mapping.getId());
				String dst = FileManager.CSV_FOLDER_PATH(mappingCopy.getId());

				// copy files from created mapping
				try{
					FileManager.copyFiles(src, dst);
				}catch (IOException e){
					e.printStackTrace();
				}
				alertManager.success("Duplicated mapping successfully!");
			}

	}

	// Upload of multiple files
	@OnEvent(component = "uploadCSV", value = JQueryEventConstants.AJAX_UPLOAD)
	void onUploadCSV(UploadedFile file) {
		if (file != null) {
			this.files.add(file);
		}
	}

	@OnEvent(component = "uploadR2RML", value = JQueryEventConstants.AJAX_UPLOAD)
	void onUploadR2RML(UploadedFile file) {
		this.file = file;
	}

	void onUploadException(FileUploadException ex) {
		alertManager.error(ex.getLocalizedMessage());
	}

	public String streamToString(InputStream targetStream) {
		StringWriter writer = new StringWriter();
		try {
			IOUtils.copy(targetStream, writer, "UTF-8");
		} catch (IOException e) {
			e.printStackTrace();
		}
		return writer.toString();
	}

}
