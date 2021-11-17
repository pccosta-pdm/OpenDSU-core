function storeDIDInSC(didDocument, callback) {
    const securityContext = require("opendsu").loadAPI("sc").getSecurityContext();
    const __registerDID = () => {
        securityContext.registerDID(didDocument, (err) => {
            if (err) {
                return callback(createOpenDSUErrorWrapper(`failed to register did ${didDocument.getIdentifier()} in security context`, err));
            }

            callback(null, didDocument);
        })
    }
    if (securityContext.isInitialised()) {
        __registerDID();
    } else {
        securityContext.on("initialised", () => {
            __registerDID()
        })
    }
}

function SReadDID_Method() {
    let SReadDID_Document = require("./SReadDID_Document");
    this.create = (seedSSI, callback) => {
        const sReadDIDDocument = SReadDID_Document.initiateDIDDocument(seedSSI);
        sReadDIDDocument.on("error", (err) => {
            callback(err);
        });

        sReadDIDDocument.on("initialised", () => {
            callback(undefined, sReadDIDDocument);
        });
    }
    this.resolve = function (tokens, callback) {
        const sReadDIDDocument = SReadDID_Document.createDIDDocument(tokens);
        sReadDIDDocument.on("initialised", () => {
            callback(undefined, sReadDIDDocument);
        });
    }
}

function KeyDID_Method() {
    let KeyDIDDocument = require("./KeyDID_Document");
    this.create = function (enclave, seedSSI, callback) {
        const keyDIDDocument = KeyDIDDocument.initiateDIDDocument(enclave, seedSSI);
        keyDIDDocument.on("initialised", () => {
            callback(undefined, keyDIDDocument);
        })
    }

    this.resolve = function (tokens, callback) {
        callback(null, KeyDIDDocument.createDIDDocument(tokens))
    }
}

function NameDID_Method() {
    const NameDIDDocument = require("./NameDID_Document");

    this.create = (enclave, domain, publicName, callback) => {
        const nameDIDDocument = NameDIDDocument.initiateDIDDocument(enclave, domain, publicName);

        nameDIDDocument.on("error", (err) => {
            return callback(err);
        })

        nameDIDDocument.on("initialised", () => {
            callback(undefined, nameDIDDocument);
        });
    }

    this.resolve = (tokens, callback) => {
        const nameDIDDocument = NameDIDDocument.createDIDDocument(tokens);
        nameDIDDocument.on("error", (err) => {
            return callback(err);
        })

        nameDIDDocument.on("initialised", () => {
            callback(null, nameDIDDocument)
        });
    }
}

function GroupDID_Method() {
    const GroupDIDDocument = require("./GroupDID_Document");

    this.create = (enclave, domain, groupName, callback) => {
        const groupDIDDocument = GroupDIDDocument.initiateDIDDocument(domain, groupName);

        groupDIDDocument.on("error", (err) => {
            return callback(err);
        })

        groupDIDDocument.on("initialised", () => {
            callback(undefined, groupDIDDocument);
        })
    }

    this.resolve = (tokens, callback) => {
        const groupDIDDocument = GroupDIDDocument.createDIDDocument(tokens);

        groupDIDDocument.on("error", (err) => {
            return callback(err);
        })

        groupDIDDocument.on("initialised", () => {
            return callback(undefined, groupDIDDocument);
        })
    }
}

function create_KeyDID_Method() {
    return new KeyDID_Method();
}

function create_SReadDID_Method() {
    return new SReadDID_Method();
}

function create_NameDID_Method() {
    return new NameDID_Method();
}

function create_GroupDID_Method() {
    return new GroupDID_Method();
}


module.exports = {
    create_KeyDID_Method,
    create_SReadDID_Method,
    create_NameDID_Method,
    create_GroupDID_Method
}
