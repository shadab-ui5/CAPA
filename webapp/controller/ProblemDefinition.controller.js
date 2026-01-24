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

    return Controller.extend("hodek.capa.controller.ProblemDefinition", {
        formatter: Formatter,

        onInit: function () {
            this.baseObjectStoreUrl = "https://hodek-vibration-technologies-pvt-ltd-dev-hodek-eklefds556845713.cfapps.us10-001.hana.ondemand.com/odata/v4/object-store";
            let oSelectModel = this.getOwnerComponent().getModel('selectedModel');

            let oModel = new sap.ui.model.json.JSONModel({
                attachments: {
                    selectedRadioIndex: -1
                }
            });

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteProblemDefinition").attachPatternMatched(this._onRouteMatched, this);
            this.getView().setModel(oModel, "capaModel");
            if (!oSelectModel) {
                this.getOwnerComponent().getRouter().navTo("RouteEstablishTeam", {
                }, true);
                return;
            }
            this.getView().setModel(oSelectModel, 'selectedModel');

        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteEstablishTeam", {}, true); // replace with actual route
        },
        onNext: function () {
            this.getOwnerComponent().getRouter().navTo("RouteContainmentAction", {}, true); // replace with actual route
        },
        _onRouteMatched: function (oEvent) {
            let oModel = this.getView().getModel('selectedModel');

            if (!oModel) {
                this.getOwnerComponent().getRouter().navTo("RouteEstablishTeam");
                return;
            }
            this.getView().setBusy(true);
            this._sCapaId = oModel.getProperty("/ASN_No") + oModel.getProperty("/Product");
            this.supplier = oModel.getProperty("/Vendor");
            this.purchaseorder = oModel.getProperty("/PurchaseOrder");
            this.material = oModel.getProperty("/Product");
            this.item = oModel.getProperty("/ItemNo");
            this.asn = oModel.getProperty("/ASN_No");
            this.invoicenumber = oModel.getProperty("/InvoiceNumber");
            this.invoicedate = oModel.getProperty("/InvoiceDate");
            this.loadProblemDescriptionById();
            this.refreshFiles();
            console.log(this._sCapaId);
        },

        onSave: function () {

            Model.onSaveProblemDescription(this);
        },
        loadProblemDescriptionById: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");

            if (!this._sCapaId) {
                sap.m.MessageBox.error("CAPA ID is required to load Problem Description.");
                return;
            }

            const sPath = `/ProbDesc('${this._sCapaId}')`;
            oView.setBusy(true);

            oODataModel.read(sPath, {
                success: (oData) => {
                    // --- Feed data directly into capaModel ---
                    oCapaModel.setProperty("/details_failure", oData.details_failure || "");
                    oCapaModel.setProperty("/impact_failure", oData.impact_failure || "");
                    oCapaModel.setProperty("/failure_occurring", oData.failure_occurring || "");
                    oCapaModel.setProperty("/failure_detected", oData.failure_detected || "");
                    oCapaModel.setProperty("/failure_occur", oData.failure_occur || "");

                    oView.setBusy(false);
                },
                error: (oError) => {
                    oView.setBusy(false);

                    // 404 / not found is OK → clear fields
                    oCapaModel.setProperty("/details_failure", "");
                    oCapaModel.setProperty("/impact_failure", "");
                    oCapaModel.setProperty("/failure_occurring", "");
                    oCapaModel.setProperty("/failure_detected", "");
                    oCapaModel.setProperty("/failure_occur", "");

                    // if (oError?.statusCode !== 404) {
                    //     sap.m.MessageBox.error(
                    //         "Failed to load Problem Description: " +
                    //         (oError.message || "Unknown error")
                    //     );
                    // }
                }
            });
        },
        onUploadFile: async function () {
            const oFileUploader = this.byId("idFileUploader");
            const oFile = oFileUploader.getDomRef("fu").files[0];

            if (!oFile) {
                sap.m.MessageToast.show("Please select a file first.");
                return;
            }
            const oRBG = this.byId("rbgAttachments");
            const iSelectedIndex = oRBG.getSelectedIndex();

            const oModel = this.getView().getModel("capaModel");
            const selectionRadio = oModel.getProperty("/attachments/selectedRadioIndex");
            if (selectionRadio === -1) {
                MessageBox.show("Please select any one option before uploading file");
                return;
            }
            // Busy indicator
            this.getView().setBusy(true);

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

                // Read file
                const arrayBuffer = await oFile.arrayBuffer();
                const base64 = arrayBufferToBase64(arrayBuffer);

                const sObjectName = `${this._sCapaId}/ProblemDef/${oFile.name}#${selectionRadio}`;

                // Upload
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

                // ❌ HTTP error
                if (!oResponse.ok) {
                    const sErrorText = await oResponse.text();
                    throw new Error(sErrorText || "Upload failed");
                }

                // ✅ Success response
                const oResult = await oResponse.json();

                sap.m.MessageToast.show(
                    `File "${oFile.name}" uploaded successfully`
                );

                // Optional: refresh file list / count
                this._refreshFileList?.();

                // Optional: clear uploader
                oFileUploader.clear();

                console.log("Upload success:", oResult);

            } catch (oError) {
                sap.m.MessageBox.error(
                    "File upload failed.\n" + (oError.message || oError)
                );
                console.error(oError);
            } finally {
                this.getView().setBusy(false);
            }
        },
        refreshFiles: async function () {
            let url = this.baseObjectStoreUrl + "/listFiles";
            let folderName = this._sCapaId + "/ProblemDef";
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder: folderName })
            });
            const data = await res.json();
            console.log(data);

            let nlength = data.value.length;
            if (nlength) {
                const aFiles = data.value; // your array
                const oLatestFile = aFiles.reduce((latest, current) => {
                    return new Date(current.lastModified) > new Date(latest.lastModified)
                        ? current
                        : latest;
                });

                const oModel = this.getView().getModel("capaModel");
                oModel.setProperty("/objectFileName", oLatestFile.objectName);
                this.getView().byId('idFileUploader').setValue(oLatestFile.objectName.split('/')[2].split('#')[0] || []);
                this.getView().byId('idUploadFileText').setText(oLatestFile.objectName.split('/')[2].split('#')[0] || []);
                this.getView().byId('rbgAttachments').setSelectedIndex(parseInt(oLatestFile.objectName.split('#')[1]));
            }
            this.getView().setBusy(false);
        },
        onAttachmentSelect: function (oEvent) {
            const oRBG = oEvent.getSource();

            const iIndex = oRBG.getSelectedIndex();
            const sText = oRBG.getButtons()[iIndex].getText();

            console.log("Index:", iIndex);
            console.log("Text:", sText);

            // store safely in model if needed
            const oModel = this.getView().getModel("capaModel");
            oModel.setProperty("/attachments/selectedRadioIndex", iIndex);
            oModel.setProperty("/attachments/selectedRadioText", sText);
        },
        onDownload: async function () {
            const oModel = this.getView().getModel("capaModel");
            let objectName = oModel.getProperty("/objectFileName");

            const res = await fetch(this.baseObjectStoreUrl + "/downloadFile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectName })
            });
            const data = await res.json();

            const byteCharacters = atob(data.content);
            const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray]);
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = data.objectName.split("/")[2].split('#')[0];
            a.click();
            URL.revokeObjectURL(url);
        },






    });
});