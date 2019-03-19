package ie.tcd.kdeg.juma.uplift.entities;

import javax.persistence.Column;
import javax.persistence.Entity;

import org.hibernate.annotations.Type;

@Entity
public class MappingExecution extends BaseEntity {

	@Column(columnDefinition="text")
	@Type(type="text")
	private String mapping = null;
	@Column(columnDefinition="text")
	@Type(type="text")
	private String output = null;
	
	private boolean finishedPart1;
	private boolean finishedPart2;
	private boolean finishedPart3;
	
	public String getMapping() {
		return mapping;
	}
	
	public void setMapping(String mapping) {
		this.mapping = mapping;
	}
	
	public String getOutput() {
		return output;
	}
	
	public void setOutput(String output) {
		this.output = output;
	}

	public boolean isFinishedPart1() {
		return finishedPart1;
	}

	public void setFinishedPart1(boolean finishedPart1) {
		this.finishedPart1 = finishedPart1;
	}

	public boolean isFinishedPart2() {
		return finishedPart2;
	}

	public void setFinishedPart2(boolean finishedPart2) {
		this.finishedPart2 = finishedPart2;
	}

	public boolean isFinishedPart3() {
		return finishedPart3;
	}

	public void setFinishedPart3(boolean finishedPart3) {
		this.finishedPart3 = finishedPart3;
	}

}
