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

    return Controller.extend("hodek.capa.controller.EstablishTeam", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');

            let oModel = new sap.ui.model.json.JSONModel({
                team: [{ index: 1, name: "", isChampion: false, isLeader: false, isTeamMember: false, role: "", department: "", responsibility: "", contact: "" }],
            });
            if (!oModel.getProperty("/rcaMethod")) {
                oModel.setProperty("/rcaMethod", "5Why");
            }
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteEstablishTeam").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteProblemAwareness", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteProblemAwareness", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteProblemDefinition", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteProblemAwareness");
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
            this._loadTeamData(this._sCapaId, this);
            console.log(this._sCapaId);
        },
        onAddTeamMember: function () {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/team");
            let newIndex = aData.length + 1;
            aData.push({
                index: newIndex,
                name: "", isChampion: false, isLeader: false, isTeamMember: false,
                role: "", department: "", responsibility: "", contact: ""
            });
            oModel.setProperty("/team", aData);
        },

        onDeleteTeamMember: function (oEvent) {
            const oModel = this.getView().getModel("capaModel");

            // Get index of the row in the array
            const sPath = oEvent.getSource()
                .getBindingContext("capaModel")
                .getPath(); // e.g. "/team/1"

            const iIndex = parseInt(sPath.split("/").pop(), 10);

            const aTeam = oModel.getProperty("/team");

            // Remove the selected row
            aTeam.splice(iIndex, 1);

            // 🔁 Recalculate indexes
            aTeam.forEach(function (oItem, i) {
                oItem.index = i + 1;
            });

            // Update model
            oModel.setProperty("/team", aTeam);
        },

        onSave: function () {
            Model.onSaveTeamMembers(this);
        },
        _loadTeamData: function (sCapaId, _this) {
            const oView = _this.getView();
            const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");

            oView.setBusy(true);

            oODataModel.read("/EstabTeam", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData.results.length === 0) {
                        return;
                    }
                    const aTeam = oData.results.map(item => ({
                        index: Number(item.serialno),
                        name: item.name || "",
                        isChampion: item.champion === "X",
                        isLeader: item.leader === "X",
                        isTeamMember: item.teammember === "X",
                        role: item.role || "",
                        department: item.department || "",
                        responsibility: item.responsibilty || "",
                        contact: item.contact || ""
                    }));

                    oCapaModel.setProperty("/team", aTeam);
                },
                error: function (oError) {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load team data");
                }
            });
        }





    });
});