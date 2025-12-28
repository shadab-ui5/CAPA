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

            let oModel = new sap.ui.model.json.JSONModel({
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
                fishbone: [{
                    stepNumber: 1, man: "", machine: "", material: "", method: "", measurment: "", environment: ""
                }]
            });
            if (!oModel.getProperty("/rcaMethod")) {
                oModel.setProperty("/rcaMethod", "5Why");
            }
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteRootCauseAnalysis").attachPatternMatched(this._onRouteMatched, this);
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
            const oCapaModel = this.getView().getModel("capaModel");
            const sMethod = oCapaModel.getProperty("/rcaMethod");

            // if (sMethod === "5Why") {
            this._loadWhyPrevent();
            this._loadWhyProtect();
            // } else {
            this._loadWhyFishbone();
            // }
            console.log(this._sCapaId);
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

        onSave: function () {
            const oModel = this.getView().getModel("capaModel");
            const sMethod = oModel.getProperty("/rcaMethod");

            if (sMethod === "5Why") {
                Model.onSaveFiveWhy(this);
                Model.onSaveWhyProtect(this);
            } else {
                Model.onSaveFish(this);
            }
        },
        _loadWhyPrevent: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            oView.setBusy(true);

            oODataModel.read("/WhyPrevent", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData.results.length === 0) {
                        return;
                    }
                    const aFiveWhys = (oData.results || []).map(item => ({
                        stepNumber: Number(item.cause),
                        cause: item.probablecause || "",
                        definition: item.problemdef || "",
                        why1: item.onewhy || "",
                        why2: item.twowhy || "",
                        why3: item.threewhy || "",
                        why4: item.fourwhy || "",
                        why5: item.fivewhy || "",
                        contribution: item.percontribution || ""
                    }));

                    oCapaModel.setProperty("/fiveWhys", aFiveWhys);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load 5 Why Preventive data");
                }
            });
        },
        _loadWhyProtect: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            oView.setBusy(true);

            oODataModel.read("/WhyProtect", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData.results.length === 0) {
                        return;
                    }
                    const aFiveWhysProtect = (oData.results || []).map(item => ({
                        stepNumber: Number(item.cause),
                        cause: item.probablecause || "",
                        definition: item.problemdef || "",
                        why1: item.onewhy || "",
                        why2: item.twowhy || "",
                        why3: item.threewhy || "",
                        why4: item.fourwhy || "",
                        why5: item.fivewhy || "",
                        contribution: item.percontribution || ""
                    }));

                    oCapaModel.setProperty("/fiveWhysprotect", aFiveWhysProtect);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load 5 Why Protect data");
                }
            });
        },
        _loadWhyFishbone: function () {
            const oView = this.getView();
            const oODataModel = this.getOwnerComponent().getModel("capaServiceModel");
            const oCapaModel = oView.getModel("capaModel");
            const sCapaId = this._sCapaId;

            oView.setBusy(true);

            oODataModel.read("/WhyFishbone", {
                filters: [
                    new sap.ui.model.Filter("capaid", sap.ui.model.FilterOperator.EQ, sCapaId)
                ],
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData.results.length === 0) {
                        return;
                    }
                    const aFishbone = (oData.results || []).map(item => ({
                        stepNumber: Number(item.cause),
                        man: item.man || "",
                        machine: item.machine || "",
                        material: item.materialfield || "",
                        method: item.method || "",
                        measurment: item.measurement || "",
                        environment: item.environment || ""
                    }));

                    oCapaModel.setProperty("/fishbone", aFishbone);
                },
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to load Fishbone data");
                }
            });
        }






    });
});