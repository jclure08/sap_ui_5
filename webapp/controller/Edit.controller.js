sap.ui.define([
	'jquery.sap.global',
	"com/webstersys/surt/surt_core/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"com/webstersys/surt/surt_core/model/core_formatter",
	"com/webstersys/surt/surt_core/model/AccountType",
	"com/webstersys/surt/surt_core/model/Validator",
	'sap/ui/model/Filter',
	'sap/ui/core/Fragment',
	'sap/m/MessageToast'
], function (jQuery, BaseController, JSONModel, MessageBox, core_formatter, AccountType, Validator, Filter, Fragment,MessageToast) {
	"use strict";

	return BaseController.extend("com.webstersys.surt.user.controller.Edit", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.webstersys.surt.user.view.Edit
		 */
		onInit: function () {
			this.getRouter().getTargets().getTarget("edit").attachDisplay(null, this._onEdit, this);
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
			this._CurrentUser = this.getCurrentUser();
			this._oViewModel = new JSONModel({
				enableCreate: false,
				delay: 0,
				busy: false
			});
			this.setModel(this._oViewModel, "viewModel");
		},
		_onEdit: function (oEvent) {
			var oParameter = oEvent.getParameter("data");
			for (var value in oParameter) {
				oParameter[value] = decodeURIComponent(oParameter[value]);
			}
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("UserSet", oParameter);
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},
		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("viewModel");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				parameters: {
					expand: "Manager,Company"
				},
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function (oData) {
						oViewModel.setProperty("/busy", false);

					}
				}
			});
		},
		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oViewModel = this.getModel("viewModel"),
				oAppViewModel = this.getModel("appView");

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getBoundContext().getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.id,
				sObjectName = oObject.firstName;

			oViewModel.setProperty("/sObjectId", sObjectId);
			oViewModel.setProperty("/sObjectPath", sPath);
			oViewModel.setProperty("/authorities", oObject.authorities);
			oViewModel.setProperty("/subordinates", oObject.subordinates);
			oAppViewModel.setProperty("/itemToSelect", sPath);
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},
		onSave: function () {
			var oModel = this.getModel();
			var validator = new Validator();
			if (!validator.validate(this.getView()))
				return;
			if (!oModel.hasPendingChanges()) {
				/*	MessageBox.information(
						this._oResourceBundle.getText("noChangesMessage"), {
							id: "noChangesInfoMessageBox",
							styleClass: this.getOwnerComponent().getContentDensityClass()
						}
					);*/
				MessageToast.show("Data saved successfully");
				return;
			}
			var sPath = this.getView().getElementBinding().getBoundContext().getPath();
			var user = this.getModel().getObject(sPath);
			var fnUserUpdated = function () {
				this._oViewModel.setProperty("/busy", false);
				MessageToast.show("Data saved successfully");
			};
			var fnUserUpdationFailed = function () {
				this._oViewModel.setProperty("/busy", false);
			};
			this._oViewModel.setProperty("/busy", true);
			this._oODataModel.update(sPath, this.removeUnwantedObjects(user), {
				success: fnUserUpdated.bind(this),
				error: fnUserUpdationFailed.bind(this)
			});
		},
		onCancel: function () {
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				this._showConfirmQuitChanges(); // some other thing here....
			} else {
				this.getModel("appView").setProperty("/addEnabled", true);
				// cancel without confirmation
				this._navBack();
			}
		},
		onPressManagerAdd: function (oEvent) {
			if (!this._oManagerDialog) {
				this._oManagerDialog = sap.ui.xmlfragment("com.webstersys.surt.user.view.UserListSelectDialog", this);
				this._oManagerDialog.setModel(this.getView().getModel());
			}
			this._oManagerDialog.getBinding("items").filter([this.getTeamLeadFilter()]);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oManagerDialog);
			this._oManagerDialog.open();
		},
		onPressManagerRemove: function (oEvent) {
			var sPath = this.getView().getElementBinding().getBoundContext().getPath();
			var user = this.getModel().getObject(sPath);
			this._oViewModel.setProperty("/busy", true);
			user.Manager = null;
			this._oODataModel.update(sPath, this.removeUnwantedObjects(user), {
				success: this._fnManagerCreated.bind(this),
				error: this._fnManagerCreationFailed.bind(this)
			});
		},
		getTeamLeadFilter: function () {
			return new Filter("AccountType", sap.ui.model.FilterOperator.EQ, AccountType.team_lead);
		},
		handleUserSelectDialogSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("FirstName", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([this.getTeamLeadFilter(), oFilter]);
		},
		handleUserSelectDialogClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var oContext = oSelectedItem.getBindingContext();
				var manager = this.getModel().getProperty(oContext.getPath());
				var sPath = this.getView().getElementBinding().getBoundContext().getPath();
				var user = this.getModel().getObject(sPath);
				this._oViewModel.setProperty("/busy", true);
				user.Manager = manager;
				this._oODataModel.update(sPath, this.removeUnwantedObjects(user), {
					success: this._fnManagerCreated.bind(this),
					error: this._fnManagerCreationFailed.bind(this)
				});
			}
		},
		_fnManagerCreated: function () {
			this._oViewModel.setProperty("/busy", false);
			MessageToast.show("Data saved successfully");
		},
		_fnManagerCreationFailed: function () {
			this._oViewModel.setProperty("/busy", false);
		},
		onPressSubordinatesAdd: function (oEvent) {
			if (!this._oSubordinatesDialog) {
				this._oSubordinatesDialog = sap.ui.xmlfragment("com.webstersys.surt.user.view.UserMultiSelectDialog", this);
				this._oSubordinatesDialog.setModel(this.getView().getModel());
			}
			this._oSubordinatesDialog.setMultiSelect(true);
			this._oSubordinatesDialog.setShowClearButton(true);
			this._oSubordinatesDialog.getBinding("items").filter([this.getTeamMemberFilter()]);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oSubordinatesDialog);
			this._oSubordinatesDialog.open();
		},
		handleUserMultiSelectDialogSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("FirstName", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([this.getTeamMemberFilter(), oFilter]);
		},
		handleUserMultiSelectDialogClose: function (oEvent) {
			var oSelectedItems = oEvent.getParameter("selectedItems");
			var sPath = this.getView().getElementBinding().getBoundContext().getPath();
			var user = this.getModel().getObject(sPath);
			if (oSelectedItems && oSelectedItems.length > 0) {
				for (var i = 0; i < oSelectedItems.length; i++) {
					var oSelectedItem = oSelectedItems[i];
					var oContext = oSelectedItem.getBindingContext();
					var subordinate = this.getModel().getProperty(oContext.getPath());
					this._oODataModel.create("/SubordinateSet('" + user.Id + "')/$links/Users", this.createLink(subordinate), {
						batchGroupId: "AddSubordinate"
					});
				}
				this._oViewModel.setProperty("/busy", true);
				this._oODataModel.submitChanges({
					batchGroupId: "AddSubordinate",
					success: this._fnSubordinatesAdded.bind(this),
					error: this._fnSubordinateAddtionFailed.bind(this)
				});
			}
		},
		_fnSubordinatesAdded: function () {
			this._oViewModel.setProperty("/busy", false);
			MessageToast.show("Data saved successfully");
		},
		_fnSubordinateAddtionFailed: function () {
			this._oViewModel.setProperty("/busy", false);

		},
		onPressSubordinatesRemove: function (oEvent) {
			var oTable = this.byId("subordinates");
			var oSelectedItems = oTable.getSelectedItems();
			if (oSelectedItems && oSelectedItems.length > 0) {
				var sPath = this.getView().getElementBinding().getBoundContext().getPath();
				var user = this.getModel().getObject(sPath);
				var fnSubordinatesRemoved = function () {
					this._oViewModel.setProperty("/busy", false);
					MessageToast.show("Data saved successfully");
				};
				var fnSubordinateRemovedFailed = function () {
					this._oViewModel.setProperty("/busy", false);
				};
				for (var i = 0; i < oSelectedItems.length; i++) {
					var oSelectedItem = oSelectedItems[i];
					var oContext = oSelectedItem.getBindingContext();
					var subordinate = this.getModel().getProperty(oContext.getPath());
					this._oODataModel.remove("/SubordinateSet('" + user.Id + "')/$links/Users('" + subordinate.Id + "')", {
						batchGroupId: "RemoveSubordinate"
					});
				}
				this._oViewModel.setProperty("/busy", true);
				this._oODataModel.submitChanges({
					batchGroupId: "RemoveSubordinate",
					success: fnSubordinatesRemoved.bind(this),
					error: fnSubordinateRemovedFailed.bind(this)
				});
			}
		},
		getTeamMemberFilter: function () {
			return new Filter("AccountType", sap.ui.model.FilterOperator.EQ, AccountType.team_member);
		},
		onPressAuthoritiesAdd: function () {
			var sPath = this.getView().getElementBinding().getBoundContext().getPath();
			var user = this.getModel().getObject(sPath);
			var manager = undefined;
			if (this.accountTypeIsTeamMember(user.AccountType)) {
				if (user.Manager === null || user.Manager === undefined) {
					MessageBox.error("Please assign manager first to provide roles.");
					return;
				}
			}
			manager = this.getModel().getObject(sPath + "/Manager");
			if (!this._oAuthoritiesDialog) {
				this._oAuthoritiesDialog = sap.ui.xmlfragment("com.webstersys.surt.user.view.AuthoritySelectDialog", this);
				this._oAuthoritiesDialog.setModel(this.getView().getModel());
			}
			this._oAuthoritiesDialog.setMultiSelect(true);
			this._oAuthoritiesDialog.setShowClearButton(true);
			this._oAuthoritiesDialog.bindElement("/UserSet('" + manager.Id + "')");
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oAuthoritiesDialog);
			this._oAuthoritiesDialog.open();
		},
		handleAuthoritySelectDialogSearch: function () {

		},
		handleAuthoritySelectDialogClose: function (oEvent) {
			var oSelectedItems = oEvent.getParameter("selectedItems");
			var sPath = this.getView().getElementBinding().getBoundContext().getPath();
			if (oSelectedItems && oSelectedItems.length > 0) {
				var _fnAuthoritiesAdded = function () {
					this._oViewModel.setProperty("/busy", false);
					MessageToast.show("Data saved successfully");
				};
				var _fnAuthoritiesAddtionFailed = function () {
					this._oViewModel.setProperty("/busy", false);
				};
				for (var i = 0; i < oSelectedItems.length; i++) {
					var oSelectedItem = oSelectedItems[i];
					var oContext = oSelectedItem.getBindingContext();
					var role = this.getModel().getProperty(oContext.getPath());
					this._oODataModel.create(sPath + "/$links/Authorities", this.createLink(role), {
						batchGroupId: "AddAuthority"
					});
				}
				this._oViewModel.setProperty("/busy", true);
				this._oODataModel.submitChanges({
					batchGroupId: "AddAuthority",
					success: _fnAuthoritiesAdded.bind(this),
					error: _fnAuthoritiesAddtionFailed.bind(this)
				});
			}
		},
		onPressAuthoritiesRemove: function () {
			var oTable = this.byId("authorities");
			var oSelectedItems = oTable.getSelectedItems();
			if (oSelectedItems && oSelectedItems.length > 0) {
				var sPath = this.getView().getElementBinding().getBoundContext().getPath();
				var fnAuthoritiesRemoved = function () {
					this._oViewModel.setProperty("/busy", false);
				};
				var fnAuthoritiesRemovedFailed = function () {
					this._oViewModel.setProperty("/busy", false);
				};
				for (var i = 0; i < oSelectedItems.length; i++) {
					var oSelectedItem = oSelectedItems[i];
					var oContext = oSelectedItem.getBindingContext();
					var role = this.getModel().getProperty(oContext.getPath());
					this._oODataModel.remove(sPath + "/$links/Authorities('" + role.Code + "')", {
						batchGroupId: "RemoveAuthority"
					});
				}
				this._oViewModel.setProperty("/busy", true);
				this._oODataModel.submitChanges({
					batchGroupId: "RemoveAuthority",
					success: fnAuthoritiesRemoved.bind(this),
					error: fnAuthoritiesRemovedFailed.bind(this)
				});
			}
		},
		/**
		 * Opens a dialog letting the user either confirm or cancel the quit and discard of changes.
		 * @private
		 */
		_showConfirmQuitChanges: function () {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(
				this._oResourceBundle.getText("confirmCancelMessage"), {
					styleClass: oComponent.getContentDensityClass(),
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							that.getModel("appView").setProperty("/addEnabled", true);
							oModel.resetChanges();
							that._navBack();
						}
					}
				}
			);
		},
		/* =========================================================== */
		/* Internal functions
		/* =========================================================== */
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Details page
		 * @private
		 */
		_navBack: function () {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			this.getView().unbindObject();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				this.getRouter().getTargets().display("object");
			}
		},
		onExit: function () {
			if (this._oManagerDialog) {
				this._oManagerDialog.destroy();
			}
			if (this._oSubordinatesDialog) {
				this._oSubordinatesDialog.destroy();
			}
			if (this._oAuthoritiesDialog) {
				this._oAuthoritiesDialog.destroy();
			}
		}
	});

});