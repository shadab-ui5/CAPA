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
                team: [{ index: 1, name: "", isChampion: false, isLeader: false, isTeamMember: false, role: "", department: "", responsibility: "", contact: "",bButton:false}],
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
                role: "", department: "", responsibility: "", contact: "",bButton:true
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
        // onDeleteTeamMember: function (oEvent) {
        //     const oView = this.getView();
        //     const oLocalModel = oView.getModel("capaModel");
        //     const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");

        //     const sCapaId = this._sCapaId;
        //     if (!sCapaId) {
        //         sap.m.MessageBox.error("CAPA ID is mandatory.");
        //         return;
        //     }

        //     // ===============================
        //     // 1. Get selected row context
        //     // ===============================
        //     const oCtx = oEvent.getSource().getBindingContext("capaModel");
        //     const sPath = oCtx.getPath();              // e.g. /team/1
        //     const iIndex = parseInt(sPath.split("/").pop(), 10);

        //     const aTeam = oLocalModel.getProperty("/team") || [];
        //     const oRow = aTeam[iIndex];

        //     if (!oRow) {
        //         return;
        //     }

        //     // Serial no based on position (same logic as save)
        //     const sSerialNo = String(iIndex + 1).padStart(2, "0");

        //     // ===============================
        //     // 2. Backend delete
        //     // ===============================
        //     const sKeyPath = oODataModel.createKey("/EstabTeam", {
        //         capaid: sCapaId,
        //         serialno: sSerialNo
        //     });

        //     sap.m.MessageBox.confirm("Do you want to delete this team member?", {
        //         onClose: (sAction) => {
        //             if (sAction !== sap.m.MessageBox.Action.OK) {
        //                 return;
        //             }

        //             oView.setBusy(true);

        //             oODataModel.remove(sKeyPath, {
        //                 success: () => {

        //                     // ===============================
        //                     // 3. Remove from local model
        //                     // ===============================
        //                     aTeam.splice(iIndex, 1);

        //                     // Recalculate serial/index
        //                     aTeam.forEach((oItem, i) => {
        //                         oItem.index = i + 1;
        //                     });

        //                     oLocalModel.setProperty("/team", aTeam);

        //                     sap.m.MessageToast.show("Team member deleted successfully");
        //                     oView.setBusy(false)
        //                     oODataModel.refresh(true);
        //                 },
        //                 error: (oError) => {
        //                     let sMsg = "Error while deleting team member";
        //                     try {
        //                         const oErr = JSON.parse(oError.responseText);
        //                         sMsg = oErr?.error?.message?.value || sMsg;
        //                     } catch (e) { }
        //                     oView.setBusy(false)
        //                     sap.m.MessageBox.error(sMsg);
        //                 },
        //             });
        //         }
        //     });
        // },

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
                        contact: item.contact || "",
                        bButton:false
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