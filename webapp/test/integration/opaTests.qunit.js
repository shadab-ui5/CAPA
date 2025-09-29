/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["hodek/capa/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
