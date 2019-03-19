package ie.tcd.kdeg.juma.uplift.components;

import org.apache.tapestry5.annotations.Import;
import org.apache.tapestry5.ioc.annotations.Inject;
import org.tynamo.security.services.SecurityService;

/**
 * Layout component for pages of application portal.
 */
@Import(stylesheet = "context:css/layout.css")
public class Layout {
	
	@Inject
	protected SecurityService securityService;

	public String getUsername() {
		return securityService.getSubject().getPrincipal().toString();
	}
	
}
