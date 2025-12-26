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
                const oLocalModel = oView.getModel("capaModel");// CAPA ID from context (adjust how you fetch it)
                const sCapaId = _this._sCapaId || "CAPA001";
                const aCorrective = oLocalModel.getProperty("/corrective") || [];



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
                oMngVClosure.capaid = _this._sCapaId || "CAPA001";
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
                let sCapaId = _this._sCapaId || "CAPA001";

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
                let sCapaId = _this._sCapaId || "CAPA001";
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
                return oPayload;
                // oView.setBusy(true);
                // oODataModel.create("/ProbAware", oPayload, {
                //     success: function (oData) {
                //         oView.setBusy(false);
                //         sap.m.MessageToast.show("Problem Awareness saved successfully.");
                //         // optionally update local model with returned oData
                //         // oCapaModel.setProperty("/", Object.assign(oCapaModel.getData(), oData));
                //     },
                //     error: function (oError) {
                //         oView.setBusy(false);
                //         console.error("Error saving Problem Awareness:", oError);
                //         sap.m.MessageBox.error("Failed to save Problem Awareness. See console for details.");
                //     }
                // });
            },
            onSaveProblemDescription: function (_this) {
                var oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                var oCapaModel = oView.getModel("capaModel"); // JSON model bound to XML

                // --- Read context (shared header info) ---
                var sCapaId = _this._sCapaId || "CAPA001";


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
                return oPayload;
                // --- Create entry in OData service ---
                // oView.setBusy(true);
                // oODataModel.create("/ProbDesc", oPayload, {
                //     success: function (oData) {
                //         oView.setBusy(false);
                //         sap.m.MessageToast.show("Problem Description saved successfully!");
                //     },
                //     error: function (oError) {
                //         oView.setBusy(false);
                //         console.error("Save failed:", oError);
                //         sap.m.MessageBox.error("Failed to save Problem Description. See console for details.");
                //     }
                // });
            },
            onSaveCAImplementation: function (_this) {
                let oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel"); // your OData model (cds_zui_capa_srv_direct)
                let oCapaModel = oView.getModel("capaModel"); // local JSON model with data

                // === Step 1: Read header fields ===
                let sCAImplDate = oView.byId("_IDGenDatePicker5").getDateValue();
                let sEffVerDate = oView.byId("_IDGenDatePicker6").getDateValue();
                let sEffMonDate = oView.byId("_IDGenDatePicker7").getDateValue();

                // Format to backend-compatible date (ISO)
                let oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd'T'00:00:00" });
                let sCAImplDateISO = sCAImplDate ? oDateFormat.format(sCAImplDate) : null;
                let sEffVerDateISO = sEffVerDate ? oDateFormat.format(sEffVerDate) : null;
                let sEffMonDateISO = sEffMonDate ? oDateFormat.format(sEffMonDate) : null;

                // === Step 2: Read table data ===
                let aEffectivenessData = oCapaModel.getProperty("/effectivenessData") || [];

                // === Step 3: Prepare payloads ===
                // assuming `capaid` and `serial` exist in your model (keys)
                let sCapaId = _this._sCapaId

                if (!sCapaId) {
                    sap.m.MessageToast.show("Missing CAPA ID or Serial number");
                    return;
                }

                // Create an array of entries to send to OData
                let aPayload = aEffectivenessData.map((item, index) => {
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
                        effverdate: sEffVerDateISO,
                        caimpdate: sCAImplDateISO,
                        effectmontdate: sEffMonDateISO,
                        monthfield: item.Month || "",
                        mfgqty: parseFloat(item.MfgQty) || 0,
                        defectqty: parseFloat(item.DefQty) || 0,
                        datefield: item.Date ? oDateFormat.format(new Date(item.Date)) : null
                    };
                });

                // === Step 4: Save data via OData ===
                oView.setBusy(true);

                let iSuccessCount = 0;
                let iErrorCount = 0;
                let iTotal = aPayload.length;
                return aPayload;
                // aPayload.forEach(function (oEntry) {
                //     oODataModel.create("/CAImpleMon", oEntry, {
                //         success: function () {
                //             iSuccessCount++;
                //             if (iSuccessCount + iErrorCount === iTotal) {
                //                 oView.setBusy(false);
                //                 sap.m.MessageToast.show("Successfully saved " + iSuccessCount + " records.");
                //             }
                //         },
                //         error: function (oError) {
                //             iErrorCount++;
                //             console.error("Error saving CAImpleMonType entry:", oError);
                //             if (iSuccessCount + iErrorCount === iTotal) {
                //                 oView.setBusy(false);
                //                 sap.m.MessageBox.error("Some records failed to save. Check console for details.");
                //             }
                //         }
                //     });
                // });
            },
            onSaveValidationActions: function (_this) {
                var oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel"); // your OData model (cds_zui_capa_srv_direct) // OData model (e.g., cds_zui_capa_srv_direct)
                var oCapaModel = oView.getModel("capaModel"); // local JSON model with frontend data

                // Step 1: Get CAPA key fields
                var sCapaId = _this._sCapaId;

                if (!sCapaId) {
                    sap.m.MessageToast.show("CAPA ID or Serial number missing");
                    return;
                }

                // Step 2: Get validating data array
                var aValidating = oCapaModel.getProperty("/validating") || [];

                if (!aValidating.length) {
                    sap.m.MessageToast.show("No validation data to save");
                    return;
                }

                // Step 3: Prepare date formatter (ISO)
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "yyyy-MM-dd'T'00:00:00"
                });

                // Step 4: Prepare payload array
                var aPayload = aValidating.map((oRow, index) => {
                    return {
                        capaid: sCapaId,
                        serial: String(index + 1).padStart(2, "0"),
                        valactiden: oRow.actionTaken || "",   // Maps to "Validating Actions Identified & Taken"
                        target: oRow.target ? oDateFormat.format(new Date(oRow.target)) : null,
                        actual: oRow.actual ? oDateFormat.format(new Date(oRow.actual)) : null,
                        resodact: oRow.result || "",
                        responsibility: oRow.responsibe || "",
                        status: oRow.status || ""
                    };
                });

                // Step 5: Call OData create for each record
                oView.setBusy(true);
                var iSuccessCount = 0;
                var iErrorCount = 0;
                var iTotal = aPayload.length;
                return aPayload;
                // aPayload.forEach(function (oEntry) {
                //     oODataModel.create("/ValCorrAct", oEntry, {
                //         success: function () {
                //             iSuccessCount++;
                //             if (iSuccessCount + iErrorCount === iTotal) {
                //                 oView.setBusy(false);
                //                 sap.m.MessageToast.show("Validation data saved successfully (" + iSuccessCount + ")");
                //             }
                //         },
                //         error: function (oError) {
                //             iErrorCount++;
                //             console.error("Error saving ValCorrActType entry:", oError);
                //             if (iSuccessCount + iErrorCount === iTotal) {
                //                 oView.setBusy(false);
                //                 sap.m.MessageBox.error("Some validation records failed to save. Check console for details.");
                //             }
                //         }
                //     });
                // });
            },
            onSaveFish: function (_this) {
                var oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel"); // OData model (main service)
                var oCapaModel = oView.getModel("capaModel"); // JSON model
                var aFishboneData = oCapaModel.getProperty("/fishbone");

                if (!aFishboneData || !aFishboneData.length) {
                    sap.m.MessageToast.show("No Fishbone data to save.");
                    return;
                }

                oView.setBusy(true);

                // Loop and prepare payloads
                var aPromises = aFishboneData.map((oItem, index) => {
                    // Map UI data to Entity structure
                    var oPayload = {
                        capaid: _this._sCapaId || "", // ensure primary key fields
                        cause: oItem.stepNumber || "",
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
                        measurement: oItem.measurment || oItem.measurement || "" // handle typo
                    };

                    return new Promise(function (resolve, reject) {
                        oODataModel.create("/WhyFishbone", oPayload, {
                            success: function (oData) {
                                resolve(oData);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                });

                // Wait for all creations
                Promise.allSettled(aPromises)
                    .then(function (results) {
                        var iSuccess = results.filter(r => r.status === "fulfilled").length;
                        var iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} entries saved, ${iFail} failed.`);

                        // Optional: refresh model
                        oODataModel.refresh(true);
                    })
                    .catch(function (err) {
                        sap.m.MessageBox.error("Error while saving Fishbone data: " + err.message);
                    })
                    .finally(function () {
                        oView.setBusy(false);
                    });
            },
            onSaveFiveWhy: function (_this) {
                var oView = _this.getView();
                var oODataModel = _this.getOwnerComponent().getModel("capaServiceModel"); // Main OData model
                var oCapaModel = oView.getModel("capaModel"); // Local JSON model
                var aFiveWhys = oCapaModel.getProperty("/fiveWhys");

                if (!aFiveWhys || aFiveWhys.length === 0) {
                    sap.m.MessageToast.show("No 5-Why data available to save.");
                    return;
                }

                oView.setBusy(true);

                // Prepare payloads
                var aCreatePromises = aFiveWhys.map((oRow, index) => {
                    var oPayload = {
                        capaid: _this._sCapaId || "",                 // Required Key
                        cause: oRow.stepNumber || "",                   // Required Key
                        supplier: _this.supplier,
                        purchaseorder: _this.purchaseorder,
                        material: _this.material,
                        item: _this.item,
                        asn: _this.asn,
                        invoicenumber: _this.invoicenumber,
                        invoicedate: _this.invoicedate,
                        probablecause: oRow.cause || "",           // from TextArea "Probable Cause"
                        problemdef: oRow.definition || "",          // from "Problem Definition"
                        onewhy: oRow.why1 || "",
                        twowhy: oRow.why2 || "",
                        threewhy: oRow.why3 || "",
                        fourwhy: oRow.why4 || "",
                        fivewhy: oRow.why5 || "",
                        percontribution: oRow.contribution || ""
                    };

                    return new Promise(function (resolve, reject) {
                        oODataModel.create("/WhyPrevent", oPayload, {
                            success: function (oData) {
                                resolve(oData);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                });

                // Wait for all requests
                Promise.allSettled(aCreatePromises)
                    .then(function (results) {
                        var iSuccess = results.filter(r => r.status === "fulfilled").length;
                        var iFail = results.filter(r => r.status === "rejected").length;

                        sap.m.MessageToast.show(`${iSuccess} entries saved, ${iFail} failed.`);
                        if (iSuccess > 0) {
                            oODataModel.refresh(true);
                        }
                    })
                    .catch(function (err) {
                        sap.m.MessageBox.error("Error while saving 5-Why data: " + err.message);
                    })
                    .finally(function () {
                        oView.setBusy(false);
                    });
            },
            onSaveWhyProtect: function (_this) {
                var oView = _this.getView();
                var oModel = _this.getOwnerComponent().getModel("capaServiceModel"); // OData model
                var aData = oView.getModel("capaModel").getProperty("/fiveWhysprotect");

                // Prepare payloads
                var aPayloads = aData.map((item, index) => {
                    return {
                        capaid: _this._sCapaId,
                        cause: item.stepNumber || "", // key field
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
                });

                // === Option 1: Deep Create (if nav used) ===
                // oModel.create("/WhyProtectSet", aPayloads[0], { success, error });

                // === Option 2: Loop and POST each ===
                aPayloads.forEach(function (oEntry) {
                    oModel.create("/WhyProtect", oEntry, {
                        success: function () {
                            sap.m.MessageToast.show("Protect 5 Why saved successfully!");
                        },
                        error: function (oError) {
                            sap.m.MessageBox.error("Error saving Protect 5 Why: " + oError.message);
                        }
                    });
                });
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
                    totaltimerequired: String(oCapaData.totalTimeDays) || "",
                    lessonlearned: oCapaData.lessonLearned || "",
                    status: oCapaData.status || ""
                };

                // --- Preventive Actions ---
                const aPreventiveActions = oCapaModel.getProperty("/preventiveActions") || [];
                const aPreventActionPayloads = aPreventiveActions.map((entry, i) => ({
                    ...oHeaderData,
                    serialno: (i + 1).toString().padStart(2, "0"),
                    preventiveactionstaken: entry.PreventiveAction || "",
                    target: entry.Target ? oDateFormat.format(new Date(entry.Target)) : null,
                    actual: entry.Actual ? oDateFormat.format(new Date(entry.Actual)) : null,
                    resultofaction: entry.Result || "",
                    resp: entry.Resp || "",
                    status: entry.Status || ""
                }));

                // --- Containment Actions ---
                const aContainments = oCapaModel.getProperty("/containmentActions") || [];
                const aContainmentPayload = aContainments.map((item, i) => ({
                    ...oHeaderData,
                    serial: String(i + 1).padStart(2, "0"),
                    immediate_acttaken: item.immediateAction,
                    completiondate: item.completion ? oDateFormat.format(new Date(item.completion)) : null,
                    responsible: item.responsible,
                    breakpoint: item.breakPoint,
                    status: item.status
                }));

                // --- Corrective Actions ---
                const aCorrective = oCapaModel.getProperty("/corrective") || [];
                const aCorrectivePayload = aCorrective.map((oRow, i) => ({
                    ...oHeaderData,
                    serial: String(i + 1).padStart(2, "0"),
                    corracttrial: oRow.actionTaken || "",
                    target: oRow.target ? new Date(oRow.target) : null,
                    actual: oRow.actual ? new Date(oRow.actual) : null,
                    resofact: oRow.result || "",
                    responsibility: oRow.responsibe || "",
                    status: oRow.status || ""
                }));

                // --- DCP Data ---
                const aDcpData = oCapaModel.getProperty("/dcpData") || [];
                const aDcpPayload = aDcpData.map((oRow, i) => ({
                    ...oHeaderData,
                    serialno: String(i + 1).padStart(2, "0"),
                    qmsdocument: oRow.qmsDocument || "",
                    pifyes: oRow.pIfYes ? "P" : "",
                    documentno: oRow.documentNo || "",
                    revnodate: oRow.revNoDate || "",
                    resp: oRow.resp || "",
                    planneddate: oRow.plannedDate ? oDateFormat.format(new Date(oRow.plannedDate)) : null,
                    actualdate: oRow.actualDate ? oDateFormat.format(new Date(oRow.actualDate)) : null,
                    status: oRow.status || ""
                }));

                // --- Horizontal Deployment ---
                const aHorizontal = oCapaModel.getProperty("/horizontalDeployment") || [];

                const aHorizontalPayload = aHorizontal.map((oRow, i) => ({
                    ...oHeaderData,
                    serialno: String(i + 1).padStart(2, "0"),
                    productprocesssystem: oRow.Product || "",
                    actiondetail: oRow.ActionDetail || "",
                    errorproofing: oRow.ErrorProofing || "",
                    responsible: oRow.Responsible || "",
                    whendate: oRow.When ? oDateFormat.format(new Date(oRow.When)) : null
                }));

                // --- Team Data ---
                const aTeam = oCapaModel.getProperty("/team") || [];

                const aTeamPayload = aTeam.map((oRow, i) => ({
                    ...oHeaderData,
                    serialno: String(i + 1).padStart(2, "0"),
                    name: oRow.name || "",
                    champion: oRow.isChampion ? "X" : "",
                    leader: oRow.isLeader ? "X" : "",
                    teammember: oRow.isTeamMember ? "X" : "",
                    role: oRow.role || "",
                    department: oRow.department || "",
                    responsibilty: oRow.responsibility || "",
                    contact: oRow.contact || ""
                }));

                // --- Management Verification & Closure ---
                const oMngVClosure = { ...oView.getModel("MngVClosure").getData()||[] };

                oMngVClosure.capaid = sCapaId;
                oMngVClosure.productionchiefdate = oDateFormat.format(new Date(oMngVClosure.productionchiefdate));
                oMngVClosure.qualitychiefmrdate = oDateFormat.format(new Date(oMngVClosure.qualitychiefmrdate));
                oMngVClosure.designchiefdate = oDateFormat.format(new Date(oMngVClosure.designchiefdate));
                oMngVClosure.processchiefdate = oDateFormat.format(new Date(oMngVClosure.processchiefdate));
                oMngVClosure.plantheaddate = oDateFormat.format(new Date(oMngVClosure.plantheaddate));

                const oMngVClosurePayload = { ...oHeaderData, ...oMngVClosure };

                // --- Closure Data ---
                const aClosureData = oCapaModel.getProperty("/closureData") || [];
                const aClosurePayloads = aClosureData.map((entry, i) => ({
                    ...oHeaderData,
                    srnumber: (i + 1).toString().padStart(3, "0"),
                    startdate: oDateFormat.format(new Date(entry.startDate)),
                    completion: oDateFormat.format(new Date(entry.completion)),
                    teammember: entry.teamMember,
                    area: entry.area,
                    signoff: entry.signOff
                }));

                // --- Subsection Save Calls ---
                const aProblemAware = this.onSaveProblemAwareness(_this);
                const aProblemDesc = this.onSaveProblemDescription(_this);
                const aCAImplementation = this.onSaveCAImplementation(_this);
                const aValidationActions = this.onSaveValidationActions(_this);

                // --- Fishbone / 5Why ---
                const aFishboneData = oCapaModel.getProperty("/fishbone") || [];
                const aFishbonePayload = aFishboneData.map((oItem, i) => ({
                    ...oHeaderData,
                    cause: oItem.stepNumber,
                    man: oItem.man || "",
                    machine: oItem.machine || "",
                    materialfield: oItem.material || "",
                    method: oItem.method || "",
                    environment: oItem.environment || "",
                    measurement: oItem.measurment || oItem.measurement || ""
                }));

                const aFiveWhys = oCapaModel.getProperty("/fiveWhys") || [];
                const aFiveWhysPayload = aFiveWhys.map((oRow, i) => ({
                    ...oHeaderData,
                    cause: oRow.stepNumber,
                    probablecause: oRow.cause || "",
                    problemdef: oRow.definition || "",
                    onewhy: oRow.why1 || "",
                    twowhy: oRow.why2 || "",
                    threewhy: oRow.why3 || "",
                    fourwhy: oRow.why4 || "",
                    fivewhy: oRow.why5 || "",
                    percontribution: oRow.contribution || ""
                }));

                const aFiveWhysProtect = oCapaModel.getProperty("/fiveWhysprotect") || [];
                const aFiveWhysProtectPayload = aFiveWhysProtect.map((item, i) => ({
                    ...oHeaderData,
                    cause: item.stepNumber,
                    probablecause: item.cause || "",
                    problemdef: item.definition || "",
                    onewhy: item.why1 || "",
                    twowhy: item.why2 || "",
                    threewhy: item.why3 || "",
                    fourwhy: item.why4 || "",
                    fivewhy: item.why5 || "",
                    percontribution: item.contribution || ""
                }));

                // --- Validation ---
                if (!_this._sCapaId) {
                    sap.m.MessageBox.error("CAPA ID is mandatory before saving.");
                    return;
                }

                // --- Bind Nested Entities ---
                Object.assign(oRootPayload, {
                    to_PrevAction: aPreventActionPayloads,
                    to_ContActions: aContainmentPayload,
                    to_CorrActions: aCorrectivePayload,
                    to_DcpUpdation: aDcpPayload,
                    to_HoDeploy: aHorizontalPayload,
                    to_EstabTeam: aTeamPayload,
                    to_MngVClosure: oMngVClosurePayload,
                    to_PrbClSignoff: aClosurePayloads,
                    to_ProbAware: aProblemAware,
                    to_ProbDesc: aProblemDesc,
                    to_CAImpleMon: aCAImplementation,
                    to_ValCorrAct: aValidationActions,
                    to_WhyFishbone: aFishbonePayload,
                    to_WhyPrevent: aFiveWhysPayload,
                    to_WhyProtect: aFiveWhysProtectPayload
                });
                let that = this;
                // --- Final OData Save ---
                oView.setBusy(true);
                const sPath = `/Root('${oRootPayload.capaid}')`;

                oODataModel.read(sPath, {
                    success: () => {
                        // Record exists → call update method
                        that.updateCall(oRootPayload,_this);
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

            _loadCapaData: function (sCapaId, _this) {
                let oView = _this.getView();
                let oODataModel = _this.getOwnerComponent().getModel("capaServiceModel");
                let oCapaModel = oView.getModel("capaModel");

                oView.setBusy(true);

                let sExpand = [
                    "to_PrevAction", "to_ContActions", "to_CorrActions", "to_DcpUpdation",
                    "to_HoDeploy", "to_EstabTeam", "to_MngVClosure", "to_PrbClSignoff",
                    "to_ProbAware", "to_ProbDesc", "to_CAImpleMon", "to_ValCorrAct",
                    "to_WhyFishbone", "to_WhyPrevent", "to_WhyProtect"
                ].join(",");

                oODataModel.read(`/Root('${sCapaId}')`, {
                    urlParameters: {
                        "$expand": sExpand
                    },
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
                let oMngVClosureModel = oView.getModel("MngVClosure");
                let oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
                if (!oData) return;

                // === 1️⃣ Save snapshot for change detection ===
                this._originalCapaSnapshot = JSON.parse(JSON.stringify(oData));
                // === Root Level ===
                oCapaModel.setProperty("/typeOfNC", oData.typeofnc || "");
                oCapaModel.setProperty("/refMessage", oData.ref || "");
                oCapaModel.setProperty("/initiatedDate", oData.rd_initiateddate ? new Date(oData.rd_initiateddate) : null);
                oCapaModel.setProperty("/partName", oData.partname || "");
                oCapaModel.setProperty("/customerName", oData.customername || "");
                oCapaModel.setProperty("/customerPartNo", oData.hodekpartnumber || "");
                oCapaModel.setProperty("/vehicleModel", oData.vehiclemodel || "");
                oCapaModel.setProperty("/drgRefNo", oData.drgrefnumber || "");
                oCapaModel.setProperty("/problem", oData.problem || "");
                oCapaModel.setProperty("/drgRev", oData.drgrev || "");
                oCapaModel.setProperty("/totalTimeDays", parseInt(oData.totaltimerequired) || 0);
                oCapaModel.setProperty("/lessonLearned", oData.lessonlearned || "");
                oCapaModel.setProperty("/status", oData.status || "");

                // === Related Entities ===
                oCapaModel.setProperty("/preventiveActions", oData.to_PrevAction?.results?.map(e => ({
                    stepNumber: e.serialno || "",
                    PreventiveAction: e.preventiveactionstaken || "",
                    Target: e.target ? new Date(e.target) : null,
                    Actual: e.actual ? new Date(e.actual) : null,
                    Result: e.resultofaction || "",
                    Resp: e.resp || "",
                    status: e.status || ""
                })) || []);
                // === Related Entities ===
                oCapaModel.setProperty("/effectivenessData", oData.to_CAImpleMon?.results?.map(e => ({
                    stepNumber: e.serial || "",
                    Month: e.monthfield || "",
                    MfgQty: e.mfgqty || "",
                    DefQty: e.defectqty || "",
                    Date: e.datefield ? new Date(e.datefield) : null,
                })) || []);
                oCapaModel.setProperty("/CAImplDate", oData.to_ContActions?.results?.[0]?.caimpdate || "");
                oCapaModel.setProperty("/EffectivenessVerificationDate", oData.to_ContActions?.results?.[0]?.effverdate || "");
                oCapaModel.setProperty("/EffectivenessMonitoringDate", oData.to_ContActions?.results?.[0]?.effectmontdate || "");

                oCapaModel.setProperty("/containmentActions", oData.to_ContActions?.results?.map(e => ({
                    rowIndex: e.serialno || "",
                    immediateAction: e.immediate_acttaken || "",
                    completion: e.completiondate ? new Date(e.completiondate) : null,
                    responsible: e.responsible || "",
                    breakPoint: e.breakpoint || "",
                    status: e.status || ""
                })) || []);

                if (oData.to_ProbAware?.results?.length) {
                    const oProbAware = oData.to_ProbAware.results[0];

                    oCapaModel.setProperty("/problemType", oProbAware.prob_scope || "");
                    oCapaModel.setProperty("/probSeverity", oProbAware.prob_severity || "");
                    oCapaModel.setProperty("/problemDetails", oProbAware.prob_detail || "");
                    oCapaModel.setProperty("/probSource", oProbAware.prob_source || "");
                    oCapaModel.setProperty("/percentDefect", oProbAware.per_defect || "");
                    oCapaModel.setProperty("/ppapPpk", oProbAware.ppap_ppk || "");
                    oCapaModel.setProperty("/rpnRating", oProbAware.rpn_rating || "");
                    oCapaModel.setProperty("/presentPpkCpk", oProbAware.present_ppkcpk || "");
                    oCapaModel.setProperty("/presentPpm", oProbAware.present_ppm || "");
                    oCapaModel.setProperty("/internalAuditScore", oProbAware.int_audit_ratingscore || "");
                    oCapaModel.setProperty("/remarks", oProbAware.remark || "");
                }

                if (oData.to_ProbDesc?.results?.length) {
                    const oDescData = oData.to_ProbDesc.results[0];

                    oCapaModel.setProperty("/details_failure", oDescData.details_failure || "");
                    oCapaModel.setProperty("/impact_failure", oDescData.impact_failure || "");
                    oCapaModel.setProperty("/failure_occurring", oDescData.failure_occurring || "");
                    oCapaModel.setProperty("/failure_detected", oDescData.failure_detected || "");
                    oCapaModel.setProperty("/failure_occur", oDescData.failure_occur || "");
                }

                oCapaModel.setProperty("/corrective", oData.to_CorrActions?.results?.map(e => ({
                    stepNumber: e.serial || "",
                    actionTaken: e.corracttrial || "",
                    target: e.target ? new Date(e.target) : null,
                    actual: e.actual ? new Date(e.actual) : null,
                    result: e.resofact || "",
                    responsibe: e.responsibility || "",
                    status: e.status || ""
                })) || []);

                oCapaModel.setProperty("/validating", oData.to_ValCorrAct?.results?.map(e => ({
                    stepNumber: e.serial || "",
                    actionTaken: e.valactiden || "",
                    target: e.target ? new Date(e.target) : null,
                    actual: e.actual ? new Date(e.actual) : null,
                    result: e.resodact || "",
                    responsibe: e.responsibility || "",
                    status: e.status || ""
                })) || []);


                oCapaModel.setProperty("/dcpData", oData.to_DcpUpdation?.results?.map(e => ({
                    stepNumber: e.serialno || "",
                    qmsDocument: e.qmsdocument || "",
                    pIfYes: e.pifyes === "P",
                    documentNo: e.documentno || "",
                    revNoDate: e.revnodate || "",
                    resp: e.resp || "",
                    plannedDate: e.planneddate ? new Date(e.planneddate) : null,
                    actualDate: e.actualdate ? new Date(e.actualdate) : null,
                    status: e.status || ""
                })) || []);

                oCapaModel.setProperty("/horizontalDeployment", oData.to_HoDeploy?.results?.map(e => ({
                    stepNumber: e.serialno || "",
                    Product: e.productprocesssystem || "",
                    ActionDetail: e.actiondetail || "",
                    ErrorProofing: e.errorproofing || "",
                    Responsible: e.responsible || "",
                    When: e.whendate ? new Date(e.whendate) : null
                })) || []);

                oCapaModel.setProperty("/team", oData.to_EstabTeam?.results?.map(e => ({
                    index: e.serialno || "",
                    name: e.name || "",
                    isChampion: e.champion === "X",
                    isLeader: e.leader === "X",
                    isTeamMember: e.teammember === "X",
                    role: e.role || "",
                    department: e.department || "",
                    responsibility: e.responsibilty || "",
                    contact: e.contact || ""
                })) || []);

                if (oData.to_MngVClosure) {
                    oMngVClosureModel.setData({
                        ...oMngVClosureModel.getData(),
                        ...oData.to_MngVClosure,
                        productionchiefdate: oData.to_MngVClosure.productionchiefdate ? new Date(oData.to_MngVClosure.productionchiefdate) : null,
                        qualitychiefmrdate: oData.to_MngVClosure.qualitychiefmrdate ? new Date(oData.to_MngVClosure.qualitychiefmrdate) : null,
                        designchiefdate: oData.to_MngVClosure.designchiefdate ? new Date(oData.to_MngVClosure.designchiefdate) : null,
                        processchiefdate: oData.to_MngVClosure.processchiefdate ? new Date(oData.to_MngVClosure.processchiefdate) : null,
                        plantheaddate: oData.to_MngVClosure.plantheaddate ? new Date(oData.to_MngVClosure.plantheaddate) : null
                    });
                }

                oCapaModel.setProperty("/closureData", oData.to_PrbClSignoff?.results?.map(e => ({
                    no: e.srnumber || "",
                    phase: e.phase || "",
                    startDate: e.startdate ? new Date(e.startdate) : "",
                    completion: e.completion ? new Date(e.completion) : "",
                    teamMember: e.teammember || "",
                    area: e.area || "",
                    signOff: e.signoff || ""
                })) || []);

                oCapaModel.setProperty("/fishbone", oData.to_WhyFishbone?.results?.map(e => ({
                    stepNumber: e.cause || 1,
                    man: e.man || "",
                    machine: e.machine || "",
                    material: e.materialfield || "",
                    method: e.method || "",
                    measurment: e.measurement || e.measurment || "",
                    environment: e.environment || ""
                })) || []);

                oCapaModel.setProperty("/fiveWhys", oData.to_WhyPrevent?.results?.map(e => ({
                    stepNumber: e.cause || 1,
                    cause: e.probablecause || "",
                    definition: e.problemdef || "",
                    why1: e.onewhy || "",
                    why2: e.twowhy || "",
                    why3: e.threewhy || "",
                    why4: e.fourwhy || "",
                    why5: e.fivewhy || "",
                    contribution: e.percontribution || ""
                })) || []);

                oCapaModel.setProperty("/fiveWhysprotect", oData.to_WhyProtect?.results?.map(e => ({
                    stepNumber: e.cause || 1,
                    cause: e.probablecause || "",
                    definition: e.problemdef || "",
                    why1: e.onewhy || "",
                    why2: e.twowhy || "",
                    why3: e.threewhy || "",
                    why4: e.fourwhy || "",
                    why5: e.fivewhy || "",
                    contribution: e.percontribution || ""
                })) || []);

                oCapaModel.refresh(true);
            },

            // =============================================
            // 📦 updateCall — only update changed entities
            // =============================================
            updateCall: function (oPayload,_this) {
                const oModel = _this.getOwnerComponent().getModel("capaServiceModel");
                const oView = _this.getView();
                const sPath = `/Root('${oPayload.capaid}')`;
                const oOriginal = this._originalCapaSnapshot || {};

                const fmtChanged = (orig, cur, key) => {
                    if (!orig || !cur) return true;
                    return JSON.stringify(orig[key]) !== JSON.stringify(cur[key]);
                };

                const aChanged = [];

                // Detect entity changes (compare old snapshot vs. new)
                const entityMap = [
                    "to_PrevAction", "to_ContActions", "to_CorrActions", "to_DcpUpdation",
                    "to_HoDeploy", "to_EstabTeam", "to_MngVClosure", "to_PrbClSignoff",
                    "to_ProbAware", "to_ProbDesc", "to_CAImpleMon", "to_ValCorrAct",
                    "to_WhyFishbone", "to_WhyPrevent", "to_WhyProtect"
                ];

                entityMap.forEach(nav => {
                    const key = nav.replace("to_", "");
                    if (fmtChanged(oOriginal, oPayload, nav)) {
                        aChanged.push(nav);
                    }
                });

                // Always update root if any child changed
                oModel.update(sPath, oPayload, {
                    success: () => {
                        oView.setBusy(false);
                        sap.m.MessageToast.show(`CAPA Root and ${aChanged.length} entities updated successfully.`);
                    },
                    error: e => {
                        oView.setBusy(false);
                        sap.m.MessageBox.error("Error updating CAPA Root: " + e.message);
                    }
                });
            }

















        };

    });