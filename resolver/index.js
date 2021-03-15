const KeySSIResolver = require("key-ssi-resolver");
const keySSISpace = require("opendsu").loadApi("keyssi");
const cache = require("../cache");
const sc = require("../sc").createSecurityContext();
let dsuCache = cache.getMemoryCache("DSUs");

const initializeResolver = (options) => {
    options = options || {};
    return KeySSIResolver.initialize(options);
}

const registerDSUFactory = (type, factory) => {
    KeySSIResolver.DSUFactory.prototype.registerDSUType(type, factory);
};

function addDSUInstanceInCache(dsuInstance, callback) {
    dsuInstance.getKeySSIAsString((err, keySSI) => {
        if (err) {
            return OpenDSUSafeCallback(callback)(createOpenDSUErrorWrapper(`Failed to retrieve keySSI`, err));
        }
        dsuCache.set(keySSI, dsuInstance);
        callback(undefined, dsuInstance);
    });
}

const createDSU = (templateKeySSI, options, callback) => {
    if (typeof templateKeySSI === "string") {
        templateKeySSI = keySSISpace.parse(templateKeySSI);
    }
    if (typeof options === "function") {
        callback = options;
        options = undefined;
    }

    const keySSIResolver = initializeResolver(options);
    keySSIResolver.createDSU(templateKeySSI, options, (err, dsuInstance) => {
        if (err) {
            return OpenDSUSafeCallback(callback)(createOpenDSUErrorWrapper(`Failed to create DSU instance`, err));
        }

        function addInCache(err, result){
            if (err)
            {
                return OpenDSUSafeCallback(callback)(createOpenDSUErrorWrapper(`Failed to create DSU instance`, err));
            }
            addDSUInstanceInCache(dsuInstance, callback);
        }

        dsuInstance.getKeySSIAsObject((err, keySSI) => {
            if (err) {
                return OpenDSUSafeCallback(callback)(createOpenDSUErrorWrapper(`Failed to get SeedSSI`, err));
            }

            sc.registerKeySSI(keySSI);
            dsuInstance.dsuLog("DSU created on " + Date.now(), addInCache);
        });
    });
};


const createDSUForExistingSSI = (ssi, options, callback) => {
    if(typeof options === "function"){
        callback = options;
        options = {};
    }
    if(!options){
        options = {};
    }
    options.useSSIAsIdentifier = true;
    createDSU(ssi, options, callback);
};

const loadDSU = (keySSI, options, callback) => {
    if (typeof keySSI === "string") {
        keySSI = keySSISpace.parse(keySSI);
    }

    if (typeof options === "function") {
        callback = options;
        options = undefined;
    }

    const ssiId = keySSI.getIdentifier();
    let fromCache = dsuCache.get(ssiId);
    if (fromCache){
        return callback(undefined, fromCache);
    }
    const keySSIResolver = initializeResolver(options);
    sc.registerKeySSI(keySSI);
    keySSIResolver.loadDSU(keySSI, options, (err, dsuInstance) => {
        if (err) {
            return OpenDSUSafeCallback(callback)(createOpenDSUErrorWrapper(`Failed to load DSU`, err));
        }
        addDSUInstanceInCache(dsuInstance, callback);
    });
};

/*
    boot the DSU in a thread
 */
const getDSUHandler = (dsuKeySSI, bootEvalScript) => {
    throw Error("Not available yet");

    function DSUHandler(){
        switch ($$.environmentType){
            case constants.ENVIRONMENT_TYPES.SERVICE_WORKER_ENVIRONMENT_TYPE:
            case constants.ENVIRONMENT_TYPES.BROWSER_ENVIRONMENT_TYPE:
                if (window.Worker) {
                    let myWorker = new Worker("opendsu");

                }
                break;
            case constants.ENVIRONMENT_TYPES.NODEJS_ENVIRONMENT_TYPE:
                let wt = 'worker_threads';
                const worker = require(wt); //prevent browserify intervention
                break;
            default:
                throw new Error("Unknown environment");
        }

        this.callDSUAPI = function(fn,...args){

        }

    }

    let res  = new DSUHandler();
    let availableFunctions = [
        "addFile",
        "addFiles",
        "addFolder",
        "appendToFile",
        "createFolder",
        "delete",
        //"extractFile",
        //"extractFolder",
        "listFiles",
        "listFolders",
        "mount",
        "readDir",
        "readFile",
        "rename",
        "unmount",
        "writeFile",
        "listMountedDSUs",
        "beginBatch",
        "commitBatch",
        "cancelBatch",
    ];

    function getWrapper(functionName){
        return function(...args){
              res.callDSUAPI(functionName, ...args)
        }.bind(res);
    }

    for(let f of availableFunctions){
        res[f] = getWrapper(f);
    }

    return res;
};


const getRemoteHandler = (dsuKeySSI, remoteURL, presentation) => {
    throw Error("Not available yet");
};

function invalidateDSUCache(dsuKeySSI) {
    let  ssiId = dsuKeySSI;
    if(typeof dsuKeySSI != "string"){
        ssiId = dsuKeySSI.getIdentifier();
    }
    delete dsuCache.set(ssiId,undefined);
}

module.exports = {
    createDSU,
    createDSUForExistingSSI,
    loadDSU,
    getHandler,
    registerDSUFactory,
    invalidateDSUCache
}
