function SReadDID_Document(isInitialisation, seedSSI) {
    let DID_mixin = require("./ConstDID_Document_Mixin");
    let tokens;
    let sReadSSI;

    const PUB_KEY_PATH = "publicKey";
    DID_mixin(this);

    const openDSU = require("opendsu");
    const keySSISpace = openDSU.loadAPI("keyssi");
    const resolver = openDSU.loadAPI("resolver");

    const createSeedDSU = async () => {
        try {
            this.dsu = await $$.promisify(resolver.createDSUForExistingSSI)(seedSSI);
        } catch (e) {
            throw createOpenDSUErrorWrapper(`Failed to create seed dsu`, e);
        }

        let ssi;
        try {
            ssi = await $$.promisify(keySSISpace.createSeedSSI)(seedSSI.getDLDomain());
        } catch (e) {
            throw createOpenDSUErrorWrapper(`Failed to create seed ssi`, e);
        }

        this.privateKey = ssi.getPrivateKey();
        this.dispatchEvent("privateKey");
        const publicKey = ssi.getPublicKey("raw");
        try {
            await $$.promisify(this.dsu.writeFile)(PUB_KEY_PATH, publicKey);
        } catch (e) {
            throw createOpenDSUErrorWrapper(`Failed to write public key in dsu`, e);
        }
    };

    this.init = async () => {
        if (typeof seedSSI === "string") {
            try {
                seedSSI = keySSISpace.parse(seedSSI);
            } catch (e) {
                throw createOpenDSUErrorWrapper(`Failed to parse ssi ${seedSSI}`, e);
            }
        }

        if (isInitialisation) {
            sReadSSI = seedSSI.derive();
            await createSeedDSU();
            this.finishInitialisation();
            this.dispatchEvent("initialised");
        } else {
            tokens = seedSSI;
            sReadSSI = tokens.join(":");
            sReadSSI = keySSISpace.parse(sReadSSI);
            seedSSI = undefined;

            try {
                this.dsu = await $$.promisify(resolver.loadDSU)(sReadSSI);
            } catch (e) {
                throw createOpenDSUErrorWrapper(`Failed to load dsu`, e);
            }

            this.finishInitialisation();
            this.dispatchEvent("initialised");
        }
    };

    this.getDomain = () => {
        let domain;
        if (!isInitialisation) {
            domain = sReadSSI.getDLDomain();
        } else {
            domain = seedSSI.getDLDomain();
        }

        return domain;
    }

    this.getIdentifier = () => {
        return `did:${sReadSSI.getIdentifier(true)}`
    };

    const bindAutoPendingFunctions = require("../../utils/BindAutoPendingFunctions").bindAutoPendingFunctions;
    bindAutoPendingFunctions(this, ["init", "getIdentifier", "getDomain", "on", "off"]);

    this.init();
    return this;
}

module.exports = {
    initiateDIDDocument: function (seedSSI) {
        return new SReadDID_Document(true, seedSSI)
    },
    createDIDDocument: function (tokens) {
        return new SReadDID_Document(false, tokens.slice(1));
    }
};
