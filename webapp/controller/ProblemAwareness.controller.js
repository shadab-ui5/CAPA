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

    return Controller.extend("hodek.capa.controller.ProblemAwareness", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');

            let oModel = new sap.ui.model.json.JSONModel();

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteProblemAwareness").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteObject", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteEstablishTeam", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteObject");
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
            this._loadProbAware(this._sCapaId, this);
            console.log(this._sCapaId);
        },

        onSave: function () {
            Model.onSaveProblemAwareness(this);
        },
        _loadProbAware: function (sCapaId, _this) {
                let oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                let oCapaModel = oView.getModel("capaModel");

                oView.setBusy(true);

                oODataModel.read(`/ProbAware('${sCapaId}')`, {
                    
                    success: (oData) => {
                        oView.setBusy(false);
                        this._mapRootDataToLocalModel(oData, _this);
                    },
                    error: (oError) => {
                        oView.setBusy(false);
                        console.log("Error loading CAPA Root: " + oError.message);
                    }
                });
            },
            _mapRootDataToLocalModel: function (oData, _this) {
                let oView = _this.getView();
                let oCapaModel = oView.getModel("capaModel");
                
                // === 1️⃣ Save snapshot for change detection ===
                this._originalCapaSnapshot = JSON.parse(JSON.stringify(oData));
                // === Root Level ===
                oCapaModel.setProperty("/problemType", oData.prob_scope || "");
                oCapaModel.setProperty("/problemSeverity", oData.prob_severity.split(",") || "");
                oCapaModel.setProperty("/problemDetails", oData.prob_detail);
                oCapaModel.setProperty("/problemSource", oData.prob_source.split(",") || "");
                oCapaModel.setProperty("/percentDefect", oData.per_defect || "");
                oCapaModel.setProperty("/ppapPpk", oData.ppap_ppk || "");
                oCapaModel.setProperty("/rpnRating", oData.rpn_rating || "");
                oCapaModel.setProperty("/presentPpkCpk", oData.present_ppkcpk || "");
                oCapaModel.setProperty("/presentPpm", oData.present_ppm || "");
                oCapaModel.setProperty("/internalAuditScore", oData.int_audit_ratingscore || "");
                oCapaModel.setProperty("/remarks", oData.remark || "");
                oCapaModel.refresh(true);
            },




    });
});