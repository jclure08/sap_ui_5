jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 User in the list
// * All 3 User have at least one subordinates

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/webstersys/surt/user/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/webstersys/surt/user/test/integration/pages/App",
	"com/webstersys/surt/user/test/integration/pages/Browser",
	"com/webstersys/surt/user/test/integration/pages/Master",
	"com/webstersys/surt/user/test/integration/pages/Detail",
	"com/webstersys/surt/user/test/integration/pages/Create",
	"com/webstersys/surt/user/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.webstersys.surt.user.view."
	});

	sap.ui.require([
		"com/webstersys/surt/user/test/integration/MasterJourney",
		"com/webstersys/surt/user/test/integration/NavigationJourney",
		"com/webstersys/surt/user/test/integration/NotFoundJourney",
		"com/webstersys/surt/user/test/integration/BusyJourney",
		"com/webstersys/surt/user/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});