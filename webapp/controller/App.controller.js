sap.ui.define([
	"com/webstersys/surt/surt_core/controller/BaseAppController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.webstersys.surt.user.controller.App", {

		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				oListSelector = this.getOwnerComponent().oListSelector,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			var that = this;
			
			oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				itemToSelect: null,
				addEnabled: false

			});
			this.setModel(oViewModel, "appView");
			this._oODataModel = this.getOwnerComponent().getModel();
			fnSetAppNotBusy = function () {
				that._oODataModel.read("/GetCurrentUser",{
				success:function(oData){
						that.setCurrentUser(oData);	
						oViewModel.setProperty("/busy", false);
						oViewModel.setProperty("/delay", iOriginalBusyDelay);
				}});
			};

			this.getOwnerComponent().getModel().metadataLoaded()
				.then(fnSetAppNotBusy);

			// Makes sure that master view is hidden in split app
			// after a new list entry has been selected.
			oListSelector.attachListSelectionChange(function () {
				this.byId("idAppControl").hideMaster();
			}, this);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}
	});

});