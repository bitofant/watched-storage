"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const observed_storage_1 = require("./shared/observed-storage");
exports.watchedObject = observed_storage_1.default;
const storage_server_1 = require("./server/storage-server");
exports.storageServer = storage_server_1.default;
const storage_client_1 = require("./client/storage-client");
exports.storageClient = storage_client_1.default;
exports.default = {
    watchedObject: observed_storage_1.default,
    storageServer: storage_server_1.default,
    storageClient: storage_client_1.default
};
//# sourceMappingURL=index.js.map