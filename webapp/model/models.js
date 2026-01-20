sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    'hodek/capa/utils/Formatter',
],
    function (JSONModel, Device, Formatter) {
        "use strict";
        this.baseObjectStoreUrl = "https://hodek-vibration-technologies-pvt-ltd-dev-hodek-eklefds556845713.cfapps.us10-001.hana.ondemand.com/odata/v4/object-store";
        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            createDeviceModel: function () {
                let oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },

            onSaveContainment: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");

                const aContainments = oLocalModel.getProperty("/containmentActions") || [];
                const sCapaId = _this._sCapaId;

                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory before saving containment actions.");
                    return;
                }

                if (!aContainments.length) {
                    sap.m.MessageToast.show("No containment actions to save.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aContainments.map((item, index) => {

                    const sSerial = String(index + 1).padStart(2, "0");

                    const oPayload = {
                        capaid: sCapaId,
                        serial: sSerial,
                        supplier: _this.supplier || "",
                        purchaseorder: _this.purchaseorder || "",
                        material: _this.material || "",
                        item: _this.item || "",
                        asn: _this.asn || "",
                        invoicenumber: _this.invoicenumber || "",
                        invoicedate: _this.invoicedate ? new Date(_this.invoicedate) : null,
                        immediate_acttaken: item.immediateAction || "",
                        completiondate: item.completion ? new Date(item.completion) : null,
                        responsible: item.responsible || "",
                        breakpoint: item.breakPoint || "",
                        status: item.status || ""
                    };

                    // 🔑 Safe composite key
                    const sKeyPath = oODataModel.createKey("/ContActions", {
                        capaid: sCapaId,
                        serial: sSerial
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty read → CREATE
                                    oODataModel.create("/ContActions", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {

                                const sStatus = String(oError.statusCode);

                                // ➕ Not Found → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/ContActions", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} containment actions saved, ${iFail} failed`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveCorrective: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory before saving corrective actions.");
                    return;
                }

                const aCorrective = oLocalModel.getProperty("/corrective") || [];
                if (!aCorrective.length) {
                    sap.m.MessageToast.show("No corrective actions to save.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aCorrective.map((oRow, iIndex) => {

                    const sSerial = String(iIndex + 1).padStart(2, "0");

                    const oPayload = {
                        capaid: sCapaId,
                        serial: sSerial,

                        supplier: _this.supplier || "",
                        purchaseorder: _this.purchaseorder || "",
                        material: _this.material || "",
                        item: _this.item || "",
                        asn: _this.asn || "",
                        invoicenumber: _this.invoicenumber || "",
                        invoicedate: _this.invoicedate || null,

                        corracttrial: oRow.actionTaken || "",
                        target: oRow.target ? new Date(oRow.target) : null,
                        actual: oRow.actual ? new Date(oRow.actual) : null,
                        resofact: oRow.result || "",
                        responsibility: oRow.responsibe || "",
                        status: oRow.status || ""
                    };

                    const sKeyPath = oODataModel.createKey("/CorrActions", {
                        capaid: sCapaId,
                        serial: sSerial
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty response → CREATE
                                    oODataModel.create("/CorrActions", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {

                                const sStatus = String(oError.statusCode);

                                // ➕ Not found → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/CorrActions", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} corrective actions saved, ${iFail} failed`);

                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveDcpUpdation: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");
                const aDcpData = oLocalModel.getProperty("/dcpData") || [];

                if (aDcpData.length < 4) {
                    sap.m.MessageToast.show("Must have 4 mandat options!!");
                    return;
                }

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aDcpData.map((oRow, i) => {

                    // 🔑 Composite key
                    const sSerialNo = String(i + 1).padStart(2, "0");

                    const oPayload = {
                        capaid: sCapaId,
                        serialno: sSerialNo,

                        // supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,

                        // === UI → OData mapping ===
                        qmsdocument: oRow.qmsDocument || "",
                        pifyes: oRow.pIfYes ? "P" : "",
                        documentno: oRow.documentNo || "",
                        revnodate: oRow.revNoDate || "",
                        resp: oRow.resp || "",
                        planneddate: oRow.plannedDate ? new Date(oRow.plannedDate) : null,
                        actualdate: oRow.actualDate ? new Date(oRow.actualDate) : null,
                        status: oRow.status || ""
                    };

                    // 🔑 Build key path
                    const sKeyPath = oODataModel.createKey("/DcpUpdation", {
                        capaid: oPayload.capaid,
                        serialno: oPayload.serialno
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty response → CREATE
                                    oODataModel.create("/DcpUpdation", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {
                                const sStatus = String(oError.statusCode);

                                // ➕ 404 → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/DcpUpdation", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} saved, ${iFail} failed`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveHorizontalDeployment: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");
                const aHorizontal = oLocalModel.getProperty("/horizontalDeployment") || [];

                if (!aHorizontal.length) {
                    sap.m.MessageToast.show("No Horizontal Deployment data to save.");
                    return;
                }

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aHorizontal.map((oRow, i) => {

                    // 🔑 Composite key
                    const sSerialNo = String(i + 1).padStart(2, "0");

                    const oPayload = {
                        capaid: sCapaId,
                        serialno: sSerialNo,

                        // supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,

                        productprocesssystem: oRow.Product || "",
                        actiondetail: oRow.ActionDetail || "",
                        errorproofing: oRow.ErrorProofing || "",
                        responsible: oRow.Responsible || "",
                        whendate: oRow.When ? new Date(oRow.When) : null
                    };

                    // 🔑 Build key path
                    const sKeyPath = oODataModel.createKey("/HoDeploy", {
                        capaid: oPayload.capaid,
                        serialno: oPayload.serialno
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty response → CREATE
                                    oODataModel.create("/HoDeploy", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {
                                const sStatus = String(oError.statusCode);

                                // ➕ Not Found → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/HoDeploy", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} saved, ${iFail} failed`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveTeamMembers: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");
                const aTeam = oLocalModel.getProperty("/team") || [];

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory before saving team members.");
                    return;
                }

                if (!aTeam.length) {
                    sap.m.MessageToast.show("No team data to save.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aTeam.map((oRow, iIndex) => {

                    const sSerialNo = String(iIndex + 1).padStart(2, "0");

                    const oPayload = {
                        capaid: sCapaId,
                        serialno: sSerialNo,
                        supplier: _this.supplier || "",
                        purchaseorder: _this.purchaseorder || "",
                        material: _this.material || "",
                        item: _this.item || "",
                        asn: _this.asn || "",
                        invoicenumber: _this.invoicenumber || "",
                        invoicedate: _this.invoicedate || null,

                        name: oRow.name || "",
                        champion: oRow.isChampion ? "X" : "",
                        leader: oRow.isLeader ? "X" : "",
                        teammember: oRow.isTeamMember ? "X" : "",
                        role: oRow.role || "",
                        department: oRow.department || "",
                        responsibilty: oRow.responsibility || "",
                        contact: oRow.contact || ""
                    };

                    const sKeyPath = oODataModel.createKey("/EstabTeam", {
                        capaid: sCapaId,
                        serialno: sSerialNo
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty read → CREATE
                                    oODataModel.create("/EstabTeam", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {

                                const sStatus = String(oError.statusCode);

                                // ➕ Not found → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/EstabTeam", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} team members saved, ${iFail} failed`);

                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveMngVClosure: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oMngVClosure = oView.getModel("MngVClosure").getData();

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory before saving Management Verification Closure.");
                    return;
                }

                const commData = {
                    capaid: sCapaId,
                    supplier: _this.supplier,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate
                };

                const oPayload = {
                    ...oMngVClosure,
                    ...commData
                };

                oView.setBusy(true);

                const sKeyPath = oODataModel.createKey("/MngVClosure", {
                    capaid: sCapaId
                });

                // Check if record exists
                oODataModel.read(sKeyPath, {
                    success: function (oData) {
                        // Exists → UPDATE
                        oODataModel.update(sKeyPath, oPayload, {
                            success: function () {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("Management Verification Closure updated successfully!");
                            },
                            error: function (oError) {
                                sap.m.MessageBox.error("Error updating Management Verification Closure");
                                oView.setBusy(false);
                                console.error(oError);
                            },

                        });
                    },
                    error: function (oError) {
                        if (String(oError.statusCode) === "404") {
                            // Not found → CREATE
                            oODataModel.create("/MngVClosure", oPayload, {
                                success: function () {
                                    oView.setBusy(false);
                                    sap.m.MessageToast.show("Management Verification Closure saved successfully!");
                                },
                                error: function (oError) {
                                    sap.m.MessageBox.error("Error saving Management Verification Closure");
                                    oView.setBusy(false);
                                    console.error(oError);
                                },
                            });
                        } else {
                            oView.setBusy(false);
                            sap.m.MessageBox.error("Error reading Management Verification Closure");
                            console.error(oError);
                        }
                    }
                });
            },

            onSaveClosure: function (_this) {
                const oView = _this.getView();
                const oModel = oView.getModel("capaModel");
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");

                const aClosureData = oModel.getProperty("/closureData") || [];

                if (!aClosureData.length) {
                    sap.m.MessageToast.show("No Closure data to save.");
                    return;
                }

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory.");
                    return;
                }

                const oHeaderData = {
                    capaid: sCapaId,
                    supplier: _this.supplier,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate
                };

                oView.setBusy(true);

                const aPromises = aClosureData.map((entry, index) => {

                    // 🔑 Composite key
                    const sSrNumber = String(index + 1).padStart(2, "0");

                    const oPayload = {
                        ...oHeaderData,
                        srnumber: sSrNumber,
                        serialno: sSrNumber,
                        startdate: entry.startDate ? new Date(entry.startDate) : null,
                        completion: entry.completion ? new Date(entry.completion) : null,
                        teammember: entry.teamMember || "",
                        area: entry.area || "",
                        phase: entry.phase || "",
                        signoff: entry.signOff || ""
                    };

                    // 🔑 Build key path
                    const sKeyPath = oODataModel.createKey("/PrbClSignoff", {
                        capaid: oPayload.capaid,
                        serialno: oPayload.srnumber
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty response → CREATE
                                    oODataModel.create("/PrbClSignoff", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {
                                const sStatus = String(
                                    oError.statusCode || oError.response?.statusCode || ""
                                );

                                // ➕ 404 → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/PrbClSignoff", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} saved, ${iFail} failed`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSavePreventiveActions: function (_this) {
                const oView = _this.getView();
                const oCapaModel = oView.getModel("capaModel");
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");

                const aPreventiveActions = oCapaModel.getProperty("/preventiveActions") || [];

                if (!aPreventiveActions.length) {
                    sap.m.MessageToast.show("No Preventive Actions data to save.");
                    return;
                }

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory.");
                    return;
                }

                const oHeaderData = {
                    capaid: sCapaId,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate
                };

                oView.setBusy(true);

                const aPromises = aPreventiveActions.map((entry, index) => {

                    // 🔑 Composite key
                    const sSerialNo = String(index + 1).padStart(2, "0");

                    const oPayload = {
                        ...oHeaderData,
                        serialno: sSerialNo,

                        preventiveactionstaken: entry.PreventiveAction || "",
                        target: entry.Target ? new Date(entry.Target) : null,
                        actual: entry.Actual ? new Date(entry.Actual) : null,
                        resultofaction: entry.Result || "",
                        resp: entry.Resp || "",
                        status: entry.status || ""
                    };

                    // 🔑 Key path
                    const sKeyPath = oODataModel.createKey("/PrevAction", {
                        capaid: oPayload.capaid,
                        serialno: oPayload.serialno
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty response → CREATE
                                    oODataModel.create("/PrevAction", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {
                                const sStatus = String(oError.statusCode);

                                // ➕ 404 → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/PrevAction", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} saved, ${iFail} failed`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveProblemAwareness: function (_this) {
                let oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                let oCapaModel = oView.getModel("capaModel");  // local JSON model that your XML mostly binds to

                // --- Read simple bound fields from capaModel ---
                let sProbScope = oCapaModel.getProperty("/problemType") || "";
                let sProbDetail = oCapaModel.getProperty("/problemDetails") || "";
                let sPercentDefect = oCapaModel.getProperty("/percentDefect") || "";
                let sPpapPpk = oCapaModel.getProperty("/ppapPpk") || "";
                let sRpnRating = oCapaModel.getProperty("/rpnRating") || "";
                let sPresentPpkCpk = oCapaModel.getProperty("/presentPpkCpk") || "";
                let sPresentPpm = oCapaModel.getProperty("/presentPpm") || "";
                let sInternalAuditScore = oCapaModel.getProperty("/internalAuditScore") || "";
                let sRemarks = oCapaModel.getProperty("/remarks") || "";

                // --- MultiComboBox: Problem Severity (control id _IDGenMultiComboBox may or may not be bound) ---
                let aSeverityKeys = [];
                let oSeverityControl = _this.byId("_IDGenMultiComboBox");
                if (oSeverityControl && typeof oSeverityControl.getSelectedKeys === "function") {
                    aSeverityKeys = oSeverityControl.getSelectedKeys() || [];
                } else {
                    // fallback to model (if you stored it there)
                    aSeverityKeys = oCapaModel.getProperty("/problemSeverity") || [];
                }
                // join selected keys into a string acceptable to OData (adjust separator if backend expects something else)
                let sProbSeverity = Array.isArray(aSeverityKeys) ? aSeverityKeys.join(",") : String(aSeverityKeys || "");

                // --- MultiComboBox: Problem Source (control id _IDGenMultiComboBox1 is bound in your XML) ---
                let aSourceKeys = [];
                let oSourceControl = _this.byId("_IDGenMultiComboBox1");
                if (oSourceControl && typeof oSourceControl.getSelectedKeys === "function") {
                    aSourceKeys = oSourceControl.getSelectedKeys() || [];
                } else {
                    aSourceKeys = oCapaModel.getProperty("/problemSource") || [];
                }
                let sProbSource = Array.isArray(aSourceKeys) ? aSourceKeys.join(",") : String(aSourceKeys || "");

                // --- Header/context values (use controller properties or fallback to capaModel) ---
                let sCapaId = _this._sCapaId || "CAPA001";
                let sSupplier = _this.supplier || "";
                let sPurchaseOrder = _this.purchaseorder || "";
                let sMaterial = _this.material || "";
                let sItem = _this.item || "";
                let sAsn = _this.asn || "";
                let sInvoiceNumber = _this.invoicenumber || "";
                let sInvoiceDate = _this.invoicedate || null;

                // --- Build final payload matching ProbAwareType metadata ---
                let oPayload = {
                    capaid: sCapaId,
                    supplier: sSupplier,
                    purchaseorder: sPurchaseOrder,
                    material: sMaterial,
                    item: sItem,
                    asn: sAsn,
                    invoicenumber: sInvoiceNumber,
                    invoicedate: sInvoiceDate ? new Date(sInvoiceDate) : null,

                    // problem-awareness specific fields
                    prob_scope: sProbScope,
                    prob_severity: sProbSeverity,
                    prob_detail: sProbDetail,
                    prob_source: sProbSource,
                    per_defect: String(sPercentDefect),
                    ppap_ppk: String(sPpapPpk),
                    rpn_rating: String(sRpnRating),
                    present_ppkcpk: String(sPresentPpkCpk),
                    present_ppm: String(sPresentPpm),
                    int_audit_ratingscore: String(sInternalAuditScore),
                    remark: sRemarks
                };

                // Optional: remove empty/null fields to keep payload small (uncomment if desired)
                // Object.keys(oPayload).forEach(function(k) { if (oPayload[k] === "" || oPayload[k] === null || oPayload[k] === undefined) delete oPayload[k]; });

                // --- Create in OData ---

                oView.setBusy(true);
                const sPath = `/ProbAware('${sCapaId}')`;
                let that = this;
                oODataModel.read(sPath, {
                    success: () => {
                        // Record exists → call update method
                        that.updateCall(sPath, oPayload, _this);
                    },
                    error: () => {
                        // Record not found → create new record
                        oODataModel.create("/ProbAware", oPayload, {
                            success: () => {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("Prob Aware created successfully!");
                            },
                            error: (oError) => {
                                oView.setBusy(false);
                                sap.m.MessageBox.error("Error creating Prob Aware : " + oError.message);
                            }
                        });
                    }
                });

            },

            onSaveCAImplementation: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oCapaModel = oView.getModel("capaModel");

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory.");
                    return;
                }

                const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "yyyy-MM-dd'T'00:00:00"
                });

                const sCAImplDate = oView.byId("idCaimpldate").getDateValue();
                const sEffVerDate = oView.byId("idEffectiveVerif").getDateValue();
                const sEffMonDate = oView.byId("idEffectiveMonitoring").getDateValue();

                const sCAImplISO = sCAImplDate ? oDateFormat.format(sCAImplDate) : null;
                const sEffVerISO = sEffVerDate ? oDateFormat.format(sEffVerDate) : null;
                const sEffMonISO = sEffMonDate ? oDateFormat.format(sEffMonDate) : null;

                const aData = oCapaModel.getProperty("/effectivenessData") || [];
                const oMonth = oCapaModel.getProperty("/month") || [];
                if (!aData.length) {
                    sap.m.MessageToast.show("No effectiveness data to save.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aData.map((item, index) => {

                    const sSerial = String(index + 1).padStart(2, "0");

                    const oPayload = {
                        capaid: sCapaId,
                        serial: sSerial,
                        supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,
                        effverdate: sEffVerISO,
                        caimpdate: sCAImplISO,
                        effectmontdate: sEffMonISO,
                        monthfield: oCapaModel.getProperty("/month/" + item.Month).text || "",
                        mfgqty: parseFloat(item.DefQty).toFixed(2) || 0,
                        defectqty: parseFloat(item.DefQty).toFixed(2) || 0,
                        datefield: item.Date ? oDateFormat.format(new Date(item.Date)) : null
                    };

                    const sKeyPath = oODataModel.createKey("/CAImpleMon", {
                        capaid: sCapaId,
                        serial: sSerial
                    });

                    return new Promise((resolve, reject) => {
                        oODataModel.read(sKeyPath, {
                            success: function (oData) {
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    oODataModel.create("/CAImpleMon", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {
                                if (String(oError.statusCode) === "404") {
                                    oODataModel.create("/CAImpleMon", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then(results => {
                        const iOk = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;
                        sap.m.MessageToast.show(`${iOk} saved, ${iFail} failed`);
                        oODataModel.refresh(true);
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveValidationActions: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oCapaModel = oView.getModel("capaModel");

                const sCapaId = _this._sCapaId;
                if (!sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory.");
                    return;
                }

                const aValidating = oCapaModel.getProperty("/validating") || [];
                if (!aValidating.length) {
                    sap.m.MessageToast.show("No validation data to save.");
                    return;
                }

                const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "yyyy-MM-dd'T'00:00:00"
                });

                oView.setBusy(true);

                const aPromises = aValidating.map((oRow, index) => {

                    const sSerial = String(index + 1).padStart(2, "0");

                    const oPayload = {
                        capaid: sCapaId,
                        serial: sSerial,
                        valactiden: oRow.actionTaken || "",
                        target: oRow.target ? oDateFormat.format(new Date(oRow.target)) : null,
                        actual: oRow.actual ? oDateFormat.format(new Date(oRow.actual)) : null,
                        resodact: oRow.result || "",
                        responsibility: oRow.responsibe || "",
                        status: oRow.status || ""
                    };

                    const sKeyPath = oODataModel.createKey("/ValCorrAct", {
                        capaid: sCapaId,
                        serial: sSerial
                    });

                    return new Promise((resolve, reject) => {
                        oODataModel.read(sKeyPath, {
                            success: function (oData) {
                                // 🔁 Exists or empty response → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty read treated as NOT FOUND
                                    oODataModel.create("/ValCorrAct", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {
                                if (String(oError.statusCode) === "404") {
                                    oODataModel.create("/ValCorrAct", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then(results => {
                        const iOk = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;
                        sap.m.MessageToast.show(`${iOk} saved, ${iFail} failed`);
                        oODataModel.refresh(true);
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveFish: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const aFishboneData = oView.getModel("capaModel").getProperty("/fishbone");

                if (!aFishboneData || !aFishboneData.length) {
                    sap.m.MessageToast.show("No Fishbone data to save.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aFishboneData.map((oItem) => {

                    if (!oItem.stepNumber) {
                        return Promise.reject("Missing stepNumber (cause)");
                    }

                    const oPayload = {
                        capaid: _this._sCapaId,
                        cause: String(oItem.stepNumber),
                        supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,
                        man: oItem.man || "",
                        machine: oItem.machine || "",
                        materialfield: oItem.material || "",
                        method: oItem.method || "",
                        environment: oItem.environment || "",
                        measurement: oItem.measurment || oItem.measurement || ""
                    };

                    const sKeyPath = oODataModel.createKey("/WhyFishbone", {
                        capaid: oPayload.capaid,
                        cause: oPayload.cause
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 If entity exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Treat empty response as NOT FOUND
                                    oODataModel.create("/WhyFishbone", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {

                                const sStatus = String(oError.statusCode);

                                if (sStatus === "404") {
                                    // ➕ CREATE
                                    oODataModel.create("/WhyFishbone", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;
                        sap.m.MessageToast.show(`${iSuccess} saved, ${iFail} failed`);
                        oODataModel.refresh(true);
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveFiveWhy: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const aFiveWhys = oView.getModel("capaModel").getProperty("/fiveWhys");

                if (!aFiveWhys || !aFiveWhys.length) {
                    sap.m.MessageToast.show("No 5-Why data available to save.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aFiveWhys.map((oRow) => {

                    // 🔒 Mandatory key check (same as Fishbone)
                    if (!oRow.stepNumber) {
                        return Promise.reject("Missing stepNumber (cause)");
                    }

                    const oPayload = {
                        capaid: _this._sCapaId,
                        cause: String(oRow.stepNumber),     // 🔑 composite key
                        supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,
                        probablecause: oRow.cause || "",
                        problemdef: oRow.definition || "",
                        onewhy: oRow.why1 || "",
                        twowhy: oRow.why2 || "",
                        threewhy: oRow.why3 || "",
                        fourwhy: oRow.why4 || "",
                        fivewhy: oRow.why5 || "",
                        percontribution: oRow.contribution || ""
                    };

                    // 🔑 Build composite key path
                    const sKeyPath = oODataModel.createKey("/WhyPrevent", {
                        capaid: oPayload.capaid,
                        cause: oPayload.cause
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty response → CREATE
                                    oODataModel.create("/WhyPrevent", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {

                                const sStatus = String(oError.statusCode);

                                // ➕ Not found → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/WhyPrevent", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} saved, ${iFail} failed`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveWhyProtect: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const aData = oView.getModel("capaModel").getProperty("/fiveWhysprotect");

                if (!aData || !aData.length) {
                    sap.m.MessageToast.show("No Protect 5-Why data available to save.");
                    return;
                }

                oView.setBusy(true);

                const aPromises = aData.map((item) => {

                    // 🔒 Mandatory key validation
                    if (!item.stepNumber) {
                        return Promise.reject("Missing stepNumber (cause)");
                    }

                    const oPayload = {
                        capaid: _this._sCapaId,
                        cause: String(item.stepNumber),   // 🔑 composite key
                        supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,
                        probablecause: item.cause || "",
                        problemdef: item.definition || "",
                        onewhy: item.why1 || "",
                        twowhy: item.why2 || "",
                        threewhy: item.why3 || "",
                        fourwhy: item.why4 || "",
                        fivewhy: item.why5 || "",
                        percontribution: item.contribution || ""
                    };

                    // 🔑 Build composite key path
                    const sKeyPath = oODataModel.createKey("/WhyProtect", {
                        capaid: oPayload.capaid,
                        cause: oPayload.cause
                    });

                    return new Promise((resolve, reject) => {

                        oODataModel.read(sKeyPath, {
                            success: function (oData) {

                                // 🔍 Exists → UPDATE
                                if (oData && oData.capaid) {
                                    oODataModel.update(sKeyPath, oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    // 🟢 Empty response → CREATE
                                    oODataModel.create("/WhyProtect", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                }
                            },
                            error: function (oError) {

                                const sStatus = String(oError.statusCode);

                                // ➕ Not Found → CREATE
                                if (sStatus === "404") {
                                    oODataModel.create("/WhyProtect", oPayload, {
                                        success: resolve,
                                        error: reject
                                    });
                                } else {
                                    reject(oError);
                                }
                            }
                        });
                    });
                });

                Promise.allSettled(aPromises)
                    .then((results) => {
                        const iSuccess = results.filter(r => r.status === "fulfilled").length;
                        const iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} saved, ${iFail} failed`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .finally(() => oView.setBusy(false));
            },

            onSaveRoot: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel"); // OData V2 model
                const oCapaModel = oView.getModel("capaModel");
                const oCapaData = oCapaModel.getData();
                const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd'T'00:00:00" });

                // --- Common Header Data ---
                const sCapaId = _this._sCapaId || "CAPA001";
                const oHeaderData = {
                    capaid: sCapaId,
                    supplier: _this.supplier || "",
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate ? new Date(_this.invoicedate) : null
                };

                // --- Root Payload (CAPA Header) ---
                const oRootPayload = {
                    ...oHeaderData,
                    typeofnc: oCapaData.typeOfNC || "",
                    ref: oCapaData.refMessage || "",
                    rd_initiateddate: oCapaData.initiatedDate ? oDateFormat.format(new Date(oCapaData.initiatedDate)) : null,
                    partname: oCapaData.partName || "",
                    customername: oCapaData.customerName || "",
                    hodekpartnumber: oCapaData.customerPartNo || "",
                    vehiclemodel: oCapaData.vehicleModel || "",
                    drgrefnumber: oCapaData.drgRefNo || "",
                    problem: oCapaData.problem || "",
                    drgrev: oCapaData.drgRev || "",
                    // totaltimerequired: String(oCapaData.totalTimeDays) || "",
                    // lessonlearned: oCapaData.lessonLearned || "",
                    status: "01"
                };



                // --- Validation ---
                if (!_this._sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory before saving.");
                    return;
                }
                let that = this;
                // --- Final OData Save ---
                oView.setBusy(true);
                const sPath = `/Root('${oRootPayload.capaid}')`;

                oODataModel.read(sPath, {
                    success: () => {
                        // Record exists → call update method
                        that.updateCall(sPath, oRootPayload, _this);
                    },
                    error: () => {
                        // Record not found → create new record
                        oODataModel.create("/Root", oRootPayload, {
                            success: () => {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("CAPA Root created successfully!");
                            },
                            error: (oError) => {
                                oView.setBusy(false);
                                sap.m.MessageBox.error("Error creating CAPA Root: " + oError.message);
                            }
                        });
                    }
                });
            },

            onSaveProblemDescription: function (_this) {
                const oView = _this.getView();
                const oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oCapaModel = oView.getModel("capaModel");

                // --- Validation ---
                if (!_this._sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory before saving Problem Description.");
                    return;
                }

                // --- Read data from model (bound to SimpleForm) ---
                const oPayload = {
                    // Key / Header fields
                    capaid: _this._sCapaId,
                    supplier: _this.supplier || "",
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate ? new Date(_this.invoicedate) : null,

                    // Problem Description fields
                    details_failure: oCapaModel.getProperty("/details_failure") || "",
                    impact_failure: oCapaModel.getProperty("/impact_failure") || "",
                    failure_occurring: oCapaModel.getProperty("/failure_occurring") || "",
                    failure_detected: oCapaModel.getProperty("/failure_detected") || "",
                    failure_occur: oCapaModel.getProperty("/failure_occur") || ""
                };
                Object.keys(oPayload).forEach(function (key) {
                    if (oPayload[key] === "" || oPayload[key] === null || oPayload[key] === undefined) {
                        delete oPayload[key];
                    }
                });
                // --- OData Save (Create / Update) ---
                const sPath = `/ProbDesc('${_this._sCapaId}')`;
                oView.setBusy(true);

                oODataModel.read(sPath, {
                    success: () => {
                        // Exists → Update
                        _this.updateCall(sPath, oPayload, _this);
                    },
                    error: () => {
                        // Not exists → Create
                        oODataModel.create("/ProbDesc", oPayload, {
                            success: () => {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("Problem Description saved successfully.");
                            },
                            error: (oError) => {
                                oView.setBusy(false);
                                sap.m.MessageBox.error(
                                    "Error saving Problem Description: " +
                                    (oError.message || "Unknown error")
                                );
                            }
                        });
                    }
                });
            },

            _loadCapaData: function (sCapaId, _this) {
                let oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                let oCapaModel = oView.getModel("capaModel");

                oView.setBusy(true);

                // let sExpand = [
                //     "to_PrevAction", "to_ContActions", "to_CorrActions", "to_DcpUpdation",
                //     "to_HoDeploy", "to_EstabTeam", "to_MngVClosure", "to_PrbClSignoff",
                //     "to_ProbAware", "to_ProbDesc", "to_CAImpleMon", "to_ValCorrAct",
                //     "to_WhyFishbone", "to_WhyPrevent", "to_WhyProtect"
                // ].join(",");

                oODataModel.read(`/Root('${sCapaId}')`, {
                    // urlParameters: {
                    //     "$expand": sExpand
                    // },
                    success: (oData) => {
                        oView.setBusy(false);
                        this._mapRootDataToLocalModel(oData, _this);
                    },
                    error: (oError) => {
                        oView.setBusy(false);
                        console.log("Error loading CAPA Root: " + oError.message);
                    }
                });
            },

            _mapRootDataToLocalModel: function (oData, _this) {
                let oView = _this.getView();
                let oCapaModel = oView.getModel("capaModel");
                let oSelectModel = oView.getModel("selectedModel");

                // === 1️⃣ Save snapshot for change detection ===
                this._originalCapaSnapshot = JSON.parse(JSON.stringify(oData));
                // === Root Level ===
                oCapaModel.setProperty("/typeOfNC", oData.typeofnc || "");
                oCapaModel.setProperty("/refMessage", oData.ref || "");
                oCapaModel.setProperty("/initiatedDate", oData.rd_initiateddate ? Formatter.formatDateToYyyyMmDd(new Date(oData.rd_initiateddate)) : null);
                oCapaModel.setProperty("/partName", oData.partname || "");
                oCapaModel.setProperty("/customerName", oData.customername || "");
                oCapaModel.setProperty("/customerPartNo", oData.hodekpartnumber || "");
                oCapaModel.setProperty("/vehicleModel", oData.vehiclemodel || "");
                oCapaModel.setProperty("/drgRefNo", oData.drgrefnumber || "");
                oCapaModel.setProperty("/problem", oData.problem || "");
                oCapaModel.setProperty("/drgRev", oData.drgrev || "");
                oCapaModel.setProperty("/totalTimeDays", parseInt(oData.totaltimerequired) || 0);
                oCapaModel.setProperty("/lessonLearned", oData.lessonlearned || "");
                oCapaModel.setProperty("/status", oData.status === "01" ? true : false);
                oSelectModel.setProperty("/status", oData.status === "01" ? true : false);
                oCapaModel.setProperty()
                oCapaModel.refresh(true);
            },

            // =============================================
            // 📦 updateCall — only update changed entities
            // =============================================
            updateCall: function (sPath, oPayload, oController) {
                const oView = oController.getView();
                const oModel = oController.getOwnerComponent().getModel("capaServiceModel");

                oModel.update(sPath, oPayload, {
                    success: () => {
                        oView.setBusy(false);
                        sap.m.MessageToast.show("CAPA updated successfully.");
                    },
                    error: (oError) => {
                        oView.setBusy(false);
                        sap.m.MessageBox.error(
                            "Error updating CAPA: " + (oError.message || "Unknown error")
                        );
                    }
                });
            },

            updateRootFields: function (_this, oPayload) {
                var oModel = _this.getOwnerComponent().getModel("capaServiceModel");
                var sPath = `/Root(capaid='${_this._sCapaId}')`;

                oModel.update(sPath, oPayload, {
                    merge: true, // PATCH / MERGE
                    success: function () {
                        sap.m.MessageToast.show("Updated successfully");
                    },
                    error: function (oError) {
                        console.error(oError);
                    }
                });

            },
            fetchRootFields: function (_this, sField, localProp) {
                var oModel = _this.getOwnerComponent().getModel("capaServiceModel");
                var sPath = `/Root(capaid='${_this._sCapaId}')`;
                let oLocalModel = _this.getView().getModel("capaModel");
                oModel.read(sPath, {
                    success: function (oData) {
                        console.log(oData);
                        oLocalModel.setProperty(localProp, oData[sField]);
                    },
                    error: function (oError) {
                        console.error(oError);
                    }
                });

            }
        };

    });