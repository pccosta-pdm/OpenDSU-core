require("../../../../builds/output/testsRuntime");
const tir = require("../../../../psknode/tests/util/tir");

const dc = require("double-check");
const assert = dc.assert;
const openDSU = require('../../index');
$$.__registerModule("opendsu", openDSU);
const enclaveAPI = openDSU.loadAPI("enclave");
const scAPI = openDSU.loadAPI("sc");
const w3cDID = openDSU.loadAPI("w3cdid");


assert.callback('Remote enclave test', (testFinished) => {
    dc.createTestFolder('createDSU', async (err, folder) => {
        const vaultDomainConfig = {
            "anchoring": {
                "type": "FS",
                "option": {}
            },
            "enable": ["enclave", "mq"]
        }

        const domain = "mqtestdomain";
        await tir.launchConfigurableApiHubTestNodeAsync({domains: [{name: domain, config: vaultDomainConfig}], rootFolder: folder});

        const runAssertions = async () => {
            try {
                const DB_NAME = "test_db";
                const lokiAdapterClient = enclaveAPI.initialiseLightDBEnclaveClient(DB_NAME)
                const TABLE = "test_table";
                const addedRecord = {data: 1};
                try {
                    await $$.promisify(lokiAdapterClient.createDatabase)(DB_NAME);
                    await $$.promisify(lokiAdapterClient.grantWriteAccess)("some_did");
                    await $$.promisify(lokiAdapterClient.insertRecord)("some_did", TABLE, "pk1", addedRecord);
                    await $$.promisify(lokiAdapterClient.insertRecord)("some_did", TABLE, "pk2", addedRecord);
                    const record = await $$.promisify(lokiAdapterClient.getRecord)("some_did", TABLE, "pk1");
                    assert.objectsAreEqual(record, addedRecord, "Records do not match");
                    const allRecords = await $$.promisify(lokiAdapterClient.getAllRecords)("some_did", TABLE);

                    assert.equal(allRecords.length, 2, "Not all inserted records have been retrieved")
                    testFinished();
                } catch (e) {
                    return console.log(e);
                }
            } catch (e) {
                return console.log(e);
            }
        }
        const sc = scAPI.getSecurityContext();
        if (sc.isInitialised()) {
            return runAssertions();
        }
        sc.on("initialised", runAssertions);
    });
}, 20000);
