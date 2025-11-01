sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

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
                let oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel"); // your main OData model
                let oLocalModel = oView.getModel("capaModel");
                let aContainments = oLocalModel.getProperty("/containmentActions");

                // Example CAPA ID you have in context
                let sCapaId = _this._sCapaId || "CAPA001";

                // Map local JSON to backend structure
                let aPayload = aContainments.map((item, index) => {
                    return {
                        capaid: sCapaId,
                        serial: String(index + 1).padStart(2, "0"),
                        supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,
                        immediate_acttaken: item.immediateAction,
                        completiondate: item.completion ? new Date(item.completion) : null,
                        responsible: item.responsible,
                        breakpoint: item.breakPoint,
                        status: item.status
                    };
                });

                // Now post each containment row to OData
                aPayload.forEach(oEntry => {
                    oODataModel.create("/ContActions", oEntry, {
                        success: function () {
                            sap.m.MessageToast.show("Containment action saved.");
                        },
                        error: function (oError) {
                            sap.m.MessageBox.error("Error saving containment action: " + oError.message);
                        }
                    });
                });
            },
            onSaveCorrective: function (_this) {
                const oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");
                const aCorrective = oLocalModel.getProperty("/corrective") || [];

                // CAPA ID from context (adjust how you fetch it)
                const sCapaId = _this._sCapaId || "CAPA001";

                // --- Build Payload for Each Row ---
                const aPayload = aCorrective.map((oRow, i) => {
                    return {
                        capaid: sCapaId,
                        serial: String(i + 1).padStart(2, "0"), // maintain serial key
                        supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,
                        // map UI fields to OData entity fields
                        corracttrial: oRow.actionTaken || "",           // Corrective Actions - Trial / Test
                        target: oRow.target ? new Date(oRow.target) : null, // Target Date
                        actual: oRow.actual ? new Date(oRow.actual) : null, // Actual Date
                        resofact: oRow.result || "",                   // Result of Actions
                        responsibility: oRow.responsibe || "",         // Responsibility (note typo in model: responsibe)
                        status: oRow.status || "",                     // Status (Open / Closed / In Progress)

                        // // optional attachment name if needed (not part of entity)
                        // attachment: oRow.attachment || ""
                    };
                });

                // --- Post Each Row to OData (Loop) ---
                oView.setBusy(true);

                let iSaved = 0;
                aPayload.forEach(oEntry => {
                    oODataModel.create("/CorrActions", oEntry, {
                        success: () => {
                            iSaved++;
                            if (iSaved === aPayload.length) {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("All corrective actions saved successfully.");
                            }
                        },
                        error: (oError) => {
                            oView.setBusy(false);
                            console.error("Error saving corrective action:", oError);
                            sap.m.MessageBox.error("Failed to save corrective action. Please check console for details.");
                        }
                    });
                });
            },
            onSaveDcpUpdation: function (_this) {
                const oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");
                const aDcpData = oLocalModel.getProperty("/dcpData") || [];

                // Common fields (populate these as available from context)
                const sCapaId = _this._sCapaId || "CAPA001";


                // --- Build Payload ---
                const aPayload = aDcpData.map((oRow, i) => ({
                    capaid: sCapaId,
                    serialno: String(i + 1).padStart(2, "0"),       // Key field
                    supplier: _this.supplier,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate,

                    // === Map UI fields to OData entity ===
                    qmsdocument: oRow.qmsDocument || "",
                    pifyes: oRow.pIfYes ? "P" : "",               // convert boolean -> string flag
                    documentno: oRow.documentNo || "",
                    revnodate: oRow.revNoDate || "",
                    resp: oRow.resp || "",
                    planneddate: oRow.plannedDate ? new Date(oRow.plannedDate) : null,
                    actualdate: oRow.actualDate ? new Date(oRow.actualDate) : null,
                    status: oRow.status || ""
                }));

                // --- Save Loop ---
                if (!aPayload.length) {
                    sap.m.MessageToast.show("No DCP Updation data to save.");
                    return;
                }

                oView.setBusy(true);
                let iSaved = 0;

                aPayload.forEach(oEntry => {
                    oODataModel.create("/DcpUpdation", oEntry, {
                        success: () => {
                            iSaved++;
                            if (iSaved === aPayload.length) {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("All DCP Updation entries saved successfully.");
                            }
                        },
                        error: (oError) => {
                            oView.setBusy(false);
                            console.error("Error saving DCP Updation:", oError);
                            sap.m.MessageBox.error("Failed to save DCP Updation entries. Check console for details.");
                        }
                    });
                });
            },
            onSaveHorizontalDeployment: function (_this) {
                const oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");
                const aHorizontal = oLocalModel.getProperty("/horizontalDeployment") || [];

                if (!aHorizontal.length) {
                    sap.m.MessageToast.show("No Horizontal Deployment data to save.");
                    return;
                }

                // --- Common CAPA context fields ---
                const sCapaId = _this._sCapaId || "CAPA001";


                // --- Build Payloads ---
                const aPayload = aHorizontal.map((oRow, i) => ({
                    capaid: sCapaId,
                    serialno: String(i + 1).padStart(2, "0"),

                    supplier: _this.supplier,
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
                }));

                oView.setBusy(true);

                // --- Save Each Row ---
                let iSuccess = 0;
                aPayload.forEach(oEntry => {
                    oODataModel.create("/HoDeploy", oEntry, {
                        success: () => {
                            iSuccess++;
                            if (iSuccess === aPayload.length) {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("Horizontal Deployment data saved successfully.");
                            }
                        },
                        error: (oError) => {
                            oView.setBusy(false);
                            console.error("Error saving Horizontal Deployment:", oError);
                            sap.m.MessageBox.error("Error saving some records. Please check console.");
                        }
                    });
                });
            },
            onSaveTeamMembers: function (_this) {
                const oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oLocalModel = oView.getModel("capaModel");
                const aTeam = oLocalModel.getProperty("/team") || [];

                if (!aTeam.length) {
                    sap.m.MessageToast.show("No team data to save.");
                    return;
                }

                // Context from CAPA root
                const sCapaId = _this._sCapaId || "CAPA001";


                const aPayload = aTeam.map((oRow, i) => ({
                    capaid: sCapaId,
                    serialno: String(i + 1).padStart(2, "0"),
                    supplier: _this.supplier,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate,


                    name: oRow.name || "",
                    champion: oRow.isChampion ? "X" : "",
                    leader: oRow.isLeader ? "X" : "",
                    teammember: oRow.isTeamMember ? "X" : "",
                    role: oRow.role || "",
                    department: oRow.department || "",
                    responsibilty: oRow.responsibility || "",
                    contact: oRow.contact || ""
                }));

                oView.setBusy(true);
                let iSuccess = 0;

                aPayload.forEach(oEntry => {
                    oODataModel.create("/EstabTeam", oEntry, {
                        success: () => {
                            iSuccess++;
                            if (iSuccess === aPayload.length) {
                                oView.setBusy(false);
                                sap.m.MessageToast.show("Team Members saved successfully.");
                            }
                        },
                        error: (oError) => {
                            oView.setBusy(false);
                            console.error("Error saving team member:", oError);
                            sap.m.MessageBox.error("Error while saving team members. Check console.");
                        }
                    });
                });
            },
            onSaveMngVClosure: function (_this) {
                let oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                let oMngVClosure = oView.getModel("MngVClosure").getData();

                // Example: If `capaid` is known
                oMngVClosure.capaid = _this._capaId || "CAPA001";
                let commData = {
                    capaid: sCapaId,
                    supplier: _this.supplier,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate,
                }

                let oPayload = {
                    ...commData,
                    ...oMngVClosure
                };
                oODataModel.create("/MngVClosure", oPayload, {
                    success: function (oData) {
                        sap.m.MessageToast.show("Management Verification Closure saved successfully!");
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error saving Management Verification Closure");
                        console.error(oError);
                    }
                });
            },
            onSaveClosure: function (_this) {
                let oView = _this.getView();
                let oModel = oView.getModel("capaModel");
                let aClosureData = oModel.getProperty("/closureData") || [];

                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");

                // Basic header details
                let sCapaId = _this._capaId || "CAPA001";

                // Shared header data
                let oHeaderData = {
                    capaid: sCapaId,
                    supplier: _this.supplier,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate
                };

                // === Build final payloads ===
                let aPayloads = aClosureData.map(function (entry, index) {
                    return {
                        ...oHeaderData,
                        srnumber: (index + 1).toString().padStart(3, "0"),
                        startdate: entry.startDate,
                        completion: entry.completion,
                        teammember: entry.teamMember,
                        area: entry.area,
                        signoff: entry.signOff
                    };
                });

                // === Create each entry in OData ===
                aPayloads.forEach(function (oEntry) {
                    oODataModel.create("/PrbClSignoff", oEntry, {
                        success: function () {
                            console.log("Saved:", oEntry);
                        },
                        error: function (oError) {
                            console.error("Error saving:", oEntry, oError);
                        }
                    });
                });

                sap.m.MessageToast.show("Problem Closure & Sign-Off data saved successfully!");
            },
            onSavePreventiveActions: function (_this) {
                let oView = _this.getView();

                let oCapaModel = oView.getModel("capaModel");
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");

                // Get preventive actions array
                let aPreventiveActions = oCapaModel.getProperty("/preventiveActions") || [];

                // Common CAPA header data (replace with your actual lets)
                let sCapaId = _this._capaId || "CAPA001";
                let oHeaderData = {
                    capaid: sCapaId,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate
                };

                // === Step 1: Build payload for each row ===
                let aPayloads = aPreventiveActions.map(function (entry, index) {
                    return {
                        ...oHeaderData,
                        serialno: (index + 1).toString().padStart(2, "0"),
                        preventiveactionstaken: entry.PreventiveAction || "",
                        target: entry.Target || null,
                        actual: entry.Actual || null,
                        resultofaction: entry.Result || "",
                        resp: entry.Resp || "",
                        status: entry.status || ""
                    };
                });

                // === Step 2: Save to OData (one by one) ===
                aPayloads.forEach(function (oEntry) {
                    oODataModel.create("/PrevAction", oEntry, {
                        success: function () {
                            console.log("Saved Preventive Action:", oEntry);
                        },
                        error: function (oError) {
                            console.error("Error saving Preventive Action:", oError);
                        }
                    });
                });

                sap.m.MessageToast.show("Preventive Actions saved successfully!");
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
                let sCapaId = _this._capaId || "CAPA001";
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
                oODataModel.create("/ProbAware", oPayload, {
                    success: function (oData) {
                        oView.setBusy(false);
                        sap.m.MessageToast.show("Problem Awareness saved successfully.");
                        // optionally update local model with returned oData
                        // oCapaModel.setProperty("/", Object.assign(oCapaModel.getData(), oData));
                    },
                    error: function (oError) {
                        oView.setBusy(false);
                        console.error("Error saving Problem Awareness:", oError);
                        sap.m.MessageBox.error("Failed to save Problem Awareness. See console for details.");
                    }
                });
            },
            onSaveProblemDescription: function (_this) {
                var oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                var oCapaModel = oView.getModel("capaModel"); // JSON model bound to XML

                // --- Read context (shared header info) ---
                var sCapaId = _this._capaId || "CAPA001";


                // --- Read description fields from capaModel ---
                var oDescData = {
                    details_failure: oCapaModel.getProperty("/details_failure") || "",
                    impact_failure: oCapaModel.getProperty("/impact_failure") || "",
                    failure_occurring: oCapaModel.getProperty("/failure_occurring") || "",
                    failure_detected: oCapaModel.getProperty("/failure_detected") || "",
                    failure_occur: oCapaModel.getProperty("/failure_occur") || ""
                };

                // --- Build final payload according to OData metadata ---
                var oPayload = {
                    capaid: sCapaId,
                    supplier: _this.supplier,
                    purchaseorder: _this.purchaseorder,
                    material: _this.material,
                    item: _this.item,
                    asn: _this.asn,
                    invoicenumber: _this.invoicenumber,
                    invoicedate: _this.invoicedate,

                    details_failure: oDescData.details_failure,
                    impact_failure: oDescData.impact_failure,
                    failure_occurring: oDescData.failure_occurring,
                    failure_detected: oDescData.failure_detected,
                    failure_occur: oDescData.failure_occur
                };

                // Optional cleanup — remove empty values
                Object.keys(oPayload).forEach(function (key) {
                    if (oPayload[key] === "" || oPayload[key] === null || oPayload[key] === undefined) {
                        delete oPayload[key];
                    }
                });

                // --- Create entry in OData service ---
                oView.setBusy(true);
                oODataModel.create("/ProbDesc", oPayload, {
                    success: function (oData) {
                        oView.setBusy(false);
                        sap.m.MessageToast.show("Problem Description saved successfully!");
                    },
                    error: function (oError) {
                        oView.setBusy(false);
                        console.error("Save failed:", oError);
                        sap.m.MessageBox.error("Failed to save Problem Description. See console for details.");
                    }
                });
            }










        };

    });