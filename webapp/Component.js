var url = window.location.href;
if (url.includes("webidetesting"))
	jQuery.sap.registerModulePath("com.webstersys.surt.surt_core", "/resources/com/webstersys/surt/surt_core/");
else
	jQuery.sap.registerModulePath("com.webstersys.surt.surt_core", "/apps/surt_core/src/com/webstersys/surt/surt_core/");
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/webstersys/surt/user/model/models",
	"com/webstersys/surt/surt_core/model/core_models",
	"com/webstersys/surt/surt_core/model/AccountType",
	"com/webstersys/surt/surt_core/controller/ListSelector",
	"com/webstersys/surt/surt_core/controller/ErrorHandler",
	"sap/m/MessageBox"
], function (UIComponent, Device, models, core_models, AccountType, ListSelector, ErrorHandler, MessageBox) {
	"use strict";

	return UIComponent.extend("com.webstersys.surt.user.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the FLP and device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function () {

			this.oListSelector = new ListSelector();
			this._oErrorHandler = new ErrorHandler(this);
			// set the device model
			this.setModel(core_models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(core_models.createFLPModel(), "FLP");
			this.setModel(core_models.createCurrentUserModel(), "currentUser");
			this._oODataModel = this.getModel();
			var user = this.getModel("currentUser").getData();
			if (user !== undefined && (user.AccountType === AccountType.account_owner || user.AccountType === AccountType.team_lead)) {
				// call the base component's init function and create the App view
				UIComponent.prototype.init.apply(this, arguments);
				// create the views based on the url/hash
				this.getRouter().initialize();
			} else {
				MessageBox.error("Only Account Owner or Team Lead can user this application", {
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				});
			}

		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ListSelector and ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function () {
			this.oListSelector.destroy();
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}

	});

});