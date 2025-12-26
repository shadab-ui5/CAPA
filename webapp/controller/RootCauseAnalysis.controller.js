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

    return Controller.extend("hodek.capa.controller.RootCauseAnalysis", {
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
            let oModel = new sap.ui.model.json.JSONModel({
                team: [{ index: 1, name: "", isChampion: false, isLeader: false, isTeamMember: false, role: "", department: "", responsibility: "", contact: "" }],
                containmentActions: [
                    {
                        rowIndex: 1,
                        immediateAction: "",
                        completion: null,
                        responsible: "",
                        breakPoint: "",
                        status: ""
                    }
                ],
                fiveWhys: [
                    {
                        stepNumber: 1,
                        cause: "",
                        definition: "",
                        why1: "",
                        why2: "",
                        why3: "",
                        why4: "",
                        why5: "",
                        contribution: ""
                    }
                ],
                fiveWhysprotect: [
                    {
                        stepNumber: 1,
                        cause: "",
                        definition: "",
                        why1: "",
                        why2: "",
                        why3: "",
                        why4: "",
                        why5: "",
                        contribution: ""
                    }
                ],
                correctiveActions: [
                    {
                        stepNumber: 1,
                        rootCause: "",
                        action: "",
                        errorProofing: "",
                        responsible: "",
                        date: ""
                    }
                ],
                corrective: [
                    {
                        stepNumber: 1,
                        actionTaken: "",
                        target: "",
                        actual: "",
                        result: "",
                        responsibe: "",
                        status: "Open",
                        attachment: "", // will hold filename
                        attachmentContent: ""  // base64 content
                    }
                ],
                validating: [
                    {
                        stepNumber: 1,
                        actionTaken: "",
                        target: "",
                        actual: "",
                        result: "",
                        responsibe: "",
                        status: "Open",
                    }
                ],
                horizontalDeployment: [{
                    stepNumber: 1,
                    Product: "",
                    ActionDetail: "",
                    ErrorProofing: "",
                    Responsible: "",
                    When: ""
                }],
                qmsDocuments: [
                    { stepNumber: 1, qmsDoc: "Control Plan", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" },
                    { stepNumber: 2, qmsDoc: "Process Sheet", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" },
                    { stepNumber: 3, qmsDoc: "Drawing/Process Flow Diagram", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" },
                    { stepNumber: 4, qmsDoc: "PFMEA/DFMEA/PPAP", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" },
                    { stepNumber: 5, qmsDoc: "Process Map", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" },
                    { stepNumber: 6, qmsDoc: "Acceptance Standard", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" },
                    { stepNumber: 7, qmsDoc: "PM Checklist", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" },
                    { stepNumber: 8, qmsDoc: "Work Instruction/Calibration Plan", ifYes: false, responsible: "", plannedDate: "", actualDate: "", status: "Open" }
                ],
                closureData: [
                    { no: 1, phase: "Problem Definition", startDate: "", completion: "", teamMember: "SV Vitkar", area: "Production", signOff: "" },
                    { no: 2, phase: "Containment/Short term Action", startDate: "", completion: "", teamMember: "AN Karanjkar", area: "QA", signOff: "" },
                    { no: 3, phase: "Root Cause analysis", startDate: "", completion: "", teamMember: "BB Suryawanshi", area: "QA", signOff: "" },
                    { no: 4, phase: "Corrective Action", startDate: "", completion: "", teamMember: "Ravi Khatal", area: "Process", signOff: "" },
                    { no: 5, phase: "Monitoring Effectiveness of CA", startDate: "", completion: "", teamMember: "SU Bhise", area: "Process", signOff: "" },
                    { no: 6, phase: "Solution Confirmation", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 7, phase: "Kaizen Sheet updated", startDate: "", completion: "", teamMember: "", area: "", signOff: "" },
                    { no: 8, phase: "Closure", startDate: "", completion: "", teamMember: "", area: "", signOff: "" }
                ],
                attachmentsList: [
                    { "text": "Photo / Sketch", "selected": false },
                    { "text": "Trend Chart", "selected": true },
                    { "text": "Pareto Analysis", "selected": false },
                    { "text": "Control Chart", "selected": false },
                    { "text": "Warranty Data", "selected": true }
                ],
                preventiveActions: [{
                    stepNumber: 1,
                    PreventiveAction: "",
                    Target: "",
                    Actual: "",
                    Result: "",
                    Resp: "",
                    Status: ""
                }],
                effectivenessData: [
                    { stepNumber: 1, Month: "", MfgQty: "", DefQty: "", Date: "" }],
                dcpData: [
                    { stepNumber: 1, "qmsDocument": "PFMEA / DFMEA", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed" },
                    { stepNumber: 2, "qmsDocument": "Control Plan", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed" },
                    { stepNumber: 3, "qmsDocument": "SOP / WI", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed" },
                    { stepNumber: 4, "qmsDocument": "OPL / Quality Alert", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed" }
                ],
                totalTimeDays: "",
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
                fishbone: [{
                    stepNumber: 1, man: "", machine: "", material: "", method: "", measurment: "", environment: ""
                }]
            });
            if (!oModel.getProperty("/rcaMethod")) {
                oModel.setProperty("/rcaMethod", "5Why");
            }
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteObject").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteContainmentAction", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');
            
        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteContainmentAction", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteCorrectiveAction", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteContainmentAction");
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
            Model._loadCapaData(this._sCapaId,this);
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
            let oModel = this.getView().getModel("capaModel");
            let sPath = oEvent.getSource().getBindingContext("capaModel").getPath();
            let aData = oModel.getProperty("/team");
            let iIndex = parseInt(sPath.split("/")[2]);
            aData.splice(iIndex, 1);
            oModel.setProperty("/team", aData);
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
            let oButton = oEvent.getSource();
            let oContext = oButton.getBindingContext("capaModel");
            let sPath = oContext.getPath();
            let iIndex = parseInt(sPath.split("/")[2], 10);
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/containmentActions");
            aData.splice(iIndex, 1);
            oModel.setProperty("/containmentActions", aData);
            MessageToast.show("Row deleted successfully");
        },

        // onAddcorrective: function () {
        //     let oModel = this.getView().getModel("capaModel");
        //     let aData = oModel.getProperty("/correctiveActions");
        //     aData.push({ actionId: "", description: "", rootCauseRef: "", responsible: "", plannedDate: "", actualDate: "", status: "", verificationMethod: "" });
        //     oModel.setProperty("/correctiveActions", aData);
        // },

        onAddPreventive: function () {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/preventiveActions");
            aData.push({ actionId: "", description: "", responsible: "", plannedDate: "", actualDate: "", status: "" });
            oModel.setProperty("/preventiveActions", aData);
        },
        onAddWhy: function () {
            let oModel = this.getView().getModel("capaModel");
            let aWhys = oModel.getProperty("/fiveWhys");

            aWhys.push({
                stepNumber: aWhys.length + 1,
                why1: "",
                why2: "",
                why3: "",
                why4: "",
                why5: "",
                contribution: ""
            });

            oModel.setProperty("/fiveWhys", aWhys);
        },
        onAddfish: function () {
            let oModel = this.getView().getModel("capaModel");
            let aWhys = oModel.getProperty("/fishbone");

            aWhys.push({
                stepNumber: aWhys.length + 1, man: "", machine: "", material: "", method: "", measurment: "", environment: ""
            });

            oModel.setProperty("/fishbone", aWhys);
        },
        onAddWhyProtect: function () {
            let oModel = this.getView().getModel("capaModel");
            let aWhys = oModel.getProperty("/fiveWhysprotect");

            aWhys.push({
                stepNumber: aWhys.length + 1,
                why1: "",
                why2: "",
                why3: "",
                why4: "",
                why5: "",
                contribution: ""
            });

            oModel.setProperty("/fiveWhysprotect", aWhys);
        },

        onDeleteWhyprotect: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aWhys = oModel.getProperty("/fiveWhysprotect");

            let oItem = oEvent.getSource().getParent(); // Row
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aWhys.splice(iIndex, 1);

            // Re-index step numbers
            aWhys.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/fiveWhysprotect", aWhys);
        },
        onDeleteWhy: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aWhys = oModel.getProperty("/fiveWhys");

            let oItem = oEvent.getSource().getParent(); // Row
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aWhys.splice(iIndex, 1);

            // Re-index step numbers
            aWhys.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/fiveWhys", aWhys);
        },
        onDeletefish: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aWhys = oModel.getProperty("/fishbone");

            let oItem = oEvent.getSource().getParent(); // Row
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aWhys.splice(iIndex, 1);

            // Re-index step numbers
            aWhys.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/fishbone", aWhys);
        },
        onAddCorrective: function () {
            let oModel = this.getView().getModel("capaModel");
            let aActions = oModel.getProperty("/corrective");
            aActions.push({
                stepNumber: aActions.length + 1,
                actionTaken: "",
                target: "",
                actual: "",
                result: "",
                responsibe: "",
                status: "Open",
                attachment: "", // will hold filename
                attachmentContent: ""  // base64 content
            });

            oModel.setProperty("/corrective", aActions);
        },

        onDeleteCorrective: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aActions = oModel.getProperty("/corrective");

            let oItem = oEvent.getSource().getParent(); // Row
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aActions.splice(iIndex, 1);

            // Re-index step numbers
            aActions.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/corrective", aActions);
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
                attachmentContent: ""  // base64 content
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
        onAddMonitoring: function () {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/monitoring");

            aData.push({
                stepNumber: aData.length + 1,
                actionTaken: "",
                target: "",
                actual: "",
                result: "",
                reviewDate: "",
                status: "Open",
                attachment: "",
                attachmentContent: ""
            });

            oModel.setProperty("/monitoring", aData);
        },

        onDeleteMonitoring: function (oEvent) {
            let oModel = this.getView().getModel("capaModel");
            let aData = oModel.getProperty("/monitoring");

            let oItem = oEvent.getSource().getParent().getParent(); // HBox → Row
            let oContext = oItem.getBindingContext("capaModel");
            let iIndex = oContext.getPath().split("/").pop();

            aData.splice(iIndex, 1);

            // Re-index step numbers
            aData.forEach((e, i) => e.stepNumber = i + 1);

            oModel.setProperty("/monitoring", aData);
        },

        onUploadFilePress: function (oEvent) {
            let that = this;

            // Get the row context of the clicked row
            let oRow = oEvent.getSource().getParent().getParent(); // HBox → ColumnListItem
            let oRowContext = oRow.getBindingContext("capaModel");

            // Create dialog once
            if (!this._oUploadDialog) {
                this._oUploadDialog = new sap.m.Dialog({
                    title: "Upload Attachment",
                    content: [
                        new sap.m.HBox({
                            justifyContent: "Center",
                            items: [
                                new FileUploader("fileUploader", {
                                    name: "uploadFile",
                                    uploadUrl: "/upload",
                                    change: function (oFileEvent) {
                                        let oFile = oFileEvent.getParameter("files")[0];
                                        if (!oFile) return;

                                        // Always get current row context from the FileUploader's stored property
                                        let oContext = this.data("rowContext");
                                        let sPath = oContext.getPath();
                                        let oModel = oContext.getModel("capaModel");

                                        let reader = new FileReader();
                                        reader.onload = function (e) {
                                            let sBase64 = e.target.result.split(",")[1];
                                            oModel.setProperty(sPath + "/attachment", oFile.name);
                                            oModel.setProperty(sPath + "/attachmentContent", sBase64);
                                        };
                                        reader.readAsDataURL(oFile);
                                    }
                                })
                            ]
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "OK",
                        press: function () {
                            let oUploader = sap.ui.getCore().byId("fileUploader");
                            if (oUploader) oUploader.setValue("");
                            that._oUploadDialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            let oUploader = sap.ui.getCore().byId("fileUploader");
                            if (oUploader) oUploader.setValue("");
                            that._oUploadDialog.close();
                        }
                    })
                });
                this.getView().addDependent(this._oUploadDialog);
            }

            // ✅ Store the current row context on the uploader every time
            let oUploader = sap.ui.getCore().byId("fileUploader");
            oUploader.data("rowContext", oRowContext);
            oUploader.setValue(""); // clear previous selection

            this._oUploadDialog.open();
        },
        // onAddPreventive: function () {
        //     let oModel = this.getView().getModel("capaModel");
        //     let aData = oModel.getProperty("/preventiveActions") || [];

        //     aData.push({
        //         stepNumber: aData.length + 1,
        //         process: "",
        //         preventiveAction: "",
        //         errorProofing: "",
        //         actionDate: ""
        //     });

        //     oModel.setProperty("/preventiveActions", aData);
        // },

        // onDeletePreventive: function (oEvent) {
        //     let oModel = this.getView().getModel("capaModel");
        //     let aData = oModel.getProperty("/preventiveActions");

        //     let oItem = oEvent.getSource().getParent(); // ColumnListItem
        //     let oContext = oItem.getBindingContext("capaModel");
        //     let iIndex = oContext.getPath().split("/").pop();

        //     aData.splice(iIndex, 1);

        //     // Re-index step numbers
        //     aData.forEach((e, i) => e.stepNumber = i + 1);

        //     oModel.setProperty("/preventiveActions", aData);
        // },


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
                Status: ""
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
                When: ""
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
        onAddEffectivenessRow: function () {
            var oModel = this.getView().getModel("capaModel");
            var aData = oModel.getProperty("/effectivenessData") || [];

            aData.push({
                stepNumber: aData.length + 1,
                Month: "",
                MfgQty: "",
                DefQty: "",
                Date: ""
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
                status: "Pending"
            });

            oModel.setProperty("/dcpData", aData);
        },

        onDeleteClosureRow: function () {
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

            Model.onSaveRoot(this);
        }




    });
});