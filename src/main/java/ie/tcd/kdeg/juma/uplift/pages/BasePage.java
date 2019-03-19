package ie.tcd.kdeg.juma.uplift.pages;

import org.apache.tapestry5.ioc.annotations.Inject;
import org.tynamo.security.services.SecurityService;

public abstract class BasePage {

	@Inject
	protected SecurityService securityService;

	public String getUsername() {
		return securityService.getSubject().getPrincipal().toString();
	}
	
}
