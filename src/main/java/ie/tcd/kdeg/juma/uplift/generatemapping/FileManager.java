package ie.tcd.kdeg.juma.uplift.generatemapping;

import java.io.*;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.tapestry5.upload.services.UploadedFile;

public class FileManager {

	public static String CSV_FOLDER_PATH(long id) {
		return "csvDB" + File.separator + id + File.separator;
	}

	public static String R2RML_FOLDER_PATH(long id) {
		return CSV_FOLDER_PATH(id) + "R2RML" + File.separator;
	}

	// writes content from web file to local file
	public static String urlToFile(String URL, long id) throws IOException {
		URL csvUrl = new URL(URL);
		String localCsvPath = FileManager.CSV_FOLDER_PATH(id) + FilenameUtils.getName(csvUrl.getPath());
		Scanner s = new Scanner(csvUrl.openStream());
		String content = "";
		PrintWriter out = new PrintWriter(new FileOutputStream(new File(localCsvPath), true));
		;
		while (s.hasNext()) {
			out.write(s.nextLine());
		}
		return localCsvPath;
	}

	public static boolean deleteCSVFile(String fileName, long id) {
		File file = new File(CSV_FOLDER_PATH(id) + fileName);
		return file.delete();
	}

	public static void createFile(String fileName) {
		File file = new File(fileName);
		if (!file.exists())
			file.mkdirs();
	}

	public static void saveCSVFile(List<UploadedFile> files, String folder) {
		createFile(folder);

		File savedCSV = null;
		// loop through list and write to files in new directory
		// get paths as well for generate mapping
		for (UploadedFile f : files) {
			String fileName = f.getFileName();
			savedCSV = new File(folder + fileName);
			// save the filepaths
			f.write(savedCSV);
		}
	}

	public static void saveR2RMlFile(UploadedFile file, String FOLDERPATH) {
		File savedR2RML = null;
		// create new directory
		savedR2RML = new File(FOLDERPATH + "r2rml.ttl");
		// save the filepaths
		file.write(savedR2RML);
	}

	public static List<String> getCsvFilePaths(String FOLDERPATH) {
		// holds filePaths
		List<String> filePaths = new ArrayList<String>();
		File dir = new File(FOLDERPATH);
		File[] directoryListing = dir.listFiles();
		if (directoryListing != null) {
			for (File child : directoryListing) {
				if (child.getName().equals("R2RML")) {
				} else {
					filePaths.add(FOLDERPATH + child.getName());
				}
			}
		} else {
			// break out
		}
		return filePaths;
	}

	// generate string for r2rml file
	static String readR2RMLFile(String path, Charset encoding) throws IOException {
		File f = new File(path);
		if (f.exists() && !f.isDirectory()) {
			byte[] encoded = Files.readAllBytes(Paths.get(path));
			return new String(encoded, encoding);
		} else {
			return "";
		}
	}

	//copy files from an existing mapping
	public static void copyFiles(String src, String dest) throws IOException{
		File srcF = new File(src);
		File destF = new File(dest);
		//MacOS would automatically generate .DS_Store file
		File hiddenDS = new File(dest + ".DS_Store");

		try{
			FileUtils.copyDirectory(srcF, destF);
			hiddenDS.delete();
		}catch (IOException e){
			e.printStackTrace();
		}
	}

	//delete all data when clicking delete button at Index page
	public static void deleteAll(String src){
		File file = new File(src);

		try{
			FileUtils.deleteDirectory(file);
		}catch (IOException e){
			e.printStackTrace();
		}
	}

}
