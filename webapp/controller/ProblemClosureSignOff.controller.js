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

    return Controller.extend("hodek.capa.controller.ProblemClosureSignOff", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');

            let oModel = new sap.ui.model.json.JSONModel({

                closureData: [
                    { no: 1, phase: "Problem Definition", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 2, phase: "Containment/Short term Action", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 3, phase: "Root Cause analysis", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 4, phase: "Corrective Action", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 5, phase: "Monitoring Effectiveness of CA", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 6, phase: "Solution Confirmation", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 7, phase: "Kaizen Sheet updated", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 8, phase: "Closure", startDate: "", completion: "", teamMember: "", area: "", signOff: "" }
                ],

            });

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteProblemClosureSignOff").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RoutePreventingRecurrence", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RoutePreventingRecurrence", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMngmntVeri", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RoutePreventingRecurrence");
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
            this._loadClosure();
            console.log(this._sCapaId);
        },

        onSave: function () {

            Model.onSaveClosure(this);
        },
        _loadClosure: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            if (!sCapaId) {
                return;
            }

            oView.setBusy(true);

            oODataModel.read("/PrbClSignoff", {
                filters: [
                    new sap.ui.model.Filter(
                        "capaid",
                        sap.ui.model.FilterOperator.EQ,
                        sCapaId
                    )
                ],
                success: function (oData) {
                    const aResults = oData.results || [];

                    if (!aResults.length) {
                        // oModel.setProperty("/closureData", []);
                        oView.setBusy(false);
                        return;
                    }

                    // 🔁 OData → UI mapping
                    const aClosure = aResults
                        .sort((a, b) =>
                            Number(a.srnumber) - Number(b.srnumber)
                        )
                        .map(oRow => ({
                            no: oRow.srnumber,
                            startDate: oRow.startdate
                                ? new Date(oRow.startdate)
                                : null,
                            completion: oRow.completion || "",
                            teamMember: oRow.teammember || "",
                            area: oRow.area || "",
                            phase: oRow.phase || "",
                            signOff: oRow.signoff || ""
                        }));

                    oModel.setProperty("/closureData", aClosure);
                    oView.setBusy(false);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error(
                        "Failed to load Closure data"
                    );
                }
            });
        }





    });
});