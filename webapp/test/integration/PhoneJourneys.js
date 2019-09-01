jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/webstersys/surt/user/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/webstersys/surt/user/test/integration/pages/App",
	"com/webstersys/surt/user/test/integration/pages/Browser",
	"com/webstersys/surt/user/test/integration/pages/Master",
	"com/webstersys/surt/user/test/integration/pages/Detail",
	"com/webstersys/surt/user/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.webstersys.surt.user.view."
	});

	sap.ui.require([
		"com/webstersys/surt/user/test/integration/NavigationJourneyPhone",
		"com/webstersys/surt/user/test/integration/NotFoundJourneyPhone",
		"com/webstersys/surt/user/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});