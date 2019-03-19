package ie.tcd.kdeg.juma.uplift.entities;

import java.util.Date;

import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.MappedSuperclass;

import org.apache.tapestry5.beaneditor.NonVisual;

@MappedSuperclass
public abstract class BaseEntity {

	@Id
	@NonVisual
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private long id;
	
	private String creator;
	private Date created = new Date();
	
	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}
	
	public String getCreator() {
		return creator;
	}

	public void setCreator(String creator) {
		this.creator = creator;
	}

	public Date getCreated() {
		return created;
	}

	public void setCreated(Date created) {
		this.created = created;
	}
}
