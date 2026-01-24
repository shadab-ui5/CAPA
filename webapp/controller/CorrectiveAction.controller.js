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

    return Controller.extend("hodek.capa.controller.CorrectiveAction", {
        formatter: Formatter,

        onInit: function () {
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');
            this.baseObjectStoreUrl = "https://hodek-vibration-technologies-pvt-ltd-dev-hodek-eklefds556845713.cfapps.us10-001.hana.ondemand.com/odata/v4/object-store";
            let oModel = new sap.ui.model.json.JSONModel({

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
                        attachmentContent: "",  // base64 content,
                        objectFullName: "",
                        bButton: false
                    }
                ]
            });

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteCorrectiveAction").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteRootCauseAnalysis", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteRootCauseAnalysis", {}, true); // replace with actual route
        },

        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteValCorrAction", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteRootCauseAnalysis");
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
            this.loadCorrectiveActions();
            console.log(this._sCapaId);
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
                attachmentContent: "",
                objectFullName: "",
                bButton: true  // base64 content
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
                attachmentContent: "",  // base64 content
                objectFullName: "",
                file: "",
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
                attachmentContent: "",
                objectFullName: "",
                file: ""
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
                                            oModel.setProperty(sPath + "/file", oFile);
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

        onSave: function () {
            Model.onSaveCorrective(this);
        },
        onUploadFile: async function (oItem) {

            const oView = this.getView();
            oView.setBusy(true);

            try {
                // Safe base64 converter
                const arrayBufferToBase64 = (buffer) => {
                    let binary = "";
                    const bytes = new Uint8Array(buffer);
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary);
                };


                const oFile = oItem.file;               // File object
                const sFileName = oItem.attachment;     // File name

                if (!oFile || !sFileName) {
                    console.warn("Skipping invalid corrective item:", oItem);

                }

                // Read file
                const arrayBuffer = await oFile.arrayBuffer();
                const base64 = arrayBufferToBase64(arrayBuffer);

                const sObjectName = `${this._sCapaId}/corrective/${sFileName}#${oItem.stepNumber}`;

                const oResponse = await fetch(
                    this.baseObjectStoreUrl + "/uploadFile",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            objectName: sObjectName,
                            content: base64
                        })
                    }
                );

                if (!oResponse.ok) {
                    const sErrorText = await oResponse.text();
                    throw new Error(
                        `Upload failed for ${sFileName}: ${sErrorText}`
                    );
                }

                console.log(`Uploaded: ${sFileName}`);


                sap.m.MessageToast.show("All corrective attachments uploaded successfully");

                // Optional refresh
                this._refreshFileList?.();

            } catch (oError) {
                sap.m.MessageBox.error(
                    "File upload failed.\n" + (oError.message || oError)
                );
                console.error(oError);
            } finally {
                oView.setBusy(false);
            }
        },

        refreshFiles: async function () {
            const oView = this.getView();
            const oCapaModel = oView.getModel("capaModel");

            oView.setBusy(true);
            let that = this;
            try {
                const url = this.baseObjectStoreUrl + "/listFiles";
                const folderName = this._sCapaId + "/corrective";

                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder: folderName })
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch file list");
                }

                const data = await res.json();
                const aFiles = data?.value || [];
                console.log(aFiles)
                let aCorrective = oCapaModel.getProperty("/corrective") || [];
                aCorrective.forEach(oRow => {
                    const oLatestFile = that.getLatestAttachmentForStep(aFiles, oRow.stepNumber);

                    if (oLatestFile) {
                        oRow.attachment = oLatestFile.objectName.split("/")[2].split('#')[0];
                        oRow.attachmentContent = oLatestFile; // optional (full object)
                        oRow.objectFullName = oLatestFile.objectName
                    }
                });

                oCapaModel.setProperty("/corrective", aCorrective);

                console.log("Mapped attachments by stepNumber:", aCorrective);

            } catch (oError) {
                sap.m.MessageBox.error(
                    "Failed to refresh files.\n" + (oError.message || oError)
                );
                console.error(oError);
            } finally {
                oView.setBusy(false);
            }
        },
        loadCorrectiveActions: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oLocalModel = oView.getModel("capaModel");
            oView.setBusy(true);
            const sCapaId = this._sCapaId;
            let that = this;
            oODataModel.read("/CorrActions", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData.results.length === 0) {
                        return;
                    }
                    const aCorrective = oData.results.map(item => ({
                        stepNumber: Number(item.serial),
                        actionTaken: item.corracttrial || "",
                        target: item.target ? new Date(item.target) : "",
                        actual: item.actual ? new Date(item.actual) : "",
                        result: item.resofact || "",
                        responsibe: item.responsibility || "",
                        status: item.status || "Open",
                        attachment: "",
                        attachmentContent: "",
                        objectFullName: "",
                        bButton: false
                    }));

                    oLocalModel.setProperty("/corrective", aCorrective);
                    that.refreshFiles();


                },
                error: function (oError) {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load corrective actions");
                }
            });
        },
        getLatestAttachmentForStep: function (aFiles, stepNumber) {
            const aMatched = aFiles.filter(f =>
                f.objectName.endsWith(`#${stepNumber}`)
            );

            if (!aMatched.length) {
                return null;
            }

            return aMatched.reduce((latest, current) =>
                new Date(current.lastModified) > new Date(latest.lastModified)
                    ? current
                    : latest
            );
        },
        onDownload: async function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("capaModel");
            const objectFullName = oCtx.getProperty("objectFullName");
            const res = await fetch(this.baseObjectStoreUrl + "/downloadFile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "objectName":objectFullName })
            });
            const data = await res.json();

            const byteCharacters = atob(data.content);
            const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray]);
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = data.objectName.split('#')[0];
            a.click();
            URL.revokeObjectURL(url);
        },


    });
});