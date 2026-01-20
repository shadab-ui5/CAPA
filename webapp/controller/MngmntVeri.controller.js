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

    return Controller.extend("hodek.capa.controller.MngmntVeri", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');
            var oData = {
                capaid: "",
                head: "",
                productionchiefsign: "",
                qualitychiefmrsign: "",
                designchiefsign: "",
                processchiefsign: "",
                plantheadsign: "",
                productionchiefdate: null,
                qualitychiefmrdate: null,
                designchiefdate: null,
                processchiefdate: null,
                plantheaddate: null,
                productionchiefname: "",
                qualitychiefmrname: "",
                designchiefname: "",
                processchiefname: "",
                plantheadname: ""
            };

            var oJsonModel = new sap.ui.model.json.JSONModel(oData);
            this.getView().setModel(oJsonModel, "MngVClosure");
            let oModel = new sap.ui.model.json.JSONModel();
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteMngmntVeri").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteProblemClosureSignOff", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteProblemClosureSignOff", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteProblemClosureSignOff");
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
            this._loadMngVClosure();
            console.log(this._sCapaId);
        },

        onSave: function () {

            Model.onSaveMngVClosure(this);
        },
        _loadMngVClosure: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oJsonModel = oView.getModel("MngVClosure");
            const sCapaId = this._sCapaId;

            oView.setBusy(true);

            oODataModel.read("/MngVClosure('" + sCapaId + "')", {
                success: function (oData) {
                    oView.setBusy(false);

                    // Map OData to JSON model
                    const oMappedData = {
                        capaid: oData.capaid || "",
                        head: oData.head || "",
                        productionchiefsign: oData.productionchiefsign || "",
                        qualitychiefmrsign: oData.qualitychiefmrsign || "",
                        designchiefsign: oData.designchiefsign || "",
                        processchiefsign: oData.processchiefsign || "",
                        plantheadsign: oData.plantheadsign || "",
                        productionchiefdate: oData.productionchiefdate ? new Date(oData.productionchiefdate) : null,
                        qualitychiefmrdate: oData.qualitychiefmrdate ? new Date(oData.qualitychiefmrdate) : null,
                        designchiefdate: oData.designchiefdate ? new Date(oData.designchiefdate) : null,
                        processchiefdate: oData.processchiefdate ? new Date(oData.processchiefdate) : null,
                        plantheaddate: oData.plantheaddate ? new Date(oData.plantheaddate) : null,
                        productionchiefname: oData.productionchiefname || "",
                        qualitychiefmrname: oData.qualitychiefmrname || "",
                        designchiefname: oData.designchiefname || "",
                        processchiefname: oData.processchiefname || "",
                        plantheadname: oData.plantheadname || ""
                    };

                    oJsonModel.setData(oMappedData);
                },
                error: function (oError) {
                    oView.setBusy(false);
                    // sap.m.MessageBox.error("Failed to load Management Verification Closure data.");
                }
            });
        },
        onSubmit:function(){
            let oPayload = {
                status: "02"
            }
            Model.updateRootFields(this, oPayload);
        },
        onReject:function(){
            this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true); // replace with actual route
        }





    });
});