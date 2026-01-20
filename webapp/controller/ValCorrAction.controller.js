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

    return Controller.extend("hodek.capa.controller.ValCorrAction", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');
            let oModel = new sap.ui.model.json.JSONModel({
                validating: [
                    {
                        stepNumber: 1,
                        actionTaken: "",
                        target: "",
                        actual: "",
                        result: "",
                        responsibe: "",
                        status: "Open",
                        bButton: false
                    }
                ],
                month: [
                    { key: "1", text: "January" },
                    { key: "2", text: "February" },
                    { key: "3", text: "March" },
                    { key: "4", text: "April" },
                    { key: "5", text: "May" },
                    { key: "6", text: "June" },
                    { key: "7", text: "July" },
                    { key: "8", text: "August" },
                    { key: "9", text: "September" },
                    { key: "10", text: "October" },
                    { key: "11", text: "November" },
                    { key: "12", text: "December" }
                ],
                effectivenessData: [
                    { stepNumber: 1, Month: "", MfgQty: "", DefQty: "", Date: "", bButton: false }],

            });
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteValCorrAction").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteCorrectiveAction", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteCorrectiveAction", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RoutePreventingRecurrence", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteCorrectiveAction");
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
            this._loadValidationActions();
            this._loadCAImplementation();
            Model.fetchRootFields(this, "totaltimerequired", "/totalTimeDays");
            console.log(this._sCapaId);
        },

        onAddvalidating: function () {
            let oModel = this.getView().getModel("capaModel");
            let aActions = oModel.getProperty("/validating");
            aActions.push({
                stepNumber: aActions.length + 1,
                actionTaken: "",
                target: "",
                actual: "",
                result: "",
                responsibe: "",
                status: "Open",
                attachment: "", // will hold filename
                attachmentContent: "", // base64 content
                bButton: true
            });

            oModel.setProperty("/validating", aActions);
        },

        onDeletevalidating: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aActions = oModel.getProperty("/validating");

            let oItem = oEvent.getSource().getParent(); // Row
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aActions.splice(iIndex, 1);

            // Re-index step numbers
            aActions.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/validating", aActions);
        },

        onAddEffectivenessRow: function () {
            var oModel = this.getView().getModel("capaModel");
            var aData = oModel.getProperty("/effectivenessData") || [];

            aData.push({
                stepNumber: aData.length + 1,
                Month: "",
                MfgQty: "",
                DefQty: "",
                Date: "",
                bButton: true
            });

            oModel.setProperty("/effectivenessData", aData);
        },

        onDeleteEffectivenessRow: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/effectivenessData");

            let oItem = oEvent.getSource().getParent(); // ColumnListItem
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aData.splice(iIndex, 1);

            // Re-index step numbers
            aData.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/effectivenessData", aData);
        },
        onSave: function () {
            Model.onSaveValidationActions(this);
            Model.onSaveCAImplementation(this);
            let oPayload = {
                totaltimerequired: this.getView()
                    .byId("idRejectedAnalysisDays")
                    .getValue()
            }
            Model.updateRootFields(this, oPayload);
        },
        _loadValidationActions: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");

            const sCapaId = this._sCapaId;
            if (!sCapaId) {
                return;
            }

            oView.setBusy(true);

            oODataModel.read("/ValCorrAct", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    if (oData.results.length < 1) {
                        return;
                    }
                    const aValidating = (oData.results || []).map(oRow => ({
                        stepNumber: Number(oRow.serial),
                        actionTaken: oRow.valactiden || "",
                        target: oRow.target ? new Date(oRow.target) : null,
                        actual: oRow.actual ? new Date(oRow.actual) : null,
                        result: oRow.resodact || "",
                        responsibe: oRow.responsibility || "",
                        status: oRow.status || "",
                        bButton: false
                    }));

                    // Sort by serial to maintain UI order
                    aValidating.sort((a, b) => a.stepNumber - b.stepNumber);

                    oCapaModel.setProperty("/validating", aValidating);
                    oView.setBusy(false);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load validation actions");
                }
            });
        },
        _loadCAImplementation: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            if (!sCapaId) {
                return;
            }

            oView.setBusy(true);

            oODataModel.read("/CAImpleMon", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    const aResults = oData.results || [];

                    if (!aResults.length) {
                        oView.setBusy(false);
                        return;
                    }

                    // 🔹 Set header-level dates from first record
                    const oFirst = aResults[0];

                    oView.byId("idCaimpldate")
                        .setDateValue(oFirst.caimpdate ? new Date(oFirst.caimpdate) : null);

                    oView.byId("idEffectiveVerif")
                        .setDateValue(oFirst.effverdate ? new Date(oFirst.effverdate) : null);

                    oView.byId("idEffectiveMonitoring")
                        .setDateValue(oFirst.effectmontdate ? new Date(oFirst.effectmontdate) : null);

                    // 🔹 Map line items
                    const aEffectiveness = aResults
                        .map(oRow => ({
                            stepNumber: oRow.serial,
                            Month: oRow.monthfield || "",
                            MfgQty: oRow.mfgqty || 0,
                            DefQty: oRow.defectqty || 0,
                            Date: oRow.datefield ? new Date(oRow.datefield) : null,
                            bButton: false
                        }))
                        .sort((a, b) => Number(a.serial) - Number(b.serial));

                    oCapaModel.setProperty("/effectivenessData", aEffectiveness);

                    oView.setBusy(false);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load CA Implementation data");
                }
            });
        }






    });
});