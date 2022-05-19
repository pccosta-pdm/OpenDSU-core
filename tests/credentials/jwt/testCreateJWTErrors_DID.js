require("../../../../../psknode/bundles/testsRuntime");

const dc = require("double-check");
const assert = dc.assert;
const tir = require("../../../../../psknode/tests/util/tir");

const openDSU = require("../../../index");
$$.__registerModule("opendsu", openDSU);
const w3cDID = openDSU.loadAPI("w3cdid");
const scAPI = openDSU.loadAPI("sc");
const crypto = openDSU.loadApi("crypto");

const credentials = openDSU.loadApi("credentials");
const {createVc, JWT_ERRORS} = credentials;

const domain = "default";

function launchApiHubAndCreateDIDs(callback) {
    dc.createTestFolder("JWT", async (err, folder) => {
        if (err) {
            return callback(err);
        }

        tir.launchApiHubTestNode(100, folder, async (err) => {
            if (err) {
                return callback(err);
            }

            scAPI.getSecurityContext().on("initialised", async () => {
                try {
                    const issuerDidDocument = await $$.promisify(w3cDID.createIdentity)("ssi:name", domain, crypto.generateRandom(20).toString("hex"));
                    const subjectDidDocument = await $$.promisify(w3cDID.createIdentity)("ssi:name", domain, crypto.generateRandom(20).toString("hex"));
                    callback(undefined, {issuerDidDocument, subjectDidDocument});
                } catch (e) {
                    callback(e);
                }
            });
        });
    });
}

assert.callback("[DID] Test create JWT verifiable credential errors", (callback) => {
    launchApiHubAndCreateDIDs((err, result) => {
        if (err) {
            throw err;
        }

        const jwtOptions = {exp: 1678812494957};
        const {issuerDidDocument, subjectDidDocument} = result;
        const issuer = issuerDidDocument.getIdentifier();
        const subject = subjectDidDocument.getIdentifier();
        createVc("JWT", null, subject, jwtOptions, (invalidIssuerFormatError) => {
            assert.notNull(invalidIssuerFormatError);
            assert.equal(invalidIssuerFormatError, JWT_ERRORS.INVALID_ISSUER_FORMAT);

            createVc("JWT", "invalidIssuer" + issuer, subject, jwtOptions, (invalidIssuerFormatError) => {
                assert.notNull(invalidIssuerFormatError);
                assert.equal(invalidIssuerFormatError, JWT_ERRORS.INVALID_ISSUER_FORMAT);

                createVc("JWT", issuer, null, jwtOptions, (invalidSubjectFormatError) => {
                    assert.notNull(invalidSubjectFormatError);
                    assert.equal(invalidSubjectFormatError, JWT_ERRORS.INVALID_SUBJECT_FORMAT);

                    createVc("JWT", issuer, "invalidSubject" + subject, jwtOptions, (invalidSubjectFormatError) => {
                        assert.notNull(invalidSubjectFormatError);
                        assert.equal(invalidSubjectFormatError, JWT_ERRORS.INVALID_SUBJECT_FORMAT);

                        callback();
                    });
                });
            });
        });
    });
}, 1000);