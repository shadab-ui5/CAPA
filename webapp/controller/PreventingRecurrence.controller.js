sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'hodek/capa/utils/Formatter',
    'hodek/capa/model/models',
], function (Controller, Formatter, Model) {
    "use strict";

    return Controller.extend("hodek.capa.controller.PreventingRecurrence", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');

            let oModel = new sap.ui.model.json.JSONModel({

                horizontalDeployment: [{
                    stepNumber: 1,
                    Product: "",
                    ActionDetail: "",
                    ErrorProofing: "",
                    Responsible: "",
                    When: "",
                    bButton:false
                }],

                preventiveActions: [{
                    stepNumber: 1,
                    PreventiveAction: "",
                    Target: "",
                    Actual: "",
                    Result: "",
                    Resp: "",
                    Status: "",
                    bButton:false
                }],
                dcpData: [
                    { stepNumber: 1, "qmsDocument": "PFMEA / DFMEA", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed","bButton":false },
                    { stepNumber: 2, "qmsDocument": "Control Plan", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed","bButton":false },
                    { stepNumber: 3, "qmsDocument": "SOP / WI", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed","bButton":false },
                    { stepNumber: 4, "qmsDocument": "OPL / Quality Alert", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed","bButton":false }
                ],
                qmsOptions: [
                    "Quality Management System",
                    "Safety",
                    "PFD / PFC",
                    "Process Drawing",
                    "PFMEA / DFMEA",
                    "Control Plan",
                    "SOP / WI",
                    "SOS / JES",
                    "Poka-Yoke",
                    "Firewall",
                    "IR / MISQ",
                    "OPL / Quality Alert",
                    "Tool Layout",
                    "Process Sheet / Process Mapping",
                    "Tool Life",
                    "Fixture Drawing",
                    "Gauge Drawing",
                    "IMTE / GAUGE",
                    "Cali Plan / Frequency",
                    "Packing Change",
                    "DVP & R",
                    "HEP - Reactive",
                    "HEP - Proactive",
                    "PHR - Part Handling",
                    "Acceptance Criteria",
                    "Hodek Standard",
                    "CSR",
                    "Training Plan",
                    "Skill Matrix",
                    "PM Check",
                    "Lesson Learn"
                ],
            });
            if (!oModel.getProperty("/rcaMethod")) {
                oModel.setProperty("/rcaMethod", "5Why");
            }
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RoutePreventingRecurrence").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteValCorrAction", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteValCorrAction", {}, true); // replace with actual route
        },

        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteProblemClosureSignOff", {}, true); // replace with actual route
        },

        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteValCorrAction");
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
            this._loadHorizontalDeployment();
            Model.fetchRootFields(this,"lessonlearned","/lessonLearned");
            this._loadDcpUpdation();
            this._loadPreventiveActions();
            console.log(this._sCapaId);
        },

        onAddPreventiveRow: function () {
            var oModel = this.getView().getModel("capaModel");
            var aData = oModel.getProperty("/preventiveActions") || [];
            aData.push({
                stepNumber: aData.length + 1,
                PreventiveAction: "",
                Target: "",
                Actual: "",
                Result: "",
                Resp: "",
                Status: "",
                bButton:true
            });
            oModel.setProperty("/preventiveActions", aData);
        },

        onDeletePreventiveRow: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/preventiveActions");

            let oItem = oEvent.getSource().getParent(); // ColumnListItem
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aData.splice(iIndex, 1);

            // Re-index step numbers
            aData.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/preventiveActions", aData);
        },

        onAddHorizontalRow: function () {
            var oModel = this.getView().getModel("capaModel");
            var aData = oModel.getProperty("/horizontalDeployment") || [];
            aData.push({
                stepNumber: aData.length + 1,
                Product: "",
                ActionDetail: "",
                ErrorProofing: "",
                Responsible: "",
                When: "",
                bButton:true
            });
            oModel.setProperty("/horizontalDeployment", aData);
        },

        onDeleteHorizontalRow: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/horizontalDeployment");

            let oItem = oEvent.getSource().getParent(); // ColumnListItem
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aData.splice(iIndex, 1);

            // Re-index step numbers
            aData.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/horizontalDeployment", aData);
        },

        onAddClosureRow: function () {
            var oModel = this.getView().getModel("capaModel");
            var aData = oModel.getProperty("/dcpData") || [];

            aData.push({
                stepNumber: aData.length + 1,
                qmsDocument: "",
                pIfYes: false,
                documentNo: "",
                revNoDate: "",
                resp: "",
                plannedDate: "",
                actualDate: "",
                status: "Pending",
                bButton:true
            });

            oModel.setProperty("/dcpData", aData);
        },

        onDeleteClosureRow: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/dcpData");

            let oItem = oEvent.getSource().getParent(); // ColumnListItem
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aData.splice(iIndex, 1);

            // Re-index step numbers
            aData.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/dcpData", aData);
        },

        onSave: function () {
            Model.onSaveHorizontalDeployment(this);
            Model.onSavePreventiveActions(this);
            Model.onSaveDcpUpdation(this);
            let oPayload = {
                lessonlearned: this.getView()
                    .byId("idLessonLearned")
                    .getValue()
            }
            Model.updateRootFields(this, oPayload);
        },

        _loadPreventiveActions: function () {
            const oView = this.getView();
            const oCapaModel = oView.getModel("capaModel");
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const sCapaId = this._sCapaId;

            if (!sCapaId) {
                return;
            }

            oView.setBusy(true);

            oODataModel.read("/PrevAction", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    const aResults = oData.results || [];

                    if (!aResults.length) {
                        // oCapaModel.setProperty("/preventiveActions", []);
                        oView.setBusy(false);
                        return;
                    }

                    // 🔁 Map OData → Local model
                    const aPreventiveActions = aResults
                        .map(oRow => ({
                            stepNumber: oRow.serialno,
                            PreventiveAction: oRow.preventiveactionstaken || "",
                            Target: oRow.target ? new Date(oRow.target) : null,
                            Actual: oRow.actual ? new Date(oRow.actual) : null,
                            Result: oRow.resultofaction || "",
                            Resp: oRow.resp || "",
                            status: oRow.status || "",
                            bButton:false
                        }))
                        .sort((a, b) =>
                            Number(a.serialno) - Number(b.serialno)
                        );

                    oCapaModel.setProperty("/preventiveActions", aPreventiveActions);

                    oView.setBusy(false);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load Preventive Actions");
                }
            });
        },

        _loadDcpUpdation: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oLocalModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            if (!sCapaId) {
                return;
            }

            oView.setBusy(true);

            oODataModel.read("/DcpUpdation", {
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
                        // oLocalModel.setProperty("/dcpData", []);
                        oView.setBusy(false);
                        return;
                    }

                    // 🔁 OData → Local model mapping
                    const aDcpData = aResults
                        .map(oRow => ({
                            stepNumber: oRow.serialno,
                            qmsDocument: oRow.qmsdocument || "",
                            pIfYes: oRow.pifyes === "P",          // 🔁 flag → boolean
                            documentNo: oRow.documentno || "",
                            revNoDate: oRow.revnodate || "",
                            resp: oRow.resp || "",
                            plannedDate: oRow.planneddate
                                ? new Date(oRow.planneddate)
                                : null,
                            actualDate: oRow.actualdate
                                ? new Date(oRow.actualdate)
                                : null,
                            status: oRow.status || "",
                            bButton:false
                        }))
                        // keep UI row order stable
                        .sort((a, b) => Number(a.serialno) - Number(b.serialno));

                    oLocalModel.setProperty("/dcpData", aDcpData);

                    oView.setBusy(false);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load DCP Updation data");
                }
            });
        },

        _loadHorizontalDeployment: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oLocalModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            if (!sCapaId) {
                return;
            }

            oView.setBusy(true);

            oODataModel.read("/HoDeploy", {
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
                        // oLocalModel.setProperty("/horizontalDeployment", []);
                        oView.setBusy(false);
                        return;
                    }

                    // 🔁 OData → UI mapping
                    const aHorizontal = aResults
                        .map(oRow => ({
                            stepNumber: oRow.serialno,
                            Product: oRow.productprocesssystem || "",
                            ActionDetail: oRow.actiondetail || "",
                            ErrorProofing: oRow.errorproofing || "",
                            Responsible: oRow.responsible || "",
                            When: oRow.whendate
                                ? new Date(oRow.whendate)
                                : null,
                            bButton:false
                        }))
                        // keep table order stable
                        .sort((a, b) =>
                            Number(a.serialno) - Number(b.serialno)
                        );

                    oLocalModel.setProperty("/horizontalDeployment", aHorizontal);
                    oView.setBusy(false);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error(
                        "Failed to load Horizontal Deployment data"
                    );
                }
            });
        }
    });
});