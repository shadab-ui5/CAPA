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
            formatDateToYyyyMmDd: function (oDate) {
                if (!oDate) return;
                const year = oDate.getFullYear();
                const month = String(oDate.getMonth() + 1).padStart(2, '0');
                const day = String(oDate.getDate()).padStart(2, '0');
                return `${day}-${month}-${year}`; // e.g. "2025-08-07"
            },
            formatIcon: function (sStatus) {
                switch (sStatus) {
                    case "ASN Created":
                        return "sap-icon://information"; // yellow icon
                    case "ASN Cancelled":
                        return "sap-icon://cancel"; // red
                    case "Gate Entry Completed":
                        return "sap-icon://inventory"; // green
                    case "Goods Receipt Rejected":
                        return "sap-icon://error"; // red
                    case "Goods Receipt Accepted":
                        return "sap-icon://sys-enter"; // green
                    default:
                        return "sap-icon://question-mark";
                }
            },

            // 2. Format state based on status
            formatState: function (sStatus) {
                switch (sStatus) {
                    case "ASN Created":
                        return "Information"; // Yellow
                    case "ASN Cancelled":
                        return "Warning"; // Red
                    case "Gate Entry Completed":
                        return "Indication06"; // blue
                    case "Goods Receipt Rejected":
                        return "Error"; // Red
                    case "Goods Receipt Accepted":
                        return "Success"; // Green
                    default:
                        return "None";
                }
            },
            formatDateToDDMMYYYY: function (oDate) {
                if (!oDate) return "";

                const date = new Date(oDate);
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
                const yyyy = date.getFullYear();

                return `${dd}-${mm}-${yyyy}`;
            },
            formatter: {
                rowIndex: function (oContext) {
                    if (!oContext || !oContext.getPath()) return "";
                    return parseInt(oContext.getPath().split("/").pop(), 10) + 1;
                }
            },
            /**
         * Calculate days remaining from capaDate to today and return status
         * @param {Date|string} capaDate - Date from OData (Edm.DateTime)
         * @returns {string} - Remaining days or status message
         */
            getCapaCountDown: function (capaDate) {
                if (!capaDate) return "";

                // Convert OData DateTime to JS Date
                let oDate = capaDate instanceof Date ? capaDate : new Date(capaDate);

                // Get today (set time to 00:00:00)
                let oToday = new Date();
                oToday.setHours(0, 0, 0, 0);
                oDate.setHours(0, 0, 0, 0);

                // Calculate difference in days
                let diffTime = oDate.getTime() - oToday.getTime();
                let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Determine status
                let status;
                if(diffDays<0){
                    status="Expired"
                }else{
                    status = (diffDays+1) + " days";
                }
                return status;
            },
            getCapaStatus: function (capaDate) {
                if (!capaDate) return "None";

                // Convert OData DateTime to JS Date
                let oDate = capaDate instanceof Date ? capaDate : new Date(capaDate);

                // Get today (set time to 00:00:00)
                let oToday = new Date();
                oToday.setHours(0, 0, 0, 0);
                oDate.setHours(0, 0, 0, 0);

                // Calculate difference in days
                let diffTime = oDate.getTime() - oToday.getTime();
                let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Determine status
                let status = "";
                if (diffDays > 5) {
                    status = "Success";
                } else {
                    switch (diffDays) {
                        case 5:
                            status = "Success";
                            break;
                        case 4:
                            status = "Success";
                            break;
                        case 3:
                            status = "Warning";
                            break;
                        case 1:
                            status = "Warning";
                            break;
                        case 0:
                            status = "Error";
                            break;
                        default:
                            status = "None"
                            break;
                    }
                }
                return status;
            }

        };

    });