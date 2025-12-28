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

    return Controller.extend("hodek.capa.controller.ObjectPage", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');

            let oModel = new sap.ui.model.json.JSONModel();

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteObject").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteProblemAwareness", {}, true); // replace with actual route
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
            Model._loadCapaData(this._sCapaId, this);
            console.log(this._sCapaId);
        },

        onSave: function () {

            Model.onSaveRoot(this);
        }




    });
});