sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'hodek/capa/utils/Formatter',
	'sap/m/MessageBox',
	"sap/ui/core/format/DateFormat",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	'sap/m/MessageToast',
], function (Controller, Formatter, MessageBox, DateFormat, ValueHelpDialog, MessageToast) {
	"use strict";

	return Controller.extend("hodek.capa.controller.Main", {

		onInit: function () {
			// this.onSet7DaysRange();
			// In onInit
			this._iPageSize = 100;       // number of items per batch
			this._iPage = 0;            // current page index
			this._bAllDataLoaded = false;
			this._bSkipFirstUpdate = false;  // skip the first updateStarted
			var oJsonModel = new sap.ui.model.json.JSONModel([]);
			this.getOwnerComponent().setModel(oJsonModel, "getListReport");
			var oSelectedModel = new sap.ui.model.json.JSONModel([]);
			this.getOwnerComponent().setModel(oSelectedModel, "selectedModel");
			// this._registerForP13n();

			this._aCurrentFilters = [];
			let oPlantModel = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(oPlantModel, "PlantModel");
			let oSupplierModel = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(oSupplierModel, "SupplierModel");
			this.byId("idVendor").setBusy(true);
			this.getPlantData();
			// this._loadBillingDocumentData(null, true);

			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("RouteMain").attachPatternMatched(this._onRouteMatched, this);

		},
		_onRouteMatched: function (oEvent) {
			if (this._iPage !== 0) {
				this.getView().setBusy(false);
			} else {
				this.getView().setBusy(true);
			}
		},
		formatter: Formatter,
		onSet7DaysRange: function () {
			var oDateRange = this.byId("idPostingDate");
			if (!oDateRange) {
				return;
			}

			// Today
			var oToday = new Date();

			// 7 days later
			var oNext7 = new Date();
			oNext7.setDate(oToday.getDate() + 7);

			// Set the range
			oDateRange.setDateValue(oToday);
			oDateRange.setSecondDateValue(oNext7);
		},

		onInvoiceValueHelp: function () {
			var that = this;

			// ===================================================
			// 1. Define columns for Value Help
			// ===================================================
			var aCols = [
				{ label: "Product Number", path: "Product", width: "12rem" },
				// { label: "Customer Name", path: "CustomerName", width: "12rem" }
			];

			// ===================================================
			// 2. Create the ValueHelpDialog
			// ===================================================
			var oVHD = new ValueHelpDialog({
				title: "Select Product no",
				supportMultiselect: true,
				key: "Product",            // key field
				descriptionKey: "ProductDescription", // field shown in description
				ok: function (e) {
					var aTokens = e.getParameter("tokens"); // all selected tokens
					var oMultiInput = that.byId("idAccountingDocument");

					// Remove existing tokens
					oMultiInput.removeAllTokens();

					// Add all selected tokens
					aTokens.forEach(function (oToken) {
						oMultiInput.addToken(new sap.m.Token({
							key: oToken.getKey(),
							text: oToken.getText()
						}));
					});

					// Fire change event with combined keys (optional)
					var sCombined = aTokens.map(t => t.getKey()).join(", ");
					oMultiInput.fireChange({
						value: sCombined,
						newValue: sCombined,
						valid: true
					});

					oVHD.close();
				},
				cancel: function () { oVHD.close(); },
				afterClose: function () { oVHD.destroy(); }
			});

			// ===================================================
			// 3. Configure Table inside ValueHelpDialog
			// ===================================================
			var oTable = oVHD.getTable();
			// Build mandatory filter for DocumentType
			// var oDocTypeFilter = new sap.ui.model.Filter("BillingDocumentType", sap.ui.model.FilterOperator.EQ, sDocType);
			// Add columns and row/item binding depending on table type
			if (oTable.bindRows) {
				// Grid Table (sap.ui.table.Table)
				aCols.forEach(c => oTable.addColumn(new sap.ui.table.Column({
					label: c.label,
					template: new sap.m.Text({ text: "{" + c.path + "}" }),
					width: c.width
				})));
				oTable.bindRows({ path: "/MaterialVh" });
			} else {
				// Responsive Table (sap.m.Table)
				aCols.forEach(c => oTable.addColumn(new sap.m.Column({
					header: new sap.m.Label({ text: c.label })
				})));
				oTable.bindItems({
					path: "/MaterialVh",
					template: new sap.m.ColumnListItem({
						cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" }))
					})
				});
			}

			// ===================================================
			// 4. Central Search Function
			// ===================================================
			var fnDoSearch = function (sQuery) {
				sQuery = (sQuery || "").trim();

				var sAgg = oTable.bindRows ? "rows" : "items";
				var oBinding = oTable.getBinding(sAgg);

				if (!sQuery) {
					// Clear filters if query empty
					oBinding.filter([]);
					return;
				}

				// --- Step A: Try client-side filtering ---
				var aFilters = aCols.map(c =>
					new sap.ui.model.Filter(c.path, sap.ui.model.FilterOperator.Contains, sQuery)
				);

				// combine them with OR
				var oOrFilter = new sap.ui.model.Filter({
					filters: aFilters,
					and: false
				});

				oBinding.filter([oOrFilter], "Application");

				// --- Step B: If no results, fallback to server-side search ---
				if (oBinding.getLength() === 0) {
					var oModel = that.getView().getModel();
					// Server-side (ODataModel)
					oModel.read("/MaterialVh", {
						filters: [oOrFilter],        // <-- use Filter object, not string
						urlParameters: { "$top": 200 },
						success: function (oData) {
							var oJson = new sap.ui.model.json.JSONModel({
								MaterialVh: oData.results
							});
							oTable.setModel(oJson);
							// rebind to make sure busy state clears
							if (oTable.bindRows) {
								oTable.bindRows({ path: "/MaterialVh" });
							} else {
								oTable.bindItems({
									path: "/MaterialVh",
									template: new sap.m.ColumnListItem({
										cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" }))
									})
								});
							}
							oTable.setBusy(false);
							oVHD.setBusy(false);
						},
						error: function () {
							sap.m.MessageToast.show("Server search failed");
						}
					});
				}
			};

			// ===================================================
			// 5. SearchField + FilterBar Setup
			// ===================================================
			var oBasicSearch = new sap.m.SearchField({
				width: "100%",
				search: function (oEvt) {   // triggers on Enter or search icon
					fnDoSearch(oEvt.getSource().getValue());
				}
				// Optional: add liveChange if you want instant typing search
				// liveChange: function (oEvt) {
				//     fnDoSearch(oEvt.getSource().getValue());
				// }
			});

			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				search: function () {
					fnDoSearch(oBasicSearch.getValue());
				}
			});
			oFilterBar.setBasicSearch(oBasicSearch);
			oVHD.setFilterBar(oFilterBar);

			// ===================================================
			// 6. Prefill Search with existing value (if any)
			// ===================================================
			var sPrefill = this.byId("idAccountingDocument").getValue();
			oBasicSearch.setValue(sPrefill);
			oVHD.setBasicSearchText(sPrefill);

			// ===================================================
			// 7. Attach model and open dialog
			// ===================================================
			oTable.setModel(this.getView().getModel());
			oVHD.open();
		},
		onAsnValueHelp: function () {
			var that = this;

			// ===================================================
			// 1. Define columns for Value Help
			// ===================================================
			var aCols = [
				{ label: "ASN No", path: "ASN_No", width: "12rem" },
				// { label: "Customer Name", path: "CustomerName", width: "12rem" }
			];

			// ===================================================
			// 2. Create the ValueHelpDialog
			// ===================================================
			var oVHCustomer = new ValueHelpDialog({
				title: "Select ASN",
				supportMultiselect: true,
				key: "ASN_No",            // key field
				// descriptionKey: "ASN_No", // field shown in description
				ok: function (e) {
					var aTokens = e.getParameter("tokens"); // all selected tokens
					var oMultiInput = that.byId("idAsn");

					// Remove existing tokens before adding new ones
					oMultiInput.removeAllTokens();

					// Add all selected tokens
					aTokens.forEach(function (oToken) {
						oMultiInput.addToken(new sap.m.Token({
							key: oToken.getKey(),
							text: oToken.getText()
						}));
					});

					// Fire change event with combined values (optional)
					var sCombined = aTokens.map(t => t.getKey()).join(", ");
					oMultiInput.fireChange({
						value: sCombined,
						newValue: sCombined,
						valid: true
					});

					oVHCustomer.close();
				},
				cancel: function () { oVHCustomer.close(); },
				afterClose: function () { oVHCustomer.destroy(); }
			});

			// ===================================================
			// 3. Configure Table inside ValueHelpDialog
			// ===================================================
			var oTable = oVHCustomer.getTable();
			// Build mandatory filter for DocumentType
			// var oDocTypeFilter = new sap.ui.model.Filter("BillingDocumentType", sap.ui.model.FilterOperator.EQ, sDocType);
			// Add columns and row/item binding depending on table type
			if (oTable.bindRows) {
				// Grid Table (sap.ui.table.Table)
				aCols.forEach(c => oTable.addColumn(new sap.ui.table.Column({
					label: c.label,
					template: new sap.m.Text({ text: "{" + c.path + "}" }),
					width: c.width
				})));
				oTable.bindRows({
					path: "/AsnVh",
					//  filters: [oDocTypeFilter] 
				});
			} else {
				// Responsive Table (sap.m.Table)
				aCols.forEach(c => oTable.addColumn(new sap.m.Column({
					header: new sap.m.Label({ text: c.label })
				})));
				oTable.bindItems({
					path: "/AsnVh",
					template: new sap.m.ColumnListItem({
						cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" }))
					})
				});
			}

			// ===================================================
			// 4. Central Search Function
			// ===================================================
			var fnDoSearch = function (sQuery) {
				sQuery = (sQuery || "").trim();

				var sAgg = oTable.bindRows ? "rows" : "items";
				var oBinding = oTable.getBinding(sAgg);

				if (!sQuery) {
					// Clear filters if query empty
					oBinding.filter([]);
					return;
				}

				// --- Step A: Try client-side filtering ---
				var aFilters = aCols.map(c =>
					new sap.ui.model.Filter(c.path, sap.ui.model.FilterOperator.Contains, sQuery)
				);

				// combine them with OR
				var oOrFilter = new sap.ui.model.Filter({
					filters: aFilters,
					and: false
				});

				oBinding.filter([oOrFilter], "Application");

				// --- Step B: If no results, fallback to server-side search ---
				if (oBinding.getLength() === 0) {
					var oModel = that.getView().getModel();
					// Server-side (ODataModel)
					oModel.read("/AsnVh", {
						filters: [oOrFilter],        // <-- use Filter object, not string
						urlParameters: { "$top": 200 },
						success: function (oData) {
							var oJson = new sap.ui.model.json.JSONModel({
								AsnVh: oData.results
							});
							oTable.setModel(oJson);
							// rebind to make sure busy state clears
							if (oTable.bindRows) {
								oTable.bindRows({ path: "/AsnVh" });
							} else {
								oTable.bindItems({
									path: "/AsnVh",
									template: new sap.m.ColumnListItem({
										cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" }))
									})
								});
							}
							oTable.setBusy(false);
							oVHCustomer.setBusy(false);
						},
						error: function () {
							sap.m.MessageToast.show("Server search failed");
						}
					});
				}
			};

			// ===================================================
			// 5. SearchField + FilterBar Setup
			// ===================================================
			var oBasicSearch = new sap.m.SearchField({
				width: "100%",
				search: function (oEvt) {   // triggers on Enter or search icon
					fnDoSearch(oEvt.getSource().getValue());
				}
				// Optional: add liveChange if you want instant typing search
				// liveChange: function (oEvt) {
				//     fnDoSearch(oEvt.getSource().getValue());
				// }
			});

			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				search: function () {
					fnDoSearch(oBasicSearch.getValue());
				}
			});
			oFilterBar.setBasicSearch(oBasicSearch);
			oVHCustomer.setFilterBar(oFilterBar);

			// ===================================================
			// 6. Prefill Search with existing value (if any)
			// ===================================================
			var sPrefill = this.byId("idAsn").getValue();
			oBasicSearch.setValue(sPrefill);
			oVHCustomer.setBasicSearchText(sPrefill);

			// ===================================================
			// 7. Attach model and open dialog
			// ===================================================
			oTable.setModel(this.getView().getModel());
			oVHCustomer.open();
		},
		onVendorValueHelp: function () {
			var that = this;

			// ===================================================
			// 1. Define columns for Value Help
			// ===================================================
			var aCols = [
				{ label: "Supplier", path: "Supplier", width: "12rem" },
				{ label: "Supplier Name", path: "SupplierName", width: "18rem" }
			];

			// ===================================================
			// 2. Create the ValueHelpDialog
			// ===================================================
			var oVHCustomer = new ValueHelpDialog({
				title: "Select Vendor",
				supportMultiselect: true,
				key: "Supplier",            // key field
				descriptionKey: "SupplierName", // field shown in description
				ok: function (e) {
					var aTokens = e.getParameter("tokens"); // all selected tokens
					var oMultiInput = that.byId("idVendor");

					// Remove existing tokens before adding new ones
					oMultiInput.removeAllTokens();

					// Add all selected tokens
					aTokens.forEach(function (oToken) {
						oMultiInput.addToken(new sap.m.Token({
							key: oToken.getKey(),
							text: oToken.getText()
						}));
					});

					// Fire change event with combined values (optional)
					var sCombined = aTokens.map(t => t.getKey()).join(", ");
					oMultiInput.fireChange({
						value: sCombined,
						newValue: sCombined,
						valid: true
					});

					oVHCustomer.close();
				},
				cancel: function () { oVHCustomer.close(); },
				afterClose: function () { oVHCustomer.destroy(); }
			});

			// ===================================================
			// 3. Configure Table inside ValueHelpDialog
			// ===================================================
			var oTable = oVHCustomer.getTable();
			// Build mandatory filter for DocumentType
			// var oDocTypeFilter = new sap.ui.model.Filter("BillingDocumentType", sap.ui.model.FilterOperator.EQ, sDocType);
			// Add columns and row/item binding depending on table type
			if (oTable.bindRows) {
				// Grid Table (sap.ui.table.Table)
				aCols.forEach(c => oTable.addColumn(new sap.ui.table.Column({
					label: c.label,
					template: new sap.m.Text({ text: "{" + c.path + "}" }),
					width: c.width
				})));
				oTable.bindRows({
					path: "/VendorVh",
					//  filters: [oDocTypeFilter] 
				});
			} else {
				// Responsive Table (sap.m.Table)
				aCols.forEach(c => oTable.addColumn(new sap.m.Column({
					header: new sap.m.Label({ text: c.label })
				})));
				oTable.bindItems({
					path: "/VendorVh",
					template: new sap.m.ColumnListItem({
						cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" }))
					})
				});
			}

			// ===================================================
			// 4. Central Search Function
			// ===================================================
			var fnDoSearch = function (sQuery) {
				sQuery = (sQuery || "").trim();

				var sAgg = oTable.bindRows ? "rows" : "items";
				var oBinding = oTable.getBinding(sAgg);

				if (!sQuery) {
					// Clear filters if query empty
					oBinding.filter([]);
					return;
				}

				// --- Step A: Try client-side filtering ---
				var aFilters = aCols.map(c =>
					new sap.ui.model.Filter(c.path, sap.ui.model.FilterOperator.Contains, sQuery)
				);

				// combine them with OR
				var oOrFilter = new sap.ui.model.Filter({
					filters: aFilters,
					and: false
				});

				oBinding.filter([oOrFilter], "Application");

				// --- Step B: If no results, fallback to server-side search ---
				if (oBinding.getLength() === 0) {
					var oModel = that.getOwnerComponent().getModel("vendorModel");
					// Server-side (ODataModel)
					oModel.read("/VendorVh", {
						filters: [oOrFilter],        // <-- use Filter object, not string
						urlParameters: { "$top": 200 },
						success: function (oData) {
							var oJson = new sap.ui.model.json.JSONModel({
								VendorVh: oData.results
							});
							oTable.setModel(oJson);
							// rebind to make sure busy state clears
							if (oTable.bindRows) {
								oTable.bindRows({ path: "/VendorVh" });
							} else {
								oTable.bindItems({
									path: "/VendorVh",
									template: new sap.m.ColumnListItem({
										cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" }))
									})
								});
							}
							oTable.setBusy(false);
							oVHCustomer.setBusy(false);
						},
						error: function () {
							sap.m.MessageToast.show("Server search failed");
						}
					});
				}
			};

			// ===================================================
			// 5. SearchField + FilterBar Setup
			// ===================================================
			var oBasicSearch = new sap.m.SearchField({
				width: "100%",
				search: function (oEvt) {   // triggers on Enter or search icon
					fnDoSearch(oEvt.getSource().getValue());
				}
				// Optional: add liveChange if you want instant typing search
				// liveChange: function (oEvt) {
				//     fnDoSearch(oEvt.getSource().getValue());
				// }
			});

			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				search: function () {
					fnDoSearch(oBasicSearch.getValue());
				}
			});
			oFilterBar.setBasicSearch(oBasicSearch);
			oVHCustomer.setFilterBar(oFilterBar);

			// ===================================================
			// 6. Prefill Search with existing value (if any)
			// ===================================================
			var sPrefill = this.byId("idVendor").getValue();
			oBasicSearch.setValue(sPrefill);
			oVHCustomer.setBasicSearchText(sPrefill);

			// ===================================================
			// 7. Attach model and open dialog
			// ===================================================
			oTable.setModel(this.getView().getModel());
			oVHCustomer.open();
		},
		onStatusChange: function (oEvent) {
			var oMCB = oEvent.getSource();
			var aSelectedKeys = oMCB.getSelectedKeys(); // array of keys
			console.log("Selected Status:", aSelectedKeys);

			// Example: join into comma string
			// var sJoined = aSelectedKeys.join(", ");
		},

		_loadBillingDocumentData: function (aFilters, bReset) {
			var that = this;

			if (bReset) {
				this._iPage = 0;
				this._bAllDataLoaded = false;
			}

			if (this._bAllDataLoaded) return;

			if (!this._bSkipFirstUpdate) {
				this.getView().setBusy(true);
			}

			var oModel = this.getOwnerComponent().getModel();
			var iSkip = this._iPage * this._iPageSize;

			oModel.read("/VendorQualityData", {
				urlParameters: {
					"$top": this._iPageSize,
					"$skip": iSkip,
					"$orderby": "InvoiceDate asc"
				},
				filters: aFilters || that._aCurrentFilters || [],
				success: function (oData) {
					var oListModel = that.getOwnerComponent().getModel("getListReport");

					if (bReset || !that._iPage) {
						// First page (or filter applied): reset data
						oListModel.setData(oData.results);
					} else {
						// Append data for paging
						var aExisting = oListModel.getData();
						oListModel.setData(aExisting.concat(oData.results));
					}

					// If fewer than page size → no more data
					if (oData.results.length < that._iPageSize) {
						that._bAllDataLoaded = true;
					}

					that._iPage++;
					that.getView().setBusy(false);
				},
				error: function (oError) {
					that.getView().setBusy(false);
					MessageBox.error("Failed to load Billing Document data");
					console.error("OData Error: ", oError);
				}
			});
		},

		onUpdateStartPoHeaderTable: function (oEvent) {
			if (!this._bSkipFirstUpdate) {
				// First binding, skip loading
				this._bSkipFirstUpdate = true;  // skip the first updateStarted
				return;
			}
			// Check if it's really a scroll (reason = Growing)
			if (oEvent.getParameter("reason") === "Growing" && !this._bAllDataLoaded) {
				this._loadBillingDocumentData(null, false);
			}
		},

		onFilterGo: function () {
			this.getView().setBusy(true);
			var oFilterBar = this.byId("idFilterBar"); // your filterbar id
			var oModel = this.getOwnerComponent().getModel(); // OData Model
			var aFilters = [];
			let oDateFormat = DateFormat.getInstance({
				pattern: "yyyy-MM-dd"
			});


			var oVendorInput = this.byId("idVendor").getSelectedKey();

			if (oVendorInput) { // NEW
				aFilters.push(new sap.ui.model.Filter(
					"Vendor",
					sap.ui.model.FilterOperator.Contains,
					oVendorInput
				));
			}



			this._aCurrentFilters = aFilters;

			// ====== Call OData Service ======
			this._loadBillingDocumentData(aFilters, true);
		},
		onLineItemPress: function (oEvent) {
			this.getView().setBusy(true);
			let oPressedItem = oEvent.getParameter("listItem"); // item that was pressed
			let oContext = oPressedItem.getBindingContext("getListReport"); // use your model name
			let oRowData = oContext.getObject();
			let remainData = Formatter.getCapaCountDown(oRowData.capaDate)
			if (remainData === "Expired") {
				this.getView().setBusy(false);
				MessageBox.show(`Days Expired to submit CAPA for material ${oRowData.MaterialDescription}(${oRowData.Product})`);
			} else {
				this.getOwnerComponent().getModel("selectedModel").setData(oRowData);
				this.onClickNext(); // navigate or next step
			}
		},
		onClickNext: function () {
			this.getOwnerComponent().getRouter().navTo("RouteObject"); // replace with actual route
		},
		onLiveChange: function (oEvent) {
			var sQuery = oEvent.getParameter("newValue");
			this._applySearchFilter(sQuery);
		},

		onSearch: function (oEvent) {
			var sQuery = oEvent.getParameter("query");
			this._applySearchFilter(sQuery);
		},

		_applySearchFilter: function (sQuery) {
			var oTable = this.byId("persoTable");
			var oBinding = oTable.getBinding("items");

			if (sQuery && sQuery.trim() !== "") {
				// Build OR filter for all searchable properties
				var aFilters = [
					new sap.ui.model.Filter("ASN_No", sap.ui.model.FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("InvoiceNumber", sap.ui.model.FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("PurchaseOrder", sap.ui.model.FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("Product", sap.ui.model.FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("MaterialDescription", sap.ui.model.FilterOperator.Contains, sQuery),

				];

				var oFilter = new sap.ui.model.Filter({
					filters: aFilters,
					and: false // OR across all fields
				});

				// Apply search as "Application" filter so it works with other filters
				oBinding.filter([oFilter], "Application");
			} else {
				// Clear only the search filter
				oBinding.filter([], "Application");
			}
		},
		getPlantData: function () {
			let oModel = this.getOwnerComponent().getModel("vendorModel");
			let oPlantModel = this.getView().getModel('PlantModel');
			let sUser = sap.ushell?.Container?.getUser().getId() || "CB9980000018";
			let aFilters = [new sap.ui.model.Filter("Userid", "EQ", sUser)];
			// let aFilters = [];
			let that = this;
			oModel.read("/UserIdToPlant", {
				filters: aFilters,
				urlParameters: {
					"$top": 1000,
					"$skip": 0
				},
				success: (oData) => {
					oPlantModel.setData(oData.results);
					that.getUserSupplier();
				},
				error: () => {
					sap.m.MessageToast.show("Error fetching Plants.");
				}
			});
		},
		getUserSupplier: function () {
			let sUser = sap.ushell?.Container?.getUser().getId() || "CB9980000018";
			let oSupplierModel = this.getView().getModel('SupplierModel');
			let that = this;
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("vendorModel");
				oModel.read("/supplierListByUser", {
					filters: [
						new sap.ui.model.Filter("Userid", sap.ui.model.FilterOperator.EQ, sUser)
					],
					success: function (oData) {
						console.log("Fetched supplier list:", oData.results);
						oSupplierModel.setData(oData.results);
						that.getView().byId("idVendor").setSelectedKey(oData.results[0].Supplier);
						that.byId("idVendor").setBusy(false);
						that.onFilterGo();
						resolve(oData);
					},
					error: function (oError) {
						console.error("Error fetching supplier list", oError);
						reject(oError)
					}
				});
			})

		},
	});
});