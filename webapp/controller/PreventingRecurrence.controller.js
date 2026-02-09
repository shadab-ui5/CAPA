sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'hodek/capa/utils/Formatter',
    'hodek/capa/model/models',
    "sap/ui/model/json/JSONModel"
], function (Controller, Formatter, Model, JSONModel) {
    "use strict";

    return Controller.extend("hodek.capa.controller.PreventingRecurrence", {
        formatter: Formatter,

        onInit: function () {
            this.baseObjectStoreUrl = "https://hodek-vibration-technologies-pvt-ltd-dev-hodek-eklefds556845713.cfapps.us10-001.hana.ondemand.com/odata/v4/object-store";
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');
            this.getView().setModel(new JSONModel([]), "pendingFiles");
            let oModel = new sap.ui.model.json.JSONModel({
                horizontalDeployment: [{
                    stepNumber: 1,
                    Product: "",
                    ActionDetail: "",
                    ErrorProofing: "",
                    Responsible: "",
                    When: "",
                    bButton: false
                }],

                preventiveActions: [{
                    stepNumber: 1,
                    PreventiveAction: "",
                    Target: "",
                    Actual: "",
                    Result: "",
                    Resp: "",
                    Status: "",
                    bButton: false
                }],
                dcpData: [
                    { stepNumber: 1, "qmsDocument": "PFMEA / DFMEA", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed", "bButton": false, "selectEnable": false },
                    { stepNumber: 2, "qmsDocument": "Control Plan", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed", "bButton": false, "selectEnable": false },
                    { stepNumber: 3, "qmsDocument": "SOP / WI", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed", "bButton": false, "selectEnable": false },
                    { stepNumber: 4, "qmsDocument": "OPL / Quality Alert", "pIfYes": false, "documentNo": "", "revNoDate": "", "resp": "", "plannedDate": "", "actualDate": "", "status": "Completed", "bButton": false, "selectEnable": false }
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

            this.getView().setModel(oModel, "capaModel"); 
            oRouter.getRoute("RoutePreventingRecurrence").attachPatternMatched(this._onRouteMatched, this);
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {
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
            this._loadHorizontalDeployment();
            Model.fetchRootFields(this, "lessonlearned", "/lessonLearned");
            this._loadDcpUpdation();
            this._loadPreventiveActions();
            this.refreshFiles();
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
                bButton: true
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
                bButton: true
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
                bButton: true
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
                            bButton: false
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
                        .map((oRow, iIndex) => ({
                            stepNumber: oRow.serialno,
                            qmsDocument: oRow.qmsdocument || "",
                            pIfYes: oRow.pifyes === "P",          // flag → boolean
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
                            bButton: false,
                            selectEnable: iIndex >= 4   // ❌ first 4 false, rest true
                        }))
                        // keep UI row order stable
                        .sort((a, b) => Number(a.stepNumber) - Number(b.stepNumber));

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
                            bButton: false
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
        },
        onFileSelect: function (oEvent) {
            const oTable = oEvent.getSource();
            const aSelectedContexts = oTable.getSelectedContexts("pendingFiles"); // or your model name

            const bHasSelection = aSelectedContexts.length > 0;

            // Update RoutePoData>/attachbtn
            this.getView().getModel("selectedModel").setProperty("/attachbtndcp", bHasSelection);
        },
        onUpload: function () {
            const that = this;
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.multiple = true; // allow multiple
            fileInput.onchange = async function (e) {
                const files = Array.from(e.target.files);
                if (!files.length) return;

                const aPending = that.getView().getModel("pendingFiles").getData();
                // Validation: max 5 files total
                // if (aPending.length + files.length > 5) {
                //     MessageToast.show("You can only attach up to 5 files.");
                //     return;
                // }

                files.forEach(file => {
                    aPending.push({
                        objectName: file.name,
                        size: file.size,
                        lastModified: file.lastModified,
                        file: file, // keep raw file for later upload
                        remove:true
                    });
                });

                that.getView().getModel("pendingFiles").setData(aPending);
            };
            fileInput.click();
        },

        onDownload: async function (oEvent) {
             const oCtx = oEvent.getSource().getBindingContext("pendingFiles");
            const objectFullName = oCtx.getProperty("fullpath");
            if (!objectFullName) return;
            const res = await fetch(this.baseObjectStoreUrl + "/downloadFile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectName:objectFullName })
            });
            const data = await res.json();

            const byteCharacters = atob(data.content);
            const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray]);
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = data.objectName.split("/")[2];
            a.click();
            URL.revokeObjectURL(url);
        },

        onDelete: async function () {
            const table = this.byId("fileTable");
            const selected = table.getSelectedItem();
            if (!selected) return;

            const objectName = selected.getBindingContext("pendingFiles").getObject().fullpath;
            const res = await fetch(this.baseObjectStoreUrl + "/deleteFile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectName })
            });
            const result = await res.json();

            sap.m.MessageToast.show(result.value || "Deleted");
            this.refreshFiles();
        },
       
        /** 🔹 Formatter - file size */
        formatSize: function (iSize) {
            if (!iSize) return "0 KB";
            let sUnit = "Bytes";
            let iCalc = iSize;

            if (iSize > 1024) {
                iCalc = (iSize / 1024).toFixed(1);
                sUnit = "KB";
            }
            if (iSize > 1024 * 1024) {
                iCalc = (iSize / (1024 * 1024)).toFixed(1);
                sUnit = "MB";
            }
            return iCalc + " " + sUnit;
        },

        /** 🔹 Formatter - icon based on MIME type */
        getIconSrc: function (sFileName) {
            if (sFileName) {
                const sExt = sFileName.split(".").pop().toLowerCase();
                if (sExt === "pdf") return "sap-icon://pdf-attachment";
                if (["png", "jpg", "jpeg"].includes(sExt)) return "sap-icon://attachment-photo";
                return "sap-icon://document";
            }
            return "sap-icon://document";
        },
        onSaveFiles: async function () {
            const that = this;
            const pending = this.getView().getModel("pendingFiles").getData();

            if (!pending || pending.length === 0) {
                sap.m.MessageToast.show("No files to upload");
                return;
            }

            // Safe base64 converter (no spread operator)
            const arrayBufferToBase64 = buffer => {
                let binary = "";
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            };

            for (let fileEntry of pending) {
                const file = fileEntry.file;

                // Read file as binary
                const arrayBuffer = await file.arrayBuffer();

                // Convert safely to base64
                const base64 = arrayBufferToBase64(arrayBuffer);

                const fileName = `${this._sCapaId}/dcpFiles/${file.name}`;

                // Upload to backend
                await fetch(this.baseObjectStoreUrl + "/uploadFile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        objectName: fileName,
                        content: base64
                    })
                });
            }

            sap.m.MessageToast.show("Files uploaded");

            // Clear pending
            this.getView().getModel("pendingFiles").setData([]);

            // OPTIONAL: Refresh backend files if it does NOT call onSaveFiles()
            // await this.refreshFiles();
        },

        onRemovePendingFile: function (oEvent) {
            const oItem = oEvent.getSource().getParent(); // ColumnListItem
            const oCtx = oItem.getBindingContext("pendingFiles");
            const oData = this.getView().getModel("pendingFiles").getData();

            const index = oData.indexOf(oCtx.getObject());
            if (index > -1) {
                oData.splice(index, 1);
            }
            this.getView().getModel("pendingFiles").setData(oData);
        },
        convertToCaps: function (oEvent) {
            const oInput = oEvent.getSource();
            const value = oEvent.getParameter("value");
            const caps = value.toUpperCase();
            if (value !== caps) {
                oInput.setValue(caps);
                oInput.fireChange({ value: caps });  // Force change event
            }
        },
        refreshFiles: async function () {
            this.getView().setBusy(true);

            let url = this.baseObjectStoreUrl + "/listFiles";
            let folderName = this._sCapaId + "/dcpFiles";

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder: folderName })
            });

            const data = await res.json();

            if (!data?.value?.length) {
                this.getView().setBusy(false);
                return;
            }

            /* ==============================
               Feed data into pendingFiles
               ============================== */

            const aPending = data.value.map(file => ({
                objectName: file.objectName?.split("/")[2],
                fullpath:file.objectName,
                size: file.size || 0,
                lastModified: file.lastModified,
                file: null,
                remove:false
                 // server file, no raw File object
            }));

            const oPendingModel = this.getView().getModel("pendingFiles");
            oPendingModel.setData(aPending);
            oPendingModel.refresh(true);
            this.getView().setBusy(false);
        }


    });
});