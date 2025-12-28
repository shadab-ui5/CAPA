sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageBox',
    'sap/ui/model/Filter',
    'hodek/capa/utils/Formatter',
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/unified/FileUploader",
    'hodek/capa/model/models',
], function (Controller, JSONModel, MessageBox, Filter, Formatter, FilterOperator, MessageToast, FileUploader, Model) {
    "use strict";

    return Controller.extend("hodek.capa.controller.ContainmentAction", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');

            let oModel = new sap.ui.model.json.JSONModel({
                containmentActions: [
                    {
                        rowIndex: 1,
                        immediateAction: "",
                        completion: null,
                        responsible: "",
                        breakPoint: "",
                        status: ""
                    }
                ]
            });
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteContainmentAction").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteProblemDefinition", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteRootCauseAnalysis", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteMain");
                return;
            }
            // this.getView().setBusy(true);
            this._sCapaId = oModel.getProperty("/ASN_No") + oModel.getProperty("/Product");
            this.supplier = oModel.getProperty("/Vendor");
            this.purchaseorder = oModel.getProperty("/PurchaseOrder");
            this.material = oModel.getProperty("/Product");
            this.item = oModel.getProperty("/ItemNo");
            this.asn = oModel.getProperty("/ASN_No");
            this.invoicenumber = oModel.getProperty("/InvoiceNumber");
            this.invoicedate = oModel.getProperty("/InvoiceDate");
            this._loadContainmentData();
            console.log(this._sCapaId);
        },

        // Add new containment row
        onAddContainment: function () {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/containmentActions");
            let newIndex = aData.length + 1;
            aData.push({ rowIndex: newIndex, actionId: "", description: "", responsible: "", plannedDate: null, actualDate: null, status: "" });
            oModel.setProperty("/containmentActions", aData);
        },

        // Delete containment row
        onDeleteContainment: function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext("capaModel");
            const sPath = oContext.getPath();          // e.g. "/containmentActions/1"
            const iIndex = parseInt(sPath.split("/").pop(), 10);

            const oModel = this.getView().getModel("capaModel");
            const aData = oModel.getProperty("/containmentActions");

            // Remove selected row
            aData.splice(iIndex, 1);

            // 🔁 Recalculate indexes
            aData.forEach(function (oItem, i) {
                oItem.rowIndex = i + 1;   // or oItem.srNo = i + 1 (use your actual field name)
            });

            // Update model
            oModel.setProperty("/containmentActions", aData);

            MessageToast.show("Row deleted successfully");
        },

        onSave: function () {
            Model.onSaveContainment(this);
        },
        _loadContainmentData: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            oView.setBusy(true);

            oODataModel.read("/ContActions", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData.results.length === 0) {
                        return;
                    }
                    const aContainment = oData.results.map(item => ({
                        rowIndex: Number(item.serial),
                        immediateAction: item.immediate_acttaken || "",
                        completion: item.completiondate ? new Date(item.completiondate) : null,
                        responsible: item.responsible || "",
                        breakPoint: item.breakpoint || "",
                        status: item.status || ""
                    }));

                    oCapaModel.setProperty("/containmentActions", aContainment);
                },
                error: function (oError) {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load containment actions");
                }
            });
        }




    });
});